import type { Accessory, AccessoryPlace } from "./accessories";
import type { Cat } from "./cat";
import type { CatColor, CatPattern } from "./colors";
import type { CatName } from "./names";

export type TypeMap = {
  cat: CatName;
  color: CatColor;
  pattern: CatPattern;
  accessory: Accessory;
  place: AccessoryPlace;
};

export type Likes<T extends keyof TypeMap> = {
  kind: T;
  likes: TypeMap[T][];
};

export type Dislikes<T extends keyof TypeMap> = {
  kind: T;
  dislikes: TypeMap[T][];
};

// TODO likes/hates showing body parts / (specific) accessories /

// NOTE: cats are by default tactile animals, wants to be in close contact, in tight space
export type CatTrait =
  | { [K in keyof TypeMap]: Likes<K> }[keyof TypeMap]
  | { [K in keyof TypeMap]: Dislikes<K> }[keyof TypeMap];

export const Score = {
  cat: 3,
  color: 2,
  pattern: 1,
  accessory: 2,
  place: 1,
};

export const MoodLevels = [-13, -6, 6, 13];
export const Moods = [
  "miserable",
  "downcast",
  "content",
  "pleased",
  "cheerful",
] as const;
export type Mood = (typeof Moods)[number];
export const MoodIndex = Object.fromEntries(
  Moods.map((m, i) => [m, i] as [Mood, number])
);

export const Comparators = {
  LT: (a: Mood, b: Mood) => MoodIndex[a] < MoodIndex[b],
  LE: (a: Mood, b: Mood) => MoodIndex[a] <= MoodIndex[b],
  GT: (a: Mood, b: Mood) => MoodIndex[a] > MoodIndex[b],
  GE: (a: Mood, b: Mood) => MoodIndex[a] >= MoodIndex[b],
  EQ: (a: Mood, b: Mood) => MoodIndex[a] === MoodIndex[b],
} as const;
//type Comparator = (typeof Comparators)[keyof typeof Comparators];
export type ComparatorKey = keyof typeof Comparators;
export const CompIndex: ComparatorKey[] = ["EQ", "GE", "LE", "GT", "LT"];

type MoodObjective<T extends keyof TypeMap, V extends TypeMap[T]> = {
  value: [T, V | null][] | "fallback";
  mood: Mood;
  comp: ComparatorKey;
};
export type Objective = MoodObjective<keyof TypeMap, TypeMap[keyof TypeMap]>;
// TODO VisibleObjective<face|body|accessory> etc


export function objectiveMatches(obj: Objective, catList: Cat[]) {
  const matches = catList.map(() => true);
  if (obj.value === "fallback") return matches;
  for (const [key, value] of obj.value) {
    switch (key) {
      case "cat":
        matches.forEach(
          (m, i) => (matches[i] = m && catList[i].name === value)
        );
        break;
      case "color":
        matches.forEach(
          (m, i) => (matches[i] = m && catList[i].color === value)
        );
        break;
      case "pattern":
        matches.forEach(
          (m, i) =>
          (matches[i] =
            m && catList[i].patterns.includes(value as CatPattern))
        );
        break;
      case "accessory":
        matches.forEach(
          (m, i) =>
          (matches[i] =
            m &&
            catList[i].accessories.some(
              ([a, _p]) => a === (value as Accessory)
            ))
        );
        break;
      case "place":
        matches.forEach(
          (m, i) =>
          (matches[i] =
            m &&
            catList[i].accessories.some(
              ([_a, p]) => p === (value as AccessoryPlace)
            ))
        );
        break;
    }
  }
  return matches;
}