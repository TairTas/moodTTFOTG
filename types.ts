export interface UserProfile {
  uid: string;
  username: string;
  email: string;
}

export enum MoodValue {
  Terrible = -3,
  VeryBad = -2,
  Bad = -1,
  Neutral = 0,
  Good = 1,
  VeryGood = 2,
  Excellent = 3,
}

export interface MoodLog {
  date: string; // YYYY-MM-DD
  value: MoodValue;
  timestamp: number;
}

export const MOOD_COLORS: Record<number, string> = {
  [-3]: '#bf0000',
  [-2]: '#ff0000',
  [-1]: '#ff6200',
  [0]: '#ffd500',
  [1]: '#eeff00',
  [2]: '#00ff08',
  [3]: '#00ffa2',
};

export const MOOD_LABELS: Record<number, string> = {
  [-3]: 'Ужасное',
  [-2]: 'Очень плохое',
  [-1]: 'Плохое',
  [0]: 'Нейтральное',
  [1]: 'Хорошее',
  [2]: 'Очень хорошее',
  [3]: 'Прекрасное',
};

// Helper to create transparent glass colors from hex
export const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
