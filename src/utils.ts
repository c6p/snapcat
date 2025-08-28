export function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randf(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randb(): boolean {
  return Math.random() > 0.5;
}

export function choose<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)];
}

export function randomItem<T>(
  list: readonly T[],
  nullChance: number = 0.5
): T | null {
  return Math.random() < nullChance
    ? null
    : list[Math.floor(Math.random() * list.length)];
}
