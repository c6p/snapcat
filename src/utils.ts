import { Halving, type Accessory } from "./accessories";
import type { Dislikes, Likes, TypeMap } from "./traits";

// from PracRand
function sfc32(a: number, b: number, c: number, d: number) {
  return function () {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

export const Random = () => {
  const random = sfc32(0xdeadbeef, 0xbeefcafe, 0x36984217, 0x83a590d1)

  // throw away first 32 values
  for (let i = 0; i < 32; i++) random();

  const rand = (min: number, max: number): number =>
    Math.floor(random() * (max - min + 1)) + min;

  const randf = (min: number, max: number): number =>
    random() * (max - min) + min;

  const randb = (trueChance: number = 0.5): boolean => random() < trueChance;

  const choose = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)];

  const popRandom = <T>(arr: T[]): T | undefined => {
    if (arr.length === 0) return undefined;
    const index = rand(0, arr.length - 1);
    const item = arr[index];
    arr.splice(index, 1);
    return item;
  };

  const randomItem = <T>(
    list: readonly T[],
    nullChance: number = 0.5
  ): T | null =>
    random() < nullChance ? null : list[Math.floor(random() * list.length)];

  const randomItems = <T>(
    list: readonly T[],
    emptyChance: number = 0.5
  ): T[] => {
    let count = 0;
    if (random() >= emptyChance) {
      const u = random();
      const max = list.length / 2;
      count = Math.floor(Math.log2(1 + u * (Math.pow(2, max) - 1)));
    }
    // Fisher-Yates shuffle (deterministic with our random)
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, count);
  };

  const randomWeightedItem = (
    items: Partial<Record<Accessory, number>>,
    nullChance: number = 0.5
  ): Accessory | null => {
    const list = Object.entries(items).sort(([a], [b]) => a.localeCompare(b)) as [Accessory, number][];
    if (random() < nullChance) return null;
    const total = list.reduce((sum, [, weight]) => sum + weight, 0);
    let r = random() * total;
    for (const [item, weight] of list) {
      if (r < weight) {
        items[item]! /= Halving[item];
        return item;
      }
      r -= weight;
    }
    return null;
  };

  const randomTrait = <
    T extends keyof TypeMap,
    K extends "likes" | "dislikes",
    N extends boolean = true
  >(
    kind: T,
    key: K,
    list: TypeMap[T][],
    nullChance: number = 0.5,
    nullable?: N
  ): N extends true
    ? K extends "likes"
      ? Likes<T> | null
      : Dislikes<T> | null
    : K extends "likes"
    ? Likes<T>
    : Dislikes<T> => {
    const items = randomItems(list, nullChance);
    if (items === null) return null as any;
    if (nullable !== false && items.length === 0) return null as any;
    list.splice(0, list.length, ...list.filter((i) => !items.includes(i)));
    if (key === "likes") {
      return { kind, likes: items } as any;
    } else {
      return { kind, dislikes: items } as any;
    }
  };

  return {
    random,
    rand,
    randf,
    randb,
    choose,
    popRandom,
    randomItem,
    randomItems,
    randomWeightedItem,
    randomTrait,
  };
};

