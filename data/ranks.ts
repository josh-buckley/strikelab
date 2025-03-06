export type Rank = {
  name: string;
  minLevel: number;
  color: string;
};

export const ranks: Rank[] = [
  { name: 'Novice', minLevel: 0, color: '#666666' },
  { name: 'Beginner', minLevel: 10, color: '#4CAF50' },
  { name: 'Amateur', minLevel: 25, color: '#2196F3' },
  { name: 'Intermediate', minLevel: 50, color: '#9C27B0' },
  { name: 'Advanced', minLevel: 100, color: '#FF5722' },
  { name: 'Expert', minLevel: 200, color: '#F44336' },
  { name: 'Master', minLevel: 350, color: '#FFD700' },
  { name: 'Grandmaster', minLevel: 500, color: '#E91E63' },
  { name: 'Legend', minLevel: 700, color: '#00BCD4' },
  { name: 'Mythical', minLevel: 900, color: '#9C27B0' }
];

export function getCurrentRank(totalLevel: number): Rank {
  return ranks.reduce((prev, current) => {
    if (totalLevel >= current.minLevel) {
      return current;
    }
    return prev;
  });
}

export function getNextRank(totalLevel: number): Rank | null {
  const nextRank = ranks.find(rank => rank.minLevel > totalLevel);
  return nextRank || null;
} 