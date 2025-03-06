// types.ts
export type Side = 'lead' | 'rear' | 'both' | 'n/a';
export type Target = 'Head' | 'Body' | 'Legs' | 'mind' | 'n/a';
export type Range = 'close' | 'mid' | 'long' | 'n/a';
export type Category = 'Punches' | 'Kicks' | 'Elbows' | 'Knees' | 'Footwork' | 'Clinch' | 'Defensive' | 'Sweeps' | 'Feints';

export interface Technique {
    id: string;
    name: string;
    side: Side;
    targets: Target[];
    ranges: Range[];
    category: Category;
}

// techniques.ts
export const techniques: Technique[] = [
    // Punches
    {
        id: 'jab',
        name: 'Jab',
        side: 'lead',
        targets: ['Head', 'Body'],
        ranges: ['close', 'mid', 'long'],
        category: 'Punches'
    },
    {
        id: 'cross',
        name: 'Cross',
        side: 'rear',
        targets: ['Head', 'Body'],
        ranges: ['close', 'mid', 'long'],
        category: 'Punches'
    },
    {
        id: 'hook',
        name: 'Hook',
        side: 'both',
        targets: ['Head', 'Body'],
        ranges: ['close', 'mid', 'long'],
        category: 'Punches'
    },
    {
        id: 'uppercut',
        name: 'Uppercut',
        side: 'both',
        targets: ['Head'],
        ranges: ['close', 'mid', 'long'],
        category: 'Punches'
    },
    {
        id: 'overhand',
        name: 'Overhand',
        side: 'rear',
        targets: ['Head'],
        ranges: ['close', 'mid', 'long'],
        category: 'Punches'
    },
    {
        id: 'shovel-hook',
        name: 'Shovel Hook',
        side: 'both',
        targets: ['Body'],
        ranges: ['close', 'mid'],
        category: 'Punches'
    },
    {
        id: 'check-hook',
        name: 'Check Hook',
        side: 'both',
        targets: ['Head'],
        ranges: ['close', 'mid'],
        category: 'Punches'
    },
    {
        id: 'body-rip',
        name: 'Body Rip',
        side: 'both',
        targets: ['Body'],
        ranges: ['close', 'mid'],
        category: 'Punches'
    },
    {
        id: 'spinning-backfist',
        name: 'Spinning Backfist',
        side: 'both',
        targets: ['Head'],
        ranges: ['close', 'mid', 'long'],
        category: 'Punches'
    },
    {
        id: 'superman-punch',
        name: 'Superman Punch',
        side: 'both',
        targets: ['Head'],
        ranges: ['mid', 'long'],
        category: 'Punches'
    },

    // Kicks
    {
        id: 'teep',
        name: 'Teep',
        side: 'both',
        targets: ['Body', 'Legs'],
        ranges: ['mid', 'long'],
        category: 'Kicks'
    },
    {
        id: 'push-kick',
        name: 'Push Kick',
        side: 'both',
        targets: ['Body', 'Legs'],
        ranges: ['mid', 'long'],
        category: 'Kicks'
    },
    {
        id: 'roundhouse-kick',
        name: 'Roundhouse Kick',
        side: 'both',
        targets: ['Head', 'Body', 'Legs'],
        ranges: ['close', 'mid', 'long'],
        category: 'Kicks'
    },
    {
        id: 'skip-roundhouse-kick',
        name: 'Skip Roundhouse Kick',
        side: 'both',
        targets: ['Head', 'Body', 'Legs'],
        ranges: ['long'],
        category: 'Kicks'
    },
    {
        id: 'switch-kick',
        name: 'Switch Kick',
        side: 'both',
        targets: ['Head', 'Body', 'Legs'],
        ranges: ['close', 'mid', 'long'],
        category: 'Kicks'
    },
    {
        id: 'question-mark-kick',
        name: 'Question Mark Kick',
        side: 'both',
        targets: ['Head', 'Body'],
        ranges: ['close', 'mid', 'long'],
        category: 'Kicks'
    },
    {
        id: 'axe-kick',
        name: 'Axe Kick',
        side: 'both',
        targets: ['Head', 'Body'],
        ranges: ['mid', 'long'],
        category: 'Kicks'
    },
    {
        id: 'low-kick',
        name: 'Low Kick',
        side: 'both',
        targets: ['Legs'],
        ranges: ['close', 'mid', 'long'],
        category: 'Kicks'
    },
    {
        id: 'dutch-style-low-kick',
        name: 'Dutch-Style Low Kick',
        side: 'both',
        targets: ['Legs'],
        ranges: ['close', 'mid', 'long'],
        category: 'Kicks'
    },
    {
        id: 'side-kick',
        name: 'Side Kick',
        side: 'both',
        targets: ['Body', 'Legs'],
        ranges: ['mid', 'long'],
        category: 'Kicks'
    },
    {
        id: 'back-kick',
        name: 'Back Kick',
        side: 'both',
        targets: ['Body', 'Legs'],
        ranges: ['mid', 'long'],
        category: 'Kicks'
    },
    {
        id: 'diagonal-kick',
        name: 'Diagonal Kick',
        side: 'both',
        targets: ['Head', 'Body', 'Legs'],
        ranges: ['close', 'mid', 'long'],
        category: 'Kicks'
    },
    {
        id: 'jump-kick',
        name: 'Jump Kick',
        side: 'both',
        targets: ['Head', 'Body', 'Legs'],
        ranges: ['long'],
        category: 'Kicks'
    },

    // Elbows
    {
        id: 'uppercut-elbow',
        name: 'Uppercut Elbow',
        side: 'both',
        targets: ['Head'],
        ranges: ['close'],
        category: 'Elbows'
    },
    {
        id: 'downward-elbow',
        name: 'Downward Elbow',
        side: 'both',
        targets: ['Head'],
        ranges: ['close'],
        category: 'Elbows'
    },
    {
        id: 'horizontal-elbow',
        name: 'Horizontal Elbow',
        side: 'both',
        targets: ['Head'],
        ranges: ['close'],
        category: 'Elbows'
    },
    {
        id: 'reverse-horizontal-elbow',
        name: 'Reverse Horizontal Elbow',
        side: 'both',
        targets: ['Head'],
        ranges: ['close'],
        category: 'Elbows'
    },
    {
        id: 'jump-elbow',
        name: 'Jump Elbow',
        side: 'both',
        targets: ['Head'],
        ranges: ['close', 'mid'],
        category: 'Elbows'
    },
    {
        id: 'spinning-elbow',
        name: 'Spinning Elbow',
        side: 'both',
        targets: ['Head'],
        ranges: ['close'],
        category: 'Elbows'
    },
    {
        id: 'diagonal-elbow',
        name: 'Diagonal Elbow',
        side: 'both',
        targets: ['Head'],
        ranges: ['close'],
        category: 'Elbows'
    },
    {
        id: 'levering-elbows',
        name: 'Levering Elbows',
        side: 'both',
        targets: ['Head'],
        ranges: ['close'],
        category: 'Elbows'
    },
    {
        id: 'front-elbow-thrust',
        name: 'Front Elbow Thrust',
        side: 'lead',
        targets: ['Head'],
        ranges: ['close'],
        category: 'Elbows'
    },

    // Knees
    {
        id: 'straight-knee',
        name: 'Straight Knee',
        side: 'both',
        targets: ['Body'],
        ranges: ['close', 'mid'],
        category: 'Knees'
    },
    {
        id: 'curving-knee',
        name: 'Curving Knee',
        side: 'both',
        targets: ['Body'],
        ranges: ['close', 'mid'],
        category: 'Knees'
    },
    {
        id: 'diagonal-knee',
        name: 'Diagonal Knee',
        side: 'both',
        targets: ['Body'],
        ranges: ['close', 'mid'],
        category: 'Knees'
    },
    {
        id: 'step-knee',
        name: 'Step Knee',
        side: 'both',
        targets: ['Body'],
        ranges: ['close', 'mid'],
        category: 'Knees'
    },
    {
        id: 'side-knee',
        name: 'Side Knee',
        side: 'both',
        targets: ['Body'],
        ranges: ['close'],
        category: 'Knees'
    },
    {
        id: 'flying-knee',
        name: 'Flying Knee',
        side: 'both',
        targets: ['Head', 'Body'],
        ranges: ['close', 'mid'],
        category: 'Knees'
    },
    {
        id: 'knee-bomb',
        name: 'Knee Bomb',
        side: 'both',
        targets: ['Body'],
        ranges: ['close'],
        category: 'Knees'
    },
    {
        id: 'clinch-knee',
        name: 'Clinch Knee',
        side: 'both',
        targets: ['Body'],
        ranges: ['close'],
        category: 'Knees'
    },

    // Footwork
    {
        id: 'switch-step',
        name: 'Switch Step',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Footwork'
    },
    {
        id: 'quarter-turn',
        name: 'Quarter Turn',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Footwork'
    },
    {
        id: 'half-turn',
        name: 'Half Turn',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Footwork'
    },
    {
        id: 'full-turn',
        name: 'Full Turn',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Footwork'
    },
    {
        id: 'linear-step',
        name: 'Linear Step',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Footwork'
    },
    {
        id: 'bounce-step',
        name: 'Bounce Step',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Footwork'
    },
    {
        id: 'shuffle-step',
        name: 'Shuffle Step',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Footwork'
    },
    {
        id: 'l-step',
        name: 'L-Step',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Footwork'
    },
    {
        id: 'cross-step',
        name: 'Cross Step',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Footwork'
    },
    {
        id: 'hop-step',
        name: 'Hop Step',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Footwork'
    },
    {
        id: 'pendulum-step',
        name: 'Pendulum Step',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Footwork'
    },
    {
        id: 'circular-step',
        name: 'Circular Step',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Footwork'
    },
    {
        id: 'v-step',
        name: 'V-Step',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Footwork'
    },
    {
        id: 'forward-triangle',
        name: 'Forward Triangle',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Footwork'
    },
    {
        id: 'back-triangle',
        name: 'Back Triangle',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Footwork'
    },

    // Clinch
    {
        id: 'double-collar-tie',
        name: 'Double Collar Tie',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Clinch'
    },
    {
        id: 'single-collar-tie',
        name: 'Single Collar Tie',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Clinch'
    },
    {
        id: 'side-clinch',
        name: 'Side Clinch',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Clinch'
    },
    {
        id: 'underhook-control',
        name: 'Underhook Control',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Clinch'
    },
    {
        id: 'double-underhooks',
        name: 'Double Underhooks',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Clinch'
    },
    {
        id: 'post',
        name: 'Post',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Clinch'
    },
    {
        id: 'over-under',
        name: 'Over-Under',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Clinch'
    },
    {
        id: 'arm-wrap',
        name: 'Arm Wrap',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Clinch'
    },
    {
        id: 'head-press',
        name: 'Head Press',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Clinch'
    },
    {
        id: 'bicep-tie',
        name: 'Bicep Tie',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Clinch'
    },
    {
        id: 'cross-face',
        name: 'Cross-Face',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Clinch'
    },

    // Defensive
    {
        id: 'high-block',
        name: 'High Block',
        side: 'both',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },
    {
        id: 'low-block',
        name: 'Low Block',
        side: 'both',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },
    {
        id: 'cross-block',
        name: 'Cross Block',
        side: 'both',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },
    {
        id: 'dutch-block',
        name: 'Dutch Block',
        side: 'both',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },
    {
        id: 'hand-trap',
        name: 'Hand Trap',
        side: 'both',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },
    {
        id: 'high-check',
        name: 'High Check',
        side: 'both',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },
    {
        id: 'low-check',
        name: 'Low Check',
        side: 'both',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },
    {
        id: 'shell-guard',
        name: 'Shell Guard',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },
    {
        id: 'long-guard',
        name: 'Long Guard',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },
    {
        id: 'lean-back',
        name: 'Lean Back',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },
    {
        id: 'slip',
        name: 'Slip',
        side: 'both',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },
    {
        id: 'catch',
        name: 'Catch',
        side: 'both',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },
    {
        id: 'roll',
        name: 'Roll',
        side: 'both',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },
    {
        id: 'pull',
        name: 'Pull',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },
    {
        id: 'duck',
        name: 'Duck',
        side: 'n/a',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },
    {
        id: 'parry',
        name: 'Parry',
        side: 'both',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },
    {
        id: 'shoulder-roll',
        name: 'Shoulder Roll',
        side: 'both',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },
    {
        id: 'roundhouse-kick-catch',
        name: 'Roundhouse Kick Catch',
        side: 'both',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },
    {
        id: 'teep-catch',
        name: 'Teep Catch',
        side: 'both',
        targets: ['n/a'],
        ranges: ['n/a'],
        category: 'Defensive'
    },

    // Sweeps
    {
        id: 'inside-leg-sweep',
        name: 'Inside Leg Sweep',
        side: 'both',
        targets: ['Legs'],
        ranges: ['close', 'mid'],
        category: 'Sweeps'
    },
    {
        id: 'outside-leg-sweep',
        name: 'Outside Leg Sweep',
        side: 'both',
        targets: ['Legs'],
        ranges: ['close', 'mid'],
        category: 'Sweeps'
    },
    {
        id: 'clinch-trip',
        name: 'Clinch Trip',
        side: 'both',
        targets: ['Legs'],
        ranges: ['close'],
        category: 'Sweeps'
    },
    {
        id: 'body-lock-dump',
        name: 'Body Lock Dump',
        side: 'both',
        targets: ['Legs'],
        ranges: ['close'],
        category: 'Sweeps'
    },
    {
        id: 'hip-bump-sweep',
        name: 'Hip Bump Sweep',
        side: 'both',
        targets: ['Legs'],
        ranges: ['close'],
        category: 'Sweeps'
    },
    {
        id: 'foot-sweep',
        name: 'Foot Sweep',
        side: 'both',
        targets: ['Legs'],
        ranges: ['close', 'mid'],
        category: 'Sweeps'
    },

    // Feints
    {
        id: 'jab-feint',
        name: 'Jab Feint',
        side: 'lead',
        targets: ['mind'],
        ranges: ['n/a'],
        category: 'Feints'
    },
    {
        id: 'cross-feint',
        name: 'Cross Feint',
        side: 'rear',
        targets: ['mind'],
        ranges: ['n/a'],
        category: 'Feints'
    },
    {
        id: 'teep-feint',
        name: 'Teep Feint',
        side: 'both',
        targets: ['mind'],
        ranges: ['n/a'],
        category: 'Feints'
    },
    {
        id: 'roundhouse-feint',
        name: 'Roundhouse Feint',
        side: 'both',
        targets: ['mind'],
        ranges: ['n/a'],
        category: 'Feints'
    },
    {
        id: 'step-in-feint',
        name: 'Step-In Feint',
        side: 'n/a',
        targets: ['mind'],
        ranges: ['n/a'],
        category: 'Feints'
    },
    {
        id: 'level-change',
        name: 'Level Change',
        side: 'n/a',
        targets: ['mind'],
        ranges: ['n/a'],
        category: 'Feints'
    },
    {
        id: 'look-down',
        name: 'Look Down',
        side: 'n/a',
        targets: ['mind'],
        ranges: ['n/a'],
        category: 'Feints'
    },
    {
        id: 'switch-step-feint',
        name: 'Switch Step Feint',
        side: 'n/a',
        targets: ['mind'],
        ranges: ['n/a'],
        category: 'Feints'
    },
    {
        id: 'knee-raise',
        name: 'Knee Raise',
        side: 'both',
        targets: ['mind'],
        ranges: ['n/a'],
        category: 'Feints'
    },
    {
        id: 'elbow-load',
        name: 'Elbow Load',
        side: 'both',
        targets: ['mind'],
        ranges: ['n/a'],
        category: 'Feints'
    }
];

// Helper functions for filtering and categorizing techniques
export const getTechniquesByCategory = (category: Category): Technique[] => {
    return techniques.filter(technique => technique.category === category);
};

export const getTechniquesBySide = (side: Side): Technique[] => {
    return techniques.filter(technique => technique.side === side || technique.side === 'both');
};

export const getTechniquesByTarget = (target: Target): Technique[] => {
    return techniques.filter(technique => technique.targets.includes(target));
};

export const getTechniquesByRange = (range: Range): Technique[] => {
    return techniques.filter(technique => technique.ranges.includes(range));
};