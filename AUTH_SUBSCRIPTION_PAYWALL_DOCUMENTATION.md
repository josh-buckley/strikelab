# Authentication, Subscription & Paywall System Documentation

**Last Updated:** January 2026 (Post-Refactor)

This document provides comprehensive documentation of how StrikeLab handles user authentication, subscription verification, and paywall presentation after all fixes have been applied.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Provider Hierarchy & Architecture](#2-provider-hierarchy--architecture)
3. [Authentication (Supabase)](#3-authentication-supabase)
4. [Subscriptions (RevenueCat)](#4-subscriptions-revenuecat)
5. [Paywall (Superwall + PaywallContext)](#5-paywall-superwall--paywallcontext)
6. [Route Protection & Navigation](#6-route-protection--navigation)
7. [Login & Onboarding Flows](#7-login--onboarding-flows)
8. [Complete User Flows](#8-complete-user-flows)
9. [AsyncStorage Keys Reference](#9-asyncstorage-keys-reference)
10. [Database Tables Created on Auth](#10-database-tables-created-on-auth)
11. [File Reference](#11-file-reference)
12. [Verification Checklist](#12-verification-checklist)

---

## 1. System Overview

### Technology Stack

| Concern | Technology | Key File(s) |
|---------|------------|-------------|
| Authentication | Supabase | `lib/AuthProvider.tsx`, `lib/supabase.ts` |
| Subscription Management | RevenueCat | `lib/revenueCat.ts` |
| Paywall UI | Superwall | `contexts/PaywallContext.tsx` |
| User Profile Creation | Shared Utility | `lib/userProfile.ts` |
| Route Protection | Expo Router | `app/_layout.tsx`, `app/(auth)/_layout.tsx` |

### Key Design Decisions

1. **Single PaywallProvider** - Only one instance at the root level
2. **Superwall handles StoreKit** - Purchases go through Superwall, synced to RevenueCat
3. **Idempotent profile creation** - `ensureUserProfile()` is safe to call multiple times
4. **Consistent state persistence** - All subscription state changes persist to AsyncStorage
5. **Extended purchase verification** - Up to 6 retry attempts for sandbox purchases

---

## 2. Provider Hierarchy & Architecture

### Provider Structure (`app/_layout.tsx`)

```
RootLayout
└── AuthProvider              ← Manages Supabase auth
    └── PaywallProvider       ← Manages subscription state, Superwall, RevenueCat
        └── Layout            ← Navigation logic
            └── WorkoutProvider
                └── Stack Navigator
```

**Important:** There is only ONE `PaywallProvider` in the entire app. This was fixed from the previous double-nesting issue.

### Initialization Order

```
1. AuthProvider mounts
   ├── Checks AsyncStorage for onboarding status (once, via ref)
   ├── Calls supabase.auth.getSession()
   ├── Sets up onAuthStateChange listener
   └── If session exists → fetchProfile()

2. PaywallProvider mounts
   ├── Loads cached subscription status from AsyncStorage
   ├── Initializes Superwall (platform-specific key)
   ├── Initializes RevenueCat
   ├── Sets up customerInfoUpdateListener
   └── Sets loading = false

3. Layout component runs navigation effect
   ├── Waits for: isMounted, !authLoading, !subscriptionLoading, !isPreloading, loaded
   ├── Checks justSubscribed flag
   └── Routes based on session + subscription state
```

---

## 3. Authentication (Supabase)

### File: `lib/AuthProvider.tsx`

### State

| State | Type | Description |
|-------|------|-------------|
| `user` | `User \| null` | Supabase User object |
| `session` | `Session \| null` | Current auth session |
| `profile` | `UserProfile \| null` | User profile from `users` table |
| `loading` | `boolean` | Auth operation in progress |
| `error` | `string \| null` | Error message |
| `initialized` | `boolean` | Provider startup complete |
| `isFirstLaunch` | `boolean` | Onboarding not yet completed |

### Key Methods

#### `fetchProfile(userId, retryCount)`
Fetches user profile with exponential backoff retry:
- Retries up to 3 times on `PGRST116` (not found) error
- Delays: 2s, 4s, 8s between retries
- Validates profile has `id` and `email` fields

#### `signOut()`
```typescript
1. Call supabase.auth.signOut()
2. Clear all state (user, session, profile)
3. Set loading = false, initialized = true
```

#### `markOnboardingCompleted()`
Sets `strikelab_onboarding_completed` to `'true'` in AsyncStorage.

#### `checkOnboardingCompleted()`
Returns `true` if onboarding has been completed.

### Onboarding Check (Fixed)

The onboarding check now runs **only once on mount** using a ref:

```typescript
const hasCheckedOnboarding = useRef(false);

useEffect(() => {
  if (hasCheckedOnboarding.current) return;
  hasCheckedOnboarding.current = true;
  // Check onboarding status...
}, []);
```

**This fixed the previous issue** where the check ran on every session change and could cause unexpected sign-outs.

---

## 4. Subscriptions (RevenueCat)

### File: `lib/revenueCat.ts`

### Configuration

```typescript
export const ENTITLEMENT_ID = 'Premium Access';
export const PRODUCT_IDS = {
  MONTHLY: 'com.joshbuckley.strikelab.premium.monthly',
  ANNUAL: 'com.joshbuckley.strikelab.premium.annual'
};
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `initializeRevenueCat()` | Configure RevenueCat SDK (singleton) |
| `getCustomerInfo()` | Get full CustomerInfo object |
| `hasActiveSubscription()` | Boolean check for Premium Access |
| `getSubscriptionDetails()` | Returns `{ isSubscribed, isTrialActive, subscriptionType }` |
| `identifyUser(userId)` | Link Supabase user to RevenueCat |
| `resetUser()` | Clear user identification on sign out |
| `syncPurchases()` | **NEW** - Sync StoreKit purchases to RevenueCat |
| `restorePurchases()` | Restore previous purchases |
| `setupCustomerInfoListener()` | Listen for subscription changes |

### syncPurchases() - Critical for Superwall Integration

```typescript
export async function syncPurchases(): Promise<void> {
  await ensureInitialized();
  await Purchases.syncPurchases();
}
```

**Why this is important:** When Superwall handles a purchase via StoreKit, RevenueCat doesn't automatically know about it. Calling `syncPurchases()` notifies RevenueCat of the purchase.

---

## 5. Paywall (Superwall + PaywallContext)

### File: `contexts/PaywallContext.tsx`

### State

| State | Type | Description |
|-------|------|-------------|
| `isSubscribed` | `boolean` | Has active subscription |
| `isTrialActive` | `boolean` | Currently on trial |
| `subscriptionType` | `'monthly' \| 'annual' \| null` | Subscription tier |
| `loading` | `boolean` | Async operation in progress |
| `hasShownPaywall` | `boolean` | **NEW** - Prevents duplicate paywall presentations |

### Key Methods

#### `updateSubscriptionState(subscribed, type, trial)`
Helper that updates both React state AND AsyncStorage:
```typescript
setIsSubscribed(subscribed);
setSubscriptionType(type);
setIsTrialActive(trial);
await persistSubscriptionState(subscribed, type, trial);
// Also updates Superwall.shared.subscriptionStatus
```

#### `checkSubscription()`

Handles multiple scenarios:

**Scenario A: No Session (Anonymous User)**
```
1. Check for pending_subscription_state (< 1 hour old)
2. If valid pending state → restore and return
3. Check RevenueCat for anonymous subscription
4. If found → updateSubscriptionState() + store for transfer
```

**Scenario B: Session + Anonymous Subscription Transfer**
```
1. Identify user with RevenueCat
2. Check for strikelab_anon_subscription_type in AsyncStorage
3. Verify subscription (3 attempts with delays)
4. Clear anonymous flags
5. Create user profile
```

**Scenario C: Normal Authenticated User**
```
1. Call getSubscriptionDetails()
2. updateSubscriptionState() with result
3. Create user profile if subscribed
```

#### `presentPaywall(identifier)` - Purchase Flow

```
1. Check if already subscribed → return early
2. Check if hasShownPaywall → return early (NEW)
3. Set hasShownPaywall = true
4. Call Superwall.shared.register(identifier)
5. On callback:
   a. syncPurchases() ← CRITICAL for RevenueCat
   b. Wait 1 second
   c. Initial verification (3 attempts, 1.5s-4.5s delays)
   d. Extended verification (3 attempts, 3s-8s delays) ← For sandbox
   e. Receipt-based fallback as last resort
6. Set justSubscribed flag if verified
7. Update subscription state
```

**Purchase Verification Timeline:**
```
Superwall callback
    ↓
syncPurchases()
    ↓ (1s delay)
Attempt 1 → Check RevenueCat
    ↓ (1.5s delay)
Attempt 2 → syncPurchases() + Check
    ↓ (3s delay)
Attempt 3 → syncPurchases() + Check
    ↓ (3s delay) ← Extended verification starts
Extended 1 → Check RevenueCat
    ↓ (5s delay)
Extended 2 → Check RevenueCat
    ↓ (8s delay)
Extended 3 → Check RevenueCat
    ↓
Receipt Fallback → Superwall.shared.getAppStoreReceipt()
```

**Total verification time:** Up to ~25 seconds before giving up.

### Session Change Effect

When session changes:
- **Session exists:** Call `checkSubscription()`
- **No session:**
  - Reset `hasShownPaywall` to false
  - Reset RevenueCat user (if was identified)
  - Clear subscription state
  - Persist cleared state to AsyncStorage

---

## 6. Route Protection & Navigation

### File: `app/_layout.tsx`

### Navigation Logic

The Layout component runs a navigation effect that:

1. **Waits for all loading states:**
   - `isMounted` = true
   - `authLoading` = false
   - `subscriptionLoading` = false
   - `isPreloading` = false
   - `loaded` (fonts) = true

2. **Checks justSubscribed flag first:**
   ```typescript
   if (justSubscribed && !hasNavigatedAfterSubscription.current) {
     hasNavigatedAfterSubscription.current = true;
     await clearJustSubscribedFlag();
     router.replace('/(tabs)');
     return;
   }
   ```

3. **Routes based on state:**

| Session | Subscribed | Location | Action |
|---------|------------|----------|--------|
| No | - | Not in (auth) | → onboarding or login |
| No | - | In (auth) | Allow |
| Yes | Yes | Not in (tabs) or create-workout | → /(tabs) |
| Yes | Yes | In (tabs) or create-workout | Allow |
| Yes | No | Not in (auth) | → login |
| Yes | No | In (auth) | Allow |

### File: `app/(auth)/_layout.tsx`

Secondary protection within auth group:

- **Always allow:** paywall, login screens
- **Allow if no session:** onboarding screen
- **Redirect subscribed users:** → /(tabs)
- **Redirect unsubscribed users:** → login (from other auth screens)

---

## 7. Login & Onboarding Flows

### Onboarding Flow

**Directory:** `app/(auth)/onboarding/`

```
Screen 1-9: Onboarding screens
Screen 9 "Get Started" button:
  → markOnboardingCompleted()
  → router.replace('/(auth)/login')
```

### Login Screen

**File:** `app/(auth)/login.tsx`

**On Mount:**
```typescript
useEffect(() => {
  presentPaywall('test_paywall');
}, []);
```

The paywall is presented immediately when the login screen mounts.

**Authentication Methods:**

1. **Email Sign In:**
   - `supabase.auth.signInWithPassword()`
   - If subscribed → `markOnboardingCompleted()`
   - → `router.replace('/(tabs)')`

2. **Email Sign Up:**
   - `supabase.auth.signUp()`
   - Wait for session (5 attempts)
   - `ensureUserProfile(user)`
   - → `router.replace('/(tabs)')`

3. **Apple Sign In:**
   - `AppleAuthentication.signInAsync()`
   - `supabase.auth.signInWithIdToken()`
   - If subscribed → `markOnboardingCompleted()`
   - → `router.replace('/(tabs)')`

---

## 8. Complete User Flows

### Flow 1: New User - Complete Purchase

```
1. App starts → AuthProvider initializes → no session
2. PaywallProvider initializes → no subscription
3. Layout redirects to /(auth)/onboarding
4. User completes 9 onboarding screens
5. Screen 9 "Get Started" → markOnboardingCompleted()
6. Router navigates to /(auth)/login
7. Login screen mounts → presentPaywall('test_paywall')
8. hasShownPaywall set to true
9. Superwall paywall UI appears
10. User purchases subscription
11. Superwall callback fires
12. syncPurchases() called → RevenueCat notified
13. Verification loop (up to 6 attempts)
14. Subscription verified → setJustSubscribedFlag()
15. State updated + persisted to AsyncStorage
16. Layout detects justSubscribed flag
17. Flag cleared, user redirected to /(tabs)
```

### Flow 2: New User - Dismiss Paywall

```
1-8. Same as Flow 1
9. User dismisses paywall (doesn't purchase)
10. isSubscribed remains false
11. User stays on login screen
12. hasShownPaywall = true (paywall won't auto-show again)
13. User can sign in with Apple → redirects to /(tabs)
14. Layout will redirect to login if not subscribed
```

### Flow 3: Returning User (Subscribed)

```
1. App starts → AuthProvider initializes
2. Session found in SecureStore
3. fetchProfile() called (with retry logic)
4. PaywallProvider initializes
5. Cached subscription loaded from AsyncStorage
6. checkSubscription() verifies with RevenueCat
7. Layout effect runs → detects subscribed
8. User redirected to /(tabs)
```

### Flow 4: Returning User (Not Subscribed)

```
1-6. Same as Flow 3, but not subscribed
7. Layout effect runs → detects not subscribed
8. User redirected to /(auth)/login
9. Login mounts → presentPaywall('test_paywall')
10. User can purchase or dismiss
```

### Flow 5: Anonymous Purchase → Login

```
1. User on login screen (no session)
2. Purchases via Superwall (anonymous)
3. RevenueCat tracks as anonymous user
4. Subscription verified, state updated
5. strikelab_anon_subscription_type set
6. User signs in with Apple
7. checkSubscription() runs
8. Detects anonymous subscription flags
9. identifyUser() links to RevenueCat
10. Verifies subscription (3 attempts)
11. Clears anonymous flags
12. Creates user profile
13. User redirected to /(tabs)
```

### Flow 6: Sign Out

```
1. User calls signOut()
2. AuthProvider: supabase.auth.signOut()
3. AuthProvider: Clears user, session, profile
4. PaywallProvider: Detects session = null
5. PaywallProvider: hasShownPaywall = false
6. PaywallProvider: resetUser() if was identified
7. PaywallProvider: Clears subscription state + AsyncStorage
8. Layout: Detects no session
9. User redirected to /(auth)/onboarding or /(auth)/login
```

### Flow 7: App Store Review (Sandbox Purchase)

```
1. Reviewer opens production app
2. Navigates to login → paywall presented
3. Purchases via sandbox environment
4. Superwall callback fires
5. syncPurchases() → RevenueCat notified of sandbox receipt
6. Initial verification attempts (may fail - sandbox delay)
7. Extended verification attempts (3s, 5s, 8s delays)
8. RevenueCat eventually syncs sandbox receipt
9. Subscription verified
10. Reviewer gets access to app
```

---

## 9. AsyncStorage Keys Reference

| Key | Type | Purpose | Set By |
|-----|------|---------|--------|
| `strikelab_onboarding_completed` | `'true'` | Onboarding completed | AuthProvider |
| `strikelab_is_subscribed` | `'true'/'false'` | Cached subscription status | PaywallContext |
| `strikelab_subscription_type` | `'monthly'/'annual'` | Cached subscription tier | PaywallContext |
| `strikelab_is_trial` | `'true'/'false'` | Cached trial status | PaywallContext |
| `strikelab_just_subscribed` | `'true'` | Navigation flag after purchase | PaywallContext |
| `strikelab_rc_identified` | `'true'` | User identified with RevenueCat | revenueCat.ts |
| `strikelab_anon_subscription_type` | `'monthly'/'annual'` | Anonymous subscription for transfer | PaywallContext |
| `strikelab_anon_is_trial` | `'true'/'false'` | Anonymous trial status | PaywallContext |
| `pending_subscription_state` | JSON | Recovery state if session expires | PaywallContext |

---

## 10. Database Tables Created on Auth

### Via `ensureUserProfile()` in `lib/userProfile.ts`

This function is **idempotent** - safe to call multiple times.

#### 1. `users` table
```sql
{
  id: uuid,           -- Supabase auth user ID
  email: string,
  stance: 'orthodox'  -- Default value
}
```

#### 2. `user_levels` table
```sql
{
  user_id: uuid,
  punches_level: 1, punches_xp: 0,
  kicks_level: 1, kicks_xp: 0,
  elbows_level: 1, elbows_xp: 0,
  knees_level: 1, knees_xp: 0,
  footwork_level: 1, footwork_xp: 0,
  clinch_level: 1, clinch_xp: 0,
  defensive_level: 1, defensive_xp: 0,
  sweeps_level: 1, sweeps_xp: 0,
  feints_level: 1, feints_xp: 0
}
```

#### 3. `category_progress` table
9 entries, one per category:
```sql
{
  user_id: uuid,
  name: string,  -- 'punches', 'kicks', etc.
  xp: 0,
  level: 1
}
```

#### 4. `daily_xp_tracker` table
```sql
{
  user_id: uuid,
  date: today,
  workout_count: 0
}
```

---

## 11. File Reference

| File | Purpose |
|------|---------|
| `lib/AuthProvider.tsx` | Supabase auth context, session management |
| `lib/supabase.ts` | Supabase client configuration |
| `lib/revenueCat.ts` | RevenueCat SDK wrapper, syncPurchases() |
| `lib/userProfile.ts` | **NEW** - Shared idempotent profile creation |
| `lib/database.types.ts` | Generated Supabase types |
| `contexts/PaywallContext.tsx` | Subscription state, Superwall integration |
| `app/_layout.tsx` | Root layout, single PaywallProvider, navigation |
| `app/(auth)/_layout.tsx` | Auth group layout, secondary protection |
| `app/(auth)/login.tsx` | Login/signup screen, paywall on mount |
| `app/(auth)/onboarding/` | Onboarding flow screens |

---

## 12. Verification Checklist

### Architecture Verification

- [x] **Single PaywallProvider** - Only in RootLayout, not in Layout
- [x] **Single Superwall init** - Only in PaywallContext, not in _layout.tsx
- [x] **Consistent state persistence** - All subscription changes use updateSubscriptionState()
- [x] **Idempotent profile creation** - ensureUserProfile() checks before creating
- [x] **justSubscribed flag cleared** - Cleared in Layout after navigation
- [x] **hasShownPaywall prevents duplicates** - Checked in presentPaywall()
- [x] **Onboarding check runs once** - Uses hasCheckedOnboarding ref

### Purchase Flow Verification

- [x] **syncPurchases() called** - After Superwall callback
- [x] **Extended verification** - 6 total attempts for sandbox
- [x] **Receipt fallback** - Uses Superwall.getAppStoreReceipt() as last resort
- [x] **Anonymous purchases handled** - Stored for transfer on login
- [x] **Session validation non-blocking** - Anonymous purchases still work

### Sign Out Verification

- [x] **hasShownPaywall reset** - Set to false on sign out
- [x] **RevenueCat user reset** - If was identified
- [x] **Subscription state cleared** - Both React state and AsyncStorage
- [x] **Superwall status set inactive** - subscriptionStatus = 'inactive'

---

## Summary

The auth/subscription/paywall system is now properly structured with:

1. **Clean provider hierarchy** - No duplicate providers
2. **Robust purchase verification** - Extended retries for sandbox
3. **Consistent state management** - All changes persist to AsyncStorage
4. **Proper flag handling** - justSubscribed and hasShownPaywall work correctly
5. **Idempotent operations** - Profile creation is safe to call multiple times
6. **App Store review support** - syncPurchases() and extended verification handle sandbox receipts

The system should now pass App Store review without IAP errors.
