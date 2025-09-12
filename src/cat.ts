import { catColors, type CatColor, type CatPattern } from "./colors";
import {
  ACCESSORIES,
  ACCESSORY_PLACES,
  type Accessory,
  type AccessoryPlace,
} from "./accessories";
import { Score, type CatTrait } from "./traits";
import { CAT_NAMES, type CatName } from "./names";
import { Random } from "./utils";


export type Cat = {
  name: CatName;
  color: CatColor;
  patterns: CatPattern[];
  accessories: [Accessory, AccessoryPlace][];
  xScale: number;
  yScale: number;
  traits: CatTrait[];
};
export function toCatList(cats: ReturnType<typeof generateCats>): Cat[] {
  return Object.entries(cats).sort(([a], [b]) => a.localeCompare(b)).map(([name, cat]) => {
    const { xScale: x, yScale: y } = cat;
    const xScale = parseFloat(x);
    const yScale = parseFloat(y);
    return { ...cat, name, xScale, yScale } as Cat;
  });
}

function calcContribution(cat: Cat, other: Cat) {
  if (cat.name === other.name) return 0;
  const traits = cat.traits;
  const { name, color, patterns, accessories } = other;
  //console.warn(name, color, patterns, accessories);
  let contrib = 0;
  traits.forEach((trait) => {
    const [key, items] =
      "likes" in trait ? ["likes", trait.likes] : ["dislikes", trait.dislikes];
    if (
      (trait.kind === "cat" && (items as CatName[]).includes(name)) ||
      (trait.kind === "color" && (items as CatColor[]).includes(color)) ||
      (trait.kind === "pattern" &&
        (patterns.some((p) => (items as CatPattern[]).includes(p)) ||
          (patterns.length === 0 && items.length === 0))) /* plain */ ||
      (trait.kind === "accessory" &&
        accessories.some(([a]) => (items as Accessory[]).includes(a))) ||
      (trait.kind === "place" &&
        accessories.some(
          ([a, p]) =>
            !(items as Accessory[]).includes(a) &&
            (items as AccessoryPlace[]).includes(p)
        ))
    ) {
      //console.warn(trait.kind, key, items);
      contrib += Score[trait.kind] * (key === "likes" ? 1 : -1);
    }
  });
  //console.warn(cat.name, other.name, contrib);
  return contrib;
}

export function calcContributionMatrix(catList: Cat[]) {
  const matrix = catList.map((cat) => {
    return catList.map((other) => calcContribution(cat, other));
  });
  return matrix;
}

const Accessories = Object.fromEntries(
  Object.entries(ACCESSORIES).sort().map(([place, items]) => [
    place,
    Object.fromEntries(
      Object.entries(items).sort().map(([item, value]) => [item, value])
    ),
  ])
) as {
  -readonly [K in keyof typeof ACCESSORIES]: {
    -readonly [key in keyof (typeof ACCESSORIES)[K]]: number;
  };
};

export function generateCats() {
  const { randf, randomWeightedItem, randomTrait, randb } = Random();

  const generateTraits = ({
    catName,
    catColor,
  }: {
    catName: CatName;
    catColor: CatColor;
  }): CatTrait[] => {
    // Always sort names for deterministic order
    const names = Object.values(CAT_NAMES)
      .flat()
      .slice()
      .sort()
      .filter((n) => n !== catName) as CatName[];
    const colors = catColors
      .filter((c) => c !== "black") as CatColor[];
    // Patterns are already a fixed array
    const patterns = ["plain", "tuxedo", "tabby"] as CatPattern[];
    // Always sort accessories
    const accessories = Object.values(ACCESSORIES)
      .flatMap((a) => Object.keys(a))
      .slice()
      .sort() as Accessory[];
    // Always sort places
    const places = Object.keys(ACCESSORY_PLACES)
      .slice()
      .sort() as AccessoryPlace[];

    const likeDislike = ["likes", "dislikes"] as const;
    const randomBlack =
      likeDislike[Number(randb(catColor === "black" ? 0.1 : 0.4))];
    const traits = likeDislike
      .flatMap((key) => [
        randomTrait("cat", key, names, 0),
        (() => {
          const color = randomTrait("color", key, colors, 0.3, false);
          // every cat has an opinion for black cats - like or dislike
          const items = (color as any)[key];
          if (key === randomBlack) items.push("black");
          return items.length === 0 ? null : color;
        })(),
        randomTrait("pattern", key, patterns, 0.4),
        randomTrait("accessory", key, accessories, 0),
        randomTrait("place", key, places, 0.7),
      ])
      .filter((trait) => trait !== null);
    return traits;
  };

  const generateCatProps = (name: CatName, color: CatColor) => {
    const xScale = randf(0.6, 1.4).toFixed(3);
    const yScale = randf(0.6, 1.4).toFixed(3);
    //console.error(name, color, xScale, yScale);
    let catPatterns: CatPattern[] = ["tuxedo", "tabby"];
    if (color === "black") catPatterns = ["tuxedo"];
    else if (color === "white") catPatterns = [];
    let patterns = catPatterns.filter(() => randb());
    if (patterns.length === 0) patterns = ["plain"];
    // Always sort places for deterministic order
    const accessories = Object.entries(Accessories)
      .slice()
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([place, items]) => [
        randomWeightedItem(
          items,
          1 - ACCESSORY_PLACES[place as AccessoryPlace]
        ),
        place as AccessoryPlace,
      ])
      .filter(([item, _place]) => item !== null) as [
      Accessory,
      AccessoryPlace
    ][];
    const traits = generateTraits({ catName: name, catColor: color });

    let cat = { color, patterns, accessories, xScale, yScale, traits };
    return cat;
  };

  const cats: Record<CatName, ReturnType<typeof generateCatProps>> = {} as any;
  Object.entries(CAT_NAMES)
    .slice()
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([color, names]) => {
      names.slice().sort().forEach((name) => {
        cats[name] = generateCatProps(name as CatName, color as CatColor);
      });
    });

  return cats;
}