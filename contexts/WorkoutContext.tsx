import React, { createContext, useContext, useState } from 'react';

export type TrainingType = 'Partner Drills' | 'Heavy Bag' | 'Thai Pads' | 'Focus Mitts' | 'Shadow Boxing' | 'Skipping' | 'Warm-Up' | 'Running' | 'Technical Sparring' | 'Light Sparring' | 'Hard Sparring';
export type TrainingMode = 'Rounds' | 'Time' | 'Reps' | 'Distance';
export type DistanceUnit = 'km' | 'mi';

type Combo = {
  id: string;
  type: TrainingType;
  mode: TrainingMode;
  sets?: string;
  reps?: string;
  minutes?: string;
  seconds?: string;
  rounds?: string;
  roundMinutes?: string;
  roundSeconds?: string;
  techniques?: string;
  distance?: string;
  distanceUnit?: DistanceUnit;
};

type WorkoutContextType = {
  workoutName: string;
  setWorkoutName: (name: string) => void;
  combos: Combo[];
  setCombos: (combos: Combo[]) => void;
  notes: string;
  setNotes: (notes: string) => void;
};

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [workoutName, setWorkoutName] = useState('');
  const [combos, setCombos] = useState<Combo[]>([]);
  const [notes, setNotes] = useState('');

  return (
    <WorkoutContext.Provider 
      value={{
        workoutName,
        setWorkoutName,
        combos,
        setCombos,
        notes,
        setNotes,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}

export type { Combo }; 