import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';

type TimerState = 'idle' | 'running' | 'paused' | 'rest';

export default function TimerScreen() {
  const { width, height } = useWindowDimensions();
  const timerSize = Math.min(width * 0.9, height * 0.55);

  // Unlock orientation when timer is configured, lock to portrait when not
  useEffect(() => {
    if (configured) {
      ScreenOrientation.unlockAsync();
    }
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, [configured]);
  const [roundMinutes, setRoundMinutes] = useState(3);
  const [restMinutes, setRestMinutes] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [configured, setConfigured] = useState(false);

  const roundDuration = roundMinutes * 60;
  const restDuration = restMinutes * 60;

  const [state, setState] = useState<TimerState>('idle');
  const [timeLeft, setTimeLeft] = useState(roundDuration);
  const [currentRound, setCurrentRound] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state === 'running' || state === 'rest') {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { handleTimeUp(); return prev; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state, currentRound]);

  const handleTimeUp = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    playBell();
    if (state === 'rest') {
      if (currentRound < totalRounds) {
        setCurrentRound((r) => r + 1);
        setTimeLeft(roundDuration);
        setState('running');
      } else {
        setState('idle');
        setCurrentRound(1);
        setTimeLeft(roundDuration);
      }
    } else {
      if (currentRound < totalRounds) {
        setState('rest');
        setTimeLeft(restDuration);
      } else {
        setState('idle');
        setCurrentRound(1);
        setTimeLeft(roundDuration);
      }
    }
  };

  const playBell = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/bell.wav'),
        { shouldPlay: true, volume: 0.7 }
      );
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch {}
  };

  const start = () => {
    if (!configured) setConfigured(true);
    if (state === 'idle') { setCurrentRound(1); setTimeLeft(roundDuration); setState('running'); }
    else if (state === 'paused') setState('running');
  };

  const pause = () => {
    if (state === 'running' || state === 'rest') { setState('paused'); if (intervalRef.current) clearInterval(intervalRef.current); }
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState('idle'); setCurrentRound(1); setTimeLeft(roundDuration);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const isActive = state === 'running' || state === 'rest';
  const isRest = state === 'rest';
  const timerColor = isRest ? '#4CAF50' : '#FFD700';

  // Configuration screen — fills the page
  if (!configured && state === 'idle') {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.timerHeader}>
          <ThemedText style={styles.pageTitle}>timer</ThemedText>
        </ThemedView>

        <ThemedView style={styles.configList}>
          <ThemedView style={styles.configRow}>
            <ThemedText style={styles.configLabel}>Rounds</ThemedText>
            <ThemedView style={styles.stepper}>
              <TouchableOpacity onPress={() => setTotalRounds(Math.max(1, totalRounds - 1))}>
                <ThemedText style={styles.stepperButton}>−</ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.stepperValue}>{totalRounds}</ThemedText>
              <TouchableOpacity onPress={() => setTotalRounds(Math.min(12, totalRounds + 1))}>
                <ThemedText style={styles.stepperButton}>+</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.configRow}>
            <ThemedText style={styles.configLabel}>Round Length</ThemedText>
            <ThemedView style={styles.stepper}>
              <TouchableOpacity onPress={() => setRoundMinutes(Math.max(1, roundMinutes - 1))}>
                <ThemedText style={styles.stepperButton}>−</ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.stepperValue}>{roundMinutes}m</ThemedText>
              <TouchableOpacity onPress={() => setRoundMinutes(Math.min(10, roundMinutes + 1))}>
                <ThemedText style={styles.stepperButton}>+</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.configRow}>
            <ThemedText style={styles.configLabel}>Rest</ThemedText>
            <ThemedView style={styles.stepper}>
              <TouchableOpacity onPress={() => setRestMinutes(Math.max(0, restMinutes - 1))}>
                <ThemedText style={styles.stepperButton}>−</ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.stepperValue}>{restMinutes}m</ThemedText>
              <TouchableOpacity onPress={() => setRestMinutes(Math.min(5, restMinutes + 1))}>
                <ThemedText style={styles.stepperButton}>+</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <TouchableOpacity style={styles.startButton} onPress={start}>
          <ThemedText style={styles.startButtonText}>Start</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.timerHeader}>
        <ThemedText style={styles.pageTitle}>timer</ThemedText>
      </ThemedView>

      {/* Round indicator */}
      <ThemedView style={styles.roundInfo}>
        <ThemedText style={styles.roundLabel}>
          {isRest ? 'REST' : `ROUND ${currentRound}`}
        </ThemedText>
        <ThemedText style={styles.roundSub}>
          {isRest ? 'Next round soon' : `of ${totalRounds}`}
        </ThemedText>
      </ThemedView>

      {/* Round dots */}
      <ThemedView style={styles.dotsRow}>
        {Array.from({ length: totalRounds }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < currentRound - (isRest ? 0 : 1) && styles.dotDone,
              i === currentRound - 1 && !isRest && styles.dotCurrent,
              i === currentRound - 1 && isRest && styles.dotNext,
            ]}
          />
        ))}
      </ThemedView>

      {/* Timer — static ring, dynamic sizing */}
      <TouchableOpacity style={[styles.timerContainer, { width: timerSize, height: timerSize }]} onPress={isActive ? pause : start} activeOpacity={0.8}>
        <View style={[styles.timerRing, { width: timerSize, height: timerSize, borderRadius: timerSize / 2, borderColor: timerColor }]} />
        <ThemedText style={[styles.timerText, { fontSize: timerSize * 0.28, lineHeight: timerSize * 0.32, color: timerColor }]}>
          {formatTime(timeLeft)}
        </ThemedText>
      </TouchableOpacity>

      {/* Controls */}
      <ThemedView style={styles.controls}>
        {state === 'paused' && (
          <TouchableOpacity style={styles.controlButton} onPress={reset}>
            <IconSymbol name="arrow.counterclockwise" size={22} color="#666" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.mainButton, isActive && styles.mainButtonActive]} onPress={isActive ? pause : start}>
          <IconSymbol name={isActive ? 'pause.fill' : 'play.fill'} size={28} color="#151718" />
        </TouchableOpacity>
        {state === 'paused' && (
          <TouchableOpacity style={styles.controlButton} onPress={() => { reset(); setConfigured(false); }}>
            <IconSymbol name="gearshape.fill" size={22} color="#666" />
          </TouchableOpacity>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },

  // Header
  timerHeader: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 32,
    fontFamily: 'PoppinsSemiBold',
    lineHeight: 40,
    textDecorationLine: 'line-through',
    textDecorationColor: '#FFD700',
    color: '#fff',
  },

  // Config screen — fills available space
  configList: {
    flex: 1,
    justifyContent: 'center',
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  configLabel: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  stepperButton: {
    fontFamily: 'Poppins',
    fontSize: 28,
    color: '#FFD700',
    paddingHorizontal: 8,
  },
  stepperValue: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 22,
    color: '#fff',
    minWidth: 52,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    paddingVertical: 18,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 64,
  },
  startButtonText: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 18,
    color: '#FFD700',
  },

  // Timer screen
  roundInfo: {
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  roundLabel: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 18,
    color: '#666',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  roundSub: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    alignSelf: 'center',
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2c2c2e' },
  dotDone: { backgroundColor: '#FFD700' },
  dotCurrent: { backgroundColor: '#FFD700', width: 12, height: 12, borderRadius: 6 },
  dotNext: { backgroundColor: '#4CAF50' },

  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  timerRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  timerText: {
    fontFamily: 'PoppinsSemiBold',
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
    alignSelf: 'center',
    marginTop: 32,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButtonActive: { backgroundColor: '#fff' },
});
