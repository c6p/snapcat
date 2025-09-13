import { type Objective, type TypeMap } from "./traits";

export type LevelState = "base" | "dragging" | "done";

export type LevelDef = {
  catCount: number;
  objectives?: Objective[];
  text?: string;
  doneFn?: (updateInfo: (txt: string, done?: boolean) => void) => void;
};
export type Level = {
  cats: number[];
};
export const blackCat = [
  ["color", "black"],
  ["pattern", "plain"],
] as [keyof TypeMap, TypeMap[keyof TypeMap] | null][];

export const levelDefs: LevelDef[] = [
  {
    catCount: 1,
    text: "<li>Cats differ in color, pattern and accessories.</li><li><u>Black Cats</u> are solid black.</li><li><u>Black Cats</u> enjoy group photos. But, this one is a bit lonely.</li><li>Drag & drop it to practice.</li>",
    doneFn: (updateInfo) => {
      let counter = 0;
      let oldRowId: string = "";
      const draggables =
        document.querySelectorAll<SVGGeometryElement>(".draggable");
      draggables.forEach((el) => {
        const down = () => {
          oldRowId = (el.parentNode! as SVGGElement).dataset.index!;
        };
        const up = () => {
          window.requestAnimationFrame(() => {
            if (oldRowId !== (el.parentNode! as SVGGElement).dataset.index!) {
              counter++;
            }
            if (counter === 3) {
              el.removeEventListener("pointerdown", down);
              el.removeEventListener("pointerup", up);
              updateInfo("<li>Great! Now, snap the first photo.</li>", true);
            } else if (counter === 1) {
              updateInfo("<li>Great! The cat will sit where its bottom is.</li><li>Keep trying to get the hang of it.</li>");
            } 
          });
        };
        el.addEventListener("pointerdown", down, true); // NOTE: should be before dragEvents to access row
        el.addEventListener("pointerup", up);
      });
    },
  },
  {
    catCount: 2,
    objectives: [{ value: blackCat, mood: "content", comp: "GE" }],
    text: '<li>A cat’s mood depends on its <span class="like">👍</span>likes and <span class="dislike">👎</span>dislikes.</li><li>Check the help menu for details.<span style="border: 1px solid black;padding: 0 .5rem;margin-left: 1rem;background: #eee;">?</span></li><li>Nearby cats influence moods.</li><li>Distant cats look blurred and have no effect.</li><li>Try placing cats far apart.</li>',
    doneFn: (updateInfo) => {
      const draggables = [
        ...document.querySelectorAll<SVGGeometryElement>(".draggable"),
      ];
      draggables.forEach((el) => {
        const far = () => {
          if (draggables.some((d) => d.classList.contains("far"))) {
            updateInfo("<li>Great! Now, you’re ready to be a CATographer.</li>", true);
            el.removeEventListener("pointerup", far);
          }
        };
        el.addEventListener("pointerup", far);
      });
    },
  },
  {
    catCount: 3,
    objectives: [
      { value: blackCat, mood: "pleased", comp: "GE" },
      { value: [["accessory", "balloon"]], mood: "pleased", comp: "GE" },
      { value: [["pattern", "tuxedo"]], mood: "cheerful", comp: "EQ" },
    ],
    text: "<li>All cats like or dislike <u>Black Cats</u>, but other colors may not matter.</li><li>All levels have an objective for <u>Black Cats</u>.</li><li>Some levels have additional objectives.</li><li>Try to meet all of them.</li>",
  },
  {
    catCount: 4,
    objectives: [
      { value: blackCat, mood: "downcast", comp: "LE" },
      { value: [["color", "cream"]], mood: "downcast", comp: "LE" },
      { value: [["pattern", "tuxedo"]], mood: "pleased", comp: "GE" },
    ],
  },
  {
    catCount: 5,
    objectives: [
      { value: blackCat, mood: "cheerful", comp: "EQ" },
      { value: [["accessory", "umbrella"]], mood: "downcast", comp: "LE" },
      { value: [["accessory", "scarf"]], mood: "pleased", comp: "GE" },
    ],
  },
  {
    catCount: 6,
    objectives: [
      { value: blackCat, mood: "pleased", comp: "EQ" },
      { value: [["accessory", "bowtie"]], mood: "cheerful", comp: "EQ" },
      { value: [["accessory", "tie"]], mood: "pleased", comp: "GE" },
      { value: [["pattern", "tuxedo"]], mood: "content", comp: "EQ" },
    ],
  },
  {
    catCount: 7,
    objectives: [
      { value: blackCat, mood: "pleased", comp: "GE" },
      { value: [["accessory","balloon"]], mood: "cheerful", comp: "EQ" },
      { value: [["pattern","tuxedo"]], mood: "cheerful", comp: "EQ" },
      { value: "fallback", mood: "pleased", comp: "GE" },
    ],
  },
  {
    catCount: 8,
    objectives: [
      { value: blackCat, mood: "cheerful", comp: "EQ" },
      { value: [["accessory","beanie"]], mood: "cheerful", comp: "EQ" },
      { value: [["accessory","scarf"]], mood: "cheerful", comp: "EQ" },
      { value: [["accessory","hat"]], mood: "content", comp: "EQ" },
    ],
  },
  {
    catCount: 9,
    objectives: [
      { value: blackCat, mood: "miserable", comp: "EQ" },
      { value: [["color", "gray"]], mood: "cheerful", comp: "EQ" },
      { value: [["color","white"]], mood: "pleased", comp: "GE" },
      { value: [["pattern", "tabby"]], mood: "pleased", comp: "GE" },
      { value: [["accessory","umbrella"]], mood: "cheerful", comp: "LE" },
    ],
  },
  {
    catCount: 10,
    objectives: [
      { value: blackCat, mood: "cheerful", comp: "EQ" },
      { value: [["color", "gray"]], mood: "cheerful", comp: "EQ" },
      { value: [["pattern", "tuxedo"]], mood: "cheerful", comp: "EQ" },
      { value: [["accessory","umbrella"],["accessory","sunglasses"]], mood: "cheerful", comp: "EQ" },
      { value: [["accessory","tie"]], mood: "pleased", comp: "GE" },
      { value: [["accessory","bowtie"]], mood: "pleased", comp: "GE" },
    ],
  },
  {
    catCount: 11,
    objectives: [
      { value: blackCat, mood: "cheerful", comp: "GE" },
      { value: [["accessory","cap"]], mood: "cheerful", comp: "GE" },
      { value: [["accessory","bag"]], mood: "downcast", comp: "LE" },
      { value: [["accessory","band"],["accessory","bag"]], mood: "downcast", comp: "LE" },
      { value: [["color","white"]], mood: "content", comp: "EQ" },
      { value: [["pattern","tuxedo"]], mood: "pleased", comp: "GE" },
    ],
  },
];
