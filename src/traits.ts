import type { Accessory, AccessoryPlace } from "./accessories";
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
  pattern: 2,
  accessory: 1,
  place: 1,
};

export const MoodLevels = [-20, -10, 10, 20];
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
  LessThan: (a: Mood, b: Mood) => MoodIndex[a] < MoodIndex[b],
  LessThanEqual: (a: Mood, b: Mood) => MoodIndex[a] <= MoodIndex[b],
  GreaterThan: (a: Mood, b: Mood) => MoodIndex[a] > MoodIndex[b],
  GreaterThanEqual: (a: Mood, b: Mood) => MoodIndex[a] >= MoodIndex[b],
  Equal: (a: Mood, b: Mood) => MoodIndex[a] === MoodIndex[b],
} as const;
type Comparator = (typeof Comparators)[keyof typeof Comparators];

type MoodObjective<T extends keyof TypeMap, V extends TypeMap[T]> = {
  kind: T;
  value: V;
  mood: Mood;
  comp: Comparator;
};
export type Objective = MoodObjective<keyof TypeMap, TypeMap[keyof TypeMap]>;
// TODO VisibleObjective<face|body|accessory> etc
