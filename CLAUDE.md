# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StrikeLab is a React Native/Expo mobile app for tracking Muay Thai and kickboxing training. It gamifies training with body-part-specific progression, XP systems, and AI coaching features.

## Development Commands

```bash
npm start              # Start Expo development server
npm run ios            # Run on iOS simulator (requires Xcode)
npm run android        # Run on Android emulator
npm run web            # Run web version
npm test               # Run Jest tests in watch mode
npm run lint           # Run Expo lint
```

For a single test file: `npm test -- path/to/test.test.ts --watchAll=false`

## Architecture

### Tech Stack
- **Framework**: React Native 0.76 + Expo 52 + TypeScript (strict mode)
- **Routing**: Expo Router (file-based routing in `/app`)
- **Backend**: Supabase (auth, PostgreSQL database)
- **Payments**: RevenueCat + Superwall for subscriptions/paywalls
- **AI**: OpenAI + Google Gemini for coaching features

### Directory Structure
```
/app                    # Expo Router file-based routing
  /(auth)               # Auth flows: login, onboarding, paywall
  /(tabs)               # Main tab interface (5 tabs)
  /create-workout       # Multi-step workout creation flow
/lib                    # Core services and utilities
  - AuthProvider.tsx    # Supabase auth context
  - supabase.ts         # Supabase client
  - database.types.ts   # Generated Supabase types
  - revenueCat.ts       # Subscription management
  - gemini.ts, openai.ts # AI integrations
/contexts               # React Context providers
  - PaywallContext.tsx  # Subscription state
  - WorkoutContext.tsx  # Workout creation state
/hooks                  # Custom React hooks
/data                   # Static data (techniques, ranks)
/constants              # App constants (colors, themes)
```

### Key Architectural Patterns

**Provider Hierarchy** (in `app/_layout.tsx`):
```
AuthProvider → PaywallProvider → WorkoutProvider → Stack Navigator
```

**Route Protection Flow**:
1. `AuthProvider` manages session state from Supabase
2. `PaywallContext` tracks subscription status via RevenueCat
3. Root layout redirects based on: session exists → is subscribed → route to tabs or paywall

**Path Alias**: Use `@/` for imports (maps to project root)

### Database
Types are generated from Supabase in `lib/database.types.ts`. Main tables:
- `users` - User profiles
- `user_progress` - Body part XP/levels
- `workout_templates` - Saved workouts
- `template_components` - Techniques in templates
- `daily_xp_tracker` - Daily workout/XP tracking

### Environment Variables
Required in `.env`:
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_SUPERWALL_IOS_KEY`, `EXPO_PUBLIC_SUPERWALL_ANDROID_KEY`
- `EXPO_PUBLIC_REVENUE_CAT_IOS_KEY`, `EXPO_PUBLIC_REVENUE_CAT_ANDROID_KEY`
- `EXPO_PUBLIC_GEMINI_API_KEY`

## Domain Concepts

- **Techniques**: 60+ fighting techniques categorized (Punches, Kicks, Elbows, Knees, Footwork, Clinch, Defensive, Sweeps, Feints) - defined in `data/strikes.ts`
- **Body Parts**: feet, shins, knees, hands, elbows, ribs - each has independent XP/levels
- **Ranks**: 10 tiers from Novice to Mythical - defined in `data/ranks.ts`
- **XP System**: Diminishing returns for multiple daily sessions (100% → 50% → 25% → 10%)
- **Workout Templates**: Saved combinations of techniques with round/rep structure
