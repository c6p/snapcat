import { writeFileSync } from "fs";
import { Moods, objectiveMatches, type Mood } from "./traits";
import * as MiniZinc from "minizinc";
import { levels as LEVELS } from "./levels";
import { solutions as SOLUTIONS } from "./solutions";
import { toCatList, calcContributionMatrix, type Cat, generateCats } from "./cat";
import { levelDefs, type Level, type LevelDef } from "./levelDefs";
import { catColors } from "./colors";

const Nrows = 5;

function createDzn(cats: ReturnType<typeof generateCats>) {
  const catList = toCatList(cats);
  const matrix = calcContributionMatrix(catList);
  const colors = catColors;
  const patterns = ["plain", "tuxedo", "tabby", "tabbytuxedo"];
  //console.error(Math.min(...matrix.flat()), Math.max(...matrix.flat()));

  return {
    catCount: 5,
    Nrows,
    Ncats: catList.length,
    ROW_SPACING: 3,
    X_MAX: 32,
    DIST: 10,
    width: catList.map((c) => Math.round(Number(c.xScale) * 5)),
    color: catList.map((c) => colors.indexOf(c.color) + 1),
    pattern: catList.map(
      (c) => patterns.indexOf(c.patterns.sort().join("")) + 1
    ),
    contributions: matrix,
  };
}

function generateRules(levelDef: LevelDef, catList: Cat[]) {
  return {
    catCount: levelDef.catCount,
    Nrules: levelDef.objectives?.length || 0,
    rule_operators: levelDef.objectives?.map((obj) => obj.comp) || [],
    rule_levels:
      levelDef.objectives?.map((obj) => Moods.indexOf(obj.mood as Mood) + 1) ||
      [],
    rule_matches:
      levelDef.objectives?.map((obj) => objectiveMatches(obj, catList)) || [],
  };
}

const cats = generateCats();
const catsJson =
  `import type { generateCats } from "./cat";
export const cats: ReturnType<typeof generateCats> = ` + JSON.stringify(cats);
writeFileSync("src/cats.ts", catsJson, { encoding: "utf-8" });
console.log("cats.ts written.");

const catList = toCatList(cats);
const base = createDzn(cats);
const levels = LEVELS as Level[];
const solutions = SOLUTIONS as { row: number[]; x: number[] }[];
for (let i = 0; i < levelDefs.length; i++) {
  if (levels[i]?.cats?.length > 0) continue; // skip existing levels
  let level: Level = { cats: [] };
  let solution: { row: number[]; x: number[] } = { row: [], x: [] };
  try {
    const levelDef = levelDefs[i];
    const model = new MiniZinc.Model();
    model.addFile("src/cat.mzn");
    const rules = generateRules(levelDef, catList);
    console.warn(rules);
    const allRules = Object.assign(base, rules);
    //writeFileSync(`src/level${i + 1}.dzn.json`, JSON.stringify(allRules));
    model.addJson(allRules);
    const result = await model.solve({
      options: {
        solver: "gecode",
        "time-limit": 30000,
        //statistics: true,
      },
    });
    const output = result.solution?.output.json!;
    console.warn(output.mood_score);
    console.warn(output);
    level = { cats: output!.cats.map((c: number) => c - 1) };
    solution = {
      row: output!.row.map((r: number) => r - 1),
      x: output!.x.map((x: number) => x * 20),
    };
  } catch (e) {
    console.error("MiniZinc error:", (e as Error).message);
  } finally {
    if (levels.length <= i) {
      levels.push(level);
      solutions.push(solution);
    } else {
      levels[i] = level;
      solutions[i] = solution;
    }
  }
}
writeFileSync(
  "src/levels.ts",
  `export const levels = ${JSON.stringify(levels)};`,
  { encoding: "utf-8" }
);
console.log("levels.ts written.");
writeFileSync(
  "src/solutions.ts",
  `export const solutions = ${JSON.stringify(solutions)};`,
  { encoding: "utf-8" }
);
