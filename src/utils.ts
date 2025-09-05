import type { Dislikes, Likes, TypeMap } from "./traits";

let random: () => number = Math.random;
export function rand(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function randf(min: number, max: number): number {
  return random() * (max - min) + min;
}

export function randb(): boolean {
  return random() > 0.5;
}

export function choose<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)];
}

export function popRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  const index = rand(0, arr.length - 1);
  const item = arr[index];
  arr.splice(index, 1);
  return item;
}

export function randomItem<T>(
  list: readonly T[],
  nullChance: number = 0.5
): T | null {
  return random() < nullChance
    ? null
    : list[Math.floor(random() * list.length)];
}

export function randomItems<T>(
  list: readonly T[],
  emptyChance: number = 0.5
): T[] {
  const count = random() < emptyChance ? 0 : rand(0, list.length);
  const shuffled = [...list].sort(() => random() - 0.5);
  return shuffled.slice(0, count);
}

export function randomTrait<
  T extends keyof TypeMap,
  K extends "likes" | "dislikes",
  N extends boolean = true
>(
  kind: T,
  key: K,
  list: TypeMap[T][],
  emptyChance: number = 0.5,
  notEmpty?: N
): N extends true
  ? K extends "likes"
    ? Likes<T> | null
    : Dislikes<T> | null
  : K extends "likes"
  ? Likes<T>
  : Dislikes<T> {
  const items = randomItems(list, emptyChance);
  if (notEmpty !== false && items.length === 0) return null as any;
  list.splice(0, list.length, ...list.filter((i) => items.includes(i)));
  if (key === "likes") {
    return { kind, likes: items } as any;
  } else {
    return { kind, dislikes: items } as any;
  }
}
