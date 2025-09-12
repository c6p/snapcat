import { type Objective, type TypeMap } from "./traits";

export type LevelState = "base" | "dragging" | "done";

export type LevelDef = {
  catCount: number;
  objectives?: Objective[];
  text?: string;
  /*text?: {
    base?: string;
    step?: string;
    done?: string;
  };*/
  doneFn?: (updateInfo: (txt: string, done?: boolean) => void) => void; //(updateInfo: (state: LevelState) => void) => void;
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
    text: "<li>Black cats love group photos.</li><li>Most other cats think black cat's are bad luck (dislike), though some of them like them.</li><li>But, this one is a little lonely.</li><li>For now, let's drag & drop it to other rows.</li>",
    /*text: {
      base: "<li>Black cats love group photos.</li><li>But, this one is a little lonely.</li><li>For now, let's drag & drop it to other rows.</li>",
      step:
        "<br><li>Great! The cat will sit on where its bottom is.</li><li>Try more to get a hang of it.</li>",
      done: "<li>Great! Now, let's take a photo.</li>",
    },*/
    doneFn: (updateInfo) => {
      let counter = 0;
      let oldRowId: string = "";
      const draggables =
        document.querySelectorAll<SVGGeometryElement>(".draggable");
      draggables.forEach((el) => {
        //console.error(el);
        const down = () => {
          oldRowId = (el.parentNode! as SVGGElement).dataset.index!;
        };
        const up = () => {
          window.requestAnimationFrame(() => {
            /*console.error(
              "up",
              oldRowId,
              (el.parentNode! as SVGGElement).dataset.index!
            );*/
            if (oldRowId !== (el.parentNode! as SVGGElement).dataset.index!) {
              counter++;
            }
            if (counter === 3) {
              el.removeEventListener("pointerdown", down);
              el.removeEventListener("pointerup", up);
              updateInfo("<li>Great! Now, let's take out first photo.</li>", true);
            } else if (counter === 1) {
              updateInfo("<li>Great! The cat will sit on where its bottom is.</li><li>Try more to get a hang of it.</li>");
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
    text: "<li>Cats differ in color, accessories, likes, and dislikes.</li><li>Each cat's mood depends on its likes and dislikes.</li><li>You can find more about it on help menu.</li><li>Being close to other cats effects their mood.</li><li>If a cat is too far away to have an effect, it will look out of focus.</li><li>Try to make cats far apart.</li>",
    /*text: {
      //Cats differ in color, accessories, likes, and dislikes.
      base: "<li>Cats differ in color, accessories, likes, and dislikes.</li><li>Each cat's mood depends on its likes and dislikes.</li><li>You can find more about it on help menu.</li>",
      step:
        "<li>Being close to other cats effects their mood.</li><li>If a cat is too far away to have an effect, it will look out of focus.</li><li>Try to make cats far apart.</li>",
      done: "<li>Great! Now, we are ready to be a CATographer.</li>",
    },*/
    doneFn: (updateInfo) => {
      const draggables = [
        ...document.querySelectorAll<SVGGeometryElement>(".draggable"),
      ];
      draggables.forEach((el) => {
        const far = () => {
          //console.error(draggables.map(d => d.classList.contains("far")))
          if (draggables.some((d) => d.classList.contains("far"))) {
            updateInfo("<li>Great! Now, we are ready to be a CATographer.</li>", true);
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
      { value: blackCat, mood: "content", comp: "GE" },
      { value: [["accessory", "balloon"]], mood: "pleased", comp: "GE" },
    ],
    text: "<li>All levels have an objective for black cats.</li><li>Some levels have additional objectives.</li><li>Try to meet all of them.</li>",
    /*text: {
      base: "<li>All levels have an objective for black cats.</li><li>Some levels have additional objectives.</li><li>Try to meet all of them.</li>",
      done: "<li>Great! Let's try a harder one.</li>",
    },*/
  },
  {
    catCount: 4,
    objectives: [
      { value: blackCat, mood: "downcast", comp: "LE" },
      { value: [["color", "cream"]], mood: "downcast", comp: "LE" },
    ],
  },
  {
    catCount: 5,
    objectives: [
      { value: blackCat, mood: "cheerful", comp: "EQ" },
      { value: [["accessory", "umbrella"]], mood: "downcast", comp: "LE" },
    ],
  },
  {
    catCount: 6,
    objectives: [
      { value: blackCat, mood: "pleased", comp: "EQ" },
      { value: [["accessory", "bowtie"]], mood: "pleased", comp: "GE" },
      { value: [["accessory", "tie"]], mood: "pleased", comp: "GE" },
      { value: [["pattern", "tuxedo"]], mood: "content", comp: "EQ" },
    ],
  },
  {
    catCount: 7,
    objectives: [
      { value: blackCat, mood: "pleased", comp: "GE" },
      { value: [["accessory","balloon"]], mood: "cheerful", comp: "EQ" },
      { value: "fallback", mood: "pleased", comp: "GE" },
    ],
  },
  {
    catCount: 8,
    objectives: [
      { value: blackCat, mood: "cheerful", comp: "EQ" },
      { value: [["accessory","beanie"]], mood: "cheerful", comp: "EQ" },
      { value: [["accessory","scarf"]], mood: "cheerful", comp: "EQ" },
    ],
  },
  {
    catCount: 9,
    objectives: [
      { value: blackCat, mood: "miserable", comp: "EQ" },
      { value: [["color", "gray"]], mood: "cheerful", comp: "EQ" },
      { value: [["pattern", "tabby"]], mood: "pleased", comp: "GE" },
      { value: [["accessory","umbrella"]], mood: "cheerful", comp: "LE" },
    ],
  },
  {
    catCount: 10,
    objectives: [
      { value: blackCat, mood: "cheerful", comp: "EQ" },
      { value: [["pattern", "tabby"]], mood: "cheerful", comp: "EQ" },
      { value: [["pattern", "tuxedo"]], mood: "cheerful", comp: "EQ" },
      { value: [["accessory","umbrella"],["accessory","sunglasses"]], mood: "cheerful", comp: "EQ" },
      { value: [["accessory","tie"]], mood: "pleased", comp: "GE" },
    ],
  },
  {
    catCount: 11,
    objectives: [
      { value: blackCat, mood: "cheerful", comp: "GE" },
      { value: [["accessory","cap"]], mood: "cheerful", comp: "GE" },
      { value: [["accessory","bag"]], mood: "downcast", comp: "LE" },
      { value: [["color","white"]], mood: "content", comp: "EQ" },
    ],
  },
  /*{
    catCount: 12,
    objectives: [
      { value: blackCat, mood: "cheerful", comp: "LE" },
      //{ value: [["accessory","hat"]], mood: "cheerful", comp: "NO" },
      //{ value: [["accessory","beanie"]], mood: "cheerful", comp: "NO" },
      //{ value: [["accessory","band"]], mood: "cheerful", comp: "NO" },
      //{ value: [["accessory","cap"]], mood: "cheerful", comp: "NO" },
      //{ value: [["color","orange"]], mood: "pleased", comp: "LE" },
      //{ value: [["color","gray"]], mood: "content", comp: "LE" },
      //{ value: [["color","cream"]], mood: "downcast", comp: "LE" },
      //{ value: [["color","white"]], mood: "miserable", comp: "LE" },
    ],
  },*/
];
