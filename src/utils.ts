import type { Dislikes, Likes, TypeMap } from "./traits";

// from PracRand
function sfc32(a: number, b: number, c: number, d: number) {
  return function () {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    var t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

let random = sfc32(0xdeadbeef, 0xbeefcafe, 0x36984217, 0x83a590d1);
// throw away first 20 values
for (let i = 0; i < 20; i++) random();

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

export function randomWeightedItem<T>(
  list: readonly [T, number][],
  nullChance: number = 0.5
): T | null {
  if (random() < nullChance) return null;
  const total = list.reduce((sum, [, weight]) => sum + weight, 0);
  let r = random() * total;
  for (const [item, weight] of list) {
    if (r < weight) return item;
    r -= weight;
  }
  // If rounding errors or zero weights occur, return null
  return null;
}

/*export function popRandomItems<T>(list: T[], emptyChance: number = 0.5): T[] {
  const items = randomItems(list, emptyChance);
  list.filter((item) => !items.includes(item));
  return items;
}*/

// NOTE: modifies passed list
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

/*export function removedOnce<T>(arr: T[], items: T | T[]): T[] {
  const itemList = Array.isArray(items) ? items : [items];
  const indices = itemList.map(arr.indexOf);
  return arr.filter((_, i) => !indices.includes(i));
}*/
