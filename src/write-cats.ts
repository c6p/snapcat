import { writeFileSync } from "fs";
import type { CatColor, CatPattern } from "./colors.ts";
import { CAT_NAMES, type CatName } from "./names.ts";
import { randb, randf, randomItem, randomWeightedItem } from "./utils.ts";
import {
  ACCESSORIES,
  ACCESSORY_PLACES,
  type Accessory,
  type AccessoryPlace,
} from "./accessories.ts";

function generateCatProps(color: CatColor) {
  const xScale = randf(0.7, 1.3).toFixed(3);
  const yScale = randf(0.7, 1.3).toFixed(3);
  let catPatterns: CatPattern[] = ["tuxedo", "tabby"];
  if (color === "black") catPatterns = ["tuxedo"];
  else if (color === "white") catPatterns = [];
  const patterns = catPatterns.filter(() => randb());
  const accessories = Object.entries(ACCESSORIES)
    .map(([place, items]) => [
      randomWeightedItem(
        Object.entries(items) as [Accessory, number][],
        1 - ACCESSORY_PLACES[place as AccessoryPlace]
      ),
      place as AccessoryPlace,
    ])
    .filter(([item, _place]) => item !== null) as [Accessory, AccessoryPlace][];
  const cat = { color, patterns, accessories, xScale, yScale };
  return cat;
}

export function generateCats() {
  const cats: Record<CatName, ReturnType<typeof generateCatProps>> = {} as any;
  Object.entries(CAT_NAMES).forEach(([color, names]) => {
    names.forEach((name) => {
      cats[name] = generateCatProps(color as CatColor);
    });
  });
  return "export const cats = " + JSON.stringify(cats);
}

const catsJson = generateCats();
writeFileSync("src/cats.ts", catsJson, { encoding: "utf-8" });
console.log("cats.ts written.");
