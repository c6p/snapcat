import { Random } from "./utils";
import { CAT_COLORS, CAT_PATTERNS, catColors, type CatColor, type CatPattern } from "./colors";
import { type CatName, CAT_NAMES } from "./names";
import {
  Comparators,
  MoodLevels,
  Moods,
  objectiveMatches,
  Score,
  type CatTrait,
  type ComparatorKey,
  type Mood,
  type Objective,
  type TypeMap,
} from "./traits";
import { calcContributionMatrix, generateCats, toCatList, type Cat } from "./cat";
import { levels } from "./levels";
//import { solutions } from "./solutions";
import { blackCat, levelDefs } from "./levelDefs";
import { ACCESSORIES, placeOrder, type Accessory, type AccessoryPlace } from "./accessories";

//const DEBUG = false;

const WIDTH = 640;
const HEIGHT = 1000;
const INFO_HEIGHT = HEIGHT - 500;
const ROW_HEIGHT = 60;
//const ROW_PROXIMITY_MULTIPLIER = 1;
const STEP_OFFSET = 10;
const BOTTOM_BAR = 80;
const ROW_MIN = HEIGHT - (BOTTOM_BAR + 30);
const NEAR_LIMIT_SQUARED = 200 * 200;

const CATS = generateCats();
const { rand } = Random();

const putSound = (document.getElementById("click1") as HTMLAudioElement)!;
putSound.volume = 0.3;
const shutterSound1 = (document.getElementById("click2") as HTMLAudioElement)!;
const shutterSound2 = (document.getElementById("click3") as HTMLAudioElement)!;

const Spatial = {
  Disjoint: 0,
  Overlapping: 1,
  Contained: 2,
} as const;

let cats = {} as Record<CatName, Cat>;
let catNames = {} as Record<CatColor, CatName[]>;
let contributions = [] as number[][];
let indices = {} as { [K in CatName]: number };
let APP: HTMLDivElement;
let GameState = { levels: levels.map(_ => null) } as { levels: ({ score: number } | null)[] };

export function returnToMenu() {
  APP = document.querySelector<HTMLDivElement>("#app")!;
  console.debug("Returning to menu");

  APP.innerHTML = `
    <div class="card">
      <h1>SnapCat !</h1>
      <p>Complete the Black Cats' Album</p>
      <h1>📸 😺</h1>
      <br>
      <button id="game" type="button">Play Game</button>
    </div>
`;
  document
    .querySelector<HTMLButtonElement>("#game")!
    .addEventListener("click", () => startGame());
}

function takePhoto(cleanup: () => void) {
  if (document.getElementById("photo")?.classList.contains("no")) return;
  ["objectives", "info", "catInfo", "blackBar"].forEach(id => {
    document.getElementById(id)!.style.display = "none";
  })
  const lastLevel = levelState.level === levels.length-1
  if (!lastLevel)
    document.getElementById("nxtLvlBtn")!.style.display = "block";
  const flash = document.getElementById("flash")!;
  flash.classList.add("fire");
  flash.onanimationend = () => {
    document.getElementById("gameArea")?.classList.add("sepia");
    flash.style.animation = "";
  };
  shutterSound2.play();
  window.setTimeout(() => shutterSound1.play(), 150);

  // Sum the scores of all draggable cats and log or use as needed
  const draggables = Array.from(document.querySelectorAll<SVGGraphicsElement>(".draggable"));
  let totalScore = draggables 
    .map(el => Number(el.dataset.score) || 0)
    .reduce((sum, score) => sum + score, 0)  / draggables.length;
  totalScore = 50 + Math.min(15, Math.max(-15, totalScore)) * (50 / 15);
  //console.error("Total score:", totalScore);
  document.getElementById("score")!.innerHTML = "Score: " + totalScore.toFixed(1) 
  if (lastLevel) {
    const end = document.getElementById("end")!;
    end.style.display = "block"
    end.querySelector<SVGTextElement>("text")!.innerHTML = "<tspan font-size='30' x='300'>The Black Cat Album is full</tspan><tspan x='300' dy='70'>📸 Thanks, folks ! 🐾</tspan>"
  }
  // TODO save to localstorage
  const { level, cats } = levelState;
  GameState.levels[level] = { score: totalScore };
  localStorage.setItem(`snapcat-levels`, JSON.stringify(GameState));
  localStorage.setItem(`snapcat-level-${level + 1}`, JSON.stringify({ cats }));

  cleanup();
}

function showLevelMenu() {
  let lastSolvedIndex = GameState.levels.findIndex((v) => v === null)
  if (lastSolvedIndex === -1)
    lastSolvedIndex = GameState.levels.length
  //console.warn("last", lastSolvedIndex)
  const levelSelect = document.getElementById("overlay")!;
  levelSelect.innerHTML = `<rect width="${WIDTH}" height="${HEIGHT}" fill="#333c" />
  <text x="${WIDTH / 2
    }" y="162" fill="#fff" font-size="48" text-anchor="middle">Level Select</text>
  ${levels
      .map(
        (_, index) => `
  <g id="level${index}" class="level ${index <= lastSolvedIndex ? "unlocked" : ""}" data-level="${index}" transform="translate(${(index % 5) * 125 + 20
          } ${Math.floor(index / 5) * 125 + 200})" style="cursor:pointer">
    <rect width="100" height="100" fill="#fff" />
    ${index > lastSolvedIndex ? `<use href="#lock" transform="translate(25 25)scale(2)"/>` :
            `<text x="50" y="40" fill="#000" font-size="36" font-weight="bold">${index + 1
            }</text>`}
          ${index < lastSolvedIndex ? `<text class="score" x="50" y="80" font-size="24" >✔ ${GameState.levels[index]?.score.toFixed(1) ?? 0}</text>` : ""}
  </g>
`
      )
      .join("")}
    <g id="mainMenuBtn" style="cursor:pointer" transform="translate(${WIDTH / 2} ${HEIGHT - 62
    })">
      <rect fill="#eee" width="250" height="40" x="-125" y="-20" rx="5" ry="5"/>
      <text fill="#111" font-size="24" text-anchor="middle" dominant-baseline="middle">Return to Main Menu</text>
    </g>
    `;

  levelSelect.querySelector("#mainMenuBtn")!.addEventListener("click", returnToMenu)
  levelSelect.querySelector("rect")!.addEventListener("click", hideOverlay);

  levelSelect.querySelectorAll<SVGElement>(".level.unlocked").forEach((level) => {
    level.addEventListener("click", () => {
      const selectedLevel = level.dataset.level;
      if (selectedLevel) {
        initLevel(parseInt(selectedLevel));
      }
    });
  });
}

function showHelpMenu() {
  const names = catNames.black.slice(0, 5) as CatName[];
  const help = document.getElementById("overlay")!;
  const allPatterns = CAT_PATTERNS.map(p => [p]).concat([["tabby", "tuxedo"]])
  const accessorySets = [["cap", "sunglasses", "tie", "balloon"], ["beanie", null, "scarf", "cane"], ["hat", "glasses", "bowtie", "bag"], ["band", null, null, "umbrella"]]
    .map(([h, e, n, d]) => [[h, "head"], [e, "eye"], [n, "neck"], [d, "hand"]] as [Accessory | null, AccessoryPlace][]).map(aps => aps.filter(([a]) => a !== null) as [Accessory, AccessoryPlace][])
  const base = { name: "Shadow", color: "black", patterns: ["plain"], accessories: [], xScale: 0.8, yScale: 0.8, traits: [] } as Cat
  help.innerHTML = `<rect width="${WIDTH}" height="${HEIGHT}" fill="#333c" />
  <g fill="#eee" font-size="24">
  <text id="moods" transform="translate(40,150)rotate(-90)">Moods</text>
  <text transform="translate(40,325)rotate(-90)">Colors</text>
  <text transform="translate(40,500)rotate(-90)">Patterns</text>
  <text transform="translate(40,700)rotate(-90)">Accessories</text>
  </g>
  ${names.map(name => {return createCat({ ...base, name })}) }
  ${catColors.map((color) => createCat({ ...base, name: catNames[color][5], color }))}
  ${allPatterns.map((patterns) => createCat({ ...base, name: "Honey", color: "orange", patterns }))}
  ${accessorySets.map((accessories) => createCat({ ...base, name: "Ash", color: "gray", accessories }))}
  ${["none", "likes", "dislikes"].map((label,i) => `<g id="${label}Btn" style="cursor:pointer" transform="translate(${(i+1)*WIDTH/4} ${HEIGHT - 62
  })">
    <rect fill="#eee" width="100" height="40" x="-50" y="-20" rx="5" ry="5"/>
    <text fill="#111" font-size="24" text-anchor="middle" dominant-baseline="middle">${label}</text>
  </g>`)}
  `;
  const draggables = [...help.querySelectorAll(".draggable")]
  let willMark = [] as SVGGraphicsElement[];
  draggables.slice(0, 5).forEach((cat, i) => {
    cat.setAttribute("transform", `translate(${i * 120 + 60}, 50)`)
    willMark.push(cat.querySelector(".cathead")!)
    const face = cat.querySelector(".face");
    const mood = Moods[i]
    face?.setAttribute("xlink:href", `#${mood}`)
    cat.insertAdjacentHTML("beforeend", `<text transform="translate(40 -10)" fill="#eee" text-anchor="middle">${mood}</text>`)
  })
  draggables.slice(5, 10).forEach((cat, i) => {
    willMark.push(cat.querySelector(".body")!)
    cat.setAttribute("transform", `translate(${i * 120 + 60}, 225)`)
    cat.insertAdjacentHTML("beforeend", `<text transform="translate(40 -10)" fill="#eee" text-anchor="middle">${catColors[i]}</text>`)
  })
  draggables.slice(10, 14).forEach((cat, i) => {
    willMark.push(...cat.querySelectorAll<SVGGraphicsElement>(".tuxedo, .tabby"))
    cat.setAttribute("transform", `translate(${i * 120 + 60}, 400)`)
    cat.insertAdjacentHTML("beforeend", `<text transform="translate(40 -10)" fill="#eee" text-anchor="middle">${allPatterns[i].join('+')}</text>`)
  })
  const places = Object.keys(ACCESSORIES)
  places.forEach((p, i) => {
    help.insertAdjacentHTML("beforeend", `<text transform="translate(40 ${750 + i * 30})" fill="#eee" text-anchor="middle" font-weight="bold">${p}</text>`)
  })
  draggables.slice(14, 18).forEach((cat, i) => {
    willMark.push(cat.querySelector(".accessories")!)
    cat.setAttribute("transform", `translate(${i * 120 + 100}, 600)`)
    accessorySets[i].forEach(([a, p]) =>
      cat.insertAdjacentHTML("beforeend", `<text transform="translate(40 ${150 + places.indexOf(p) * 30})" fill="#eee" text-anchor="middle">${a}</text>`))
  })
  help.querySelector("rect")!.addEventListener("click", hideOverlay);

  /*let traits = [{kind:"cat",likes:names}, {kind:"color",likes:catColors}] as CatTrait[]
  traits.forEach((trait) => {
    const [key, elems] = getElemsByTrait(trait, "Ash");
    if (elems) markElements([...elems], key);
  });*/
  const swap = (likeDislikes: boolean) => {
    help.querySelector("#moods")!.textContent = likeDislikes ? "Cats" : "Moods";
    [...help.querySelectorAll(".draggable text:last-child")].slice(0,5).forEach((t,i) => t.textContent = likeDislikes ? names[i] : Moods[i]);
  }
  ["likes", "dislikes"].map(l => help.querySelector(`#${l}Btn`)?.addEventListener("click", ()=> {swap(true); markElements(willMark, l)}))
  help.querySelector(`#noneBtn`)?.addEventListener("click", ()=> {swap(false);unmarkAll()})
}

function hideOverlay() {
  document.getElementById("overlay")!.innerHTML = "";
}

function startGame() {
  console.debug("Game started");
  const gameStorage = localStorage.getItem(`snapcat-levels`)
  if (gameStorage) {
    GameState = JSON.parse(gameStorage);
    let nextLvl = GameState.levels.findIndex(l => l === null);
    if (nextLvl === -1) nextLvl = 0
    initLevel(nextLvl);
  } else {
    initLevel(0);
  }
}

/*function randomCats(catCount: number) {
  const catList = toCatList(CATS);
  Array.from({ length: catCount }, (_) => choose(catList)).forEach((cat) => {
    cats[cat.name] = cat;
  });
  // ensure a black cat
  const isBlack = (c: Cat) =>
    c.color === "black" && !c.patterns.includes("tuxedo");
  if (!Object.values(cats).find(isBlack)) {
    const blackCat = catList.find(isBlack);
    if (blackCat) {
      // delete random cat
      delete cats[choose(Object.values(cats))!.name];
      // add black cat
      cats[blackCat.name] = blackCat;
    }
  }
}*/

type CatPosMap = Record<CatName, { row: number, x: number }>
let levelState: { level: number; done: boolean; /*state: LevelState;*/ objectivesMet: boolean, cats: Record<CatName, { row: number, x: number }> };
function initLevel(lvl: number, forceRandom: boolean = false) {
  //console.error(lvl)
  catNames = Object.assign({} as typeof catNames, CAT_NAMES);
  const levelStorage = localStorage.getItem(`snapcat-level-${lvl + 1}`)
  //console.error(`snapcat-level-${lvl + 1}`, levelStorage)
  const levelData = levelStorage ? JSON.parse(levelStorage) as { cats: CatPosMap } : null;
  levelState = { level: lvl, done: false, /*state: "base",*/ objectivesMet: false, cats: levelData?.cats ?? {} as CatPosMap };

  const rowCount = 5;
  const rows = Array.from({ length: rowCount }, (_, i) =>
    createRow(rowCount - i - 1)
  ).join("");

  cats = {} as Record<CatName, Cat>;
  const level = levels[lvl];
  let catList = toCatList(CATS);
  catList = level.cats.map((c) => catList[c]);
  contributions = calcContributionMatrix(catList);
  //console.warn(contributions);
  catList.forEach((cat, i) => {
    cats[cat.name] = cat;
    indices[cat.name] = i;
  });
  //randomCats(9);
  //console.warn(cats);

  const catsHtml = Object.values(cats)
    .map((cat) => createCat(cat))
    .join("");

  const icons = `
  <g id="menu"><path d="M3 5H21" stroke="#000" stroke-width="1.5"></path><path d="M3 12H21" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 19H21" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></g>
  <path id="camera" fill-rule="evenodd" clip-rule="evenodd" d="M7.72 2.79L5.5 5.75C5.26393 6.06475 4.89344 6.25 4.5 6.25H4C2.48122 6.25 1.25 7.48122 1.25 9V19C1.25 20.5188 2.48122 21.75 4 21.75H20C21.5188 21.75 22.75 20.5188 22.75 19V9C22.75 7.48122 21.5188 6.25 20 6.25H19.5C19.1066 6.25 18.7361 6.06474 18.5 5.75L16.28 2.79C16.0251 2.45007 15.625 2.25 15.2 2.25H8.8C8.37508 2.25 7.97495 2.45007 7.72 2.79ZM12 8.25C9.37664 8.25 7.25 10.3767 7.25 13C7.25 15.6233 9.37664 17.75 12 17.75C14.6233 17.75 16.75 15.6233 16.75 13C16.75 10.3767 14.6233 8.25 12 8.25Z" fill="#000000"></path>
  <path id="xmark" d="M6.75827 17.2426L12.0009 12M17.2435 6.75736L12.0009 12M12.0009 12L6.75827 6.75736M12.0009 12L17.2435 17.2426" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
  <path id="lock" d="M16 12H17.4C17.7314 12 18 12.2686 18 12.6V19.4C18 19.7314 17.7314 20 17.4 20H6.6C6.26863 20 6 19.7314 6 19.4V12.6C6 12.2686 6.26863 12 6.6 12H8M16 12V8C16 6.66667 15.2 4 12 4C8.8 4 8 6.66667 8 8V12M16 12H8" fill="none" stroke="chocolate" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
  <g id="restart"><path d="M6.67742 20.5673C2.53141 18.0212 0.758026 12.7584 2.71678 8.1439C4.87472 3.0601 10.7453 0.68822 15.8291 2.84617C20.9129 5.00412 23.2848 10.8747 21.1269 15.9585C20.2837 17.945 18.8736 19.5174 17.1651 20.5673" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17 16V20.4C17 20.7314 17.2686 21 17.6 21H22" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></g>
  `;
  const faceDefs = `
    <g id="miserable" stroke-width="2" >
      <use xlink:href="#eye1" stroke-width="2" transform="matrix(-.997 0 0 .992 99 .3)"/>
      <path id="eye1" fill="none" stroke-width="3" d="m65 36.6 8.5 4.9"  />
      <path fill="none" stroke-width="2" d="M57.6 59.4c.3-3.4-1.2-6.3-7.4-7.8l-.4-7 .4 7c-7.2 1-7 7.8-7 7.8" />
    </g>
    <g id="downcast" stroke-width="2" >
      <use xlink:href="#eye2" stroke-width="2"  transform="matrix(-.997 0 0 .992 99 .3)"/>
      <path id="eye2" fill="none" stroke-width="5" d="M67.7 38.4h.4"  />
      <path fill="none" stroke-width="2" d="M49.8 45.3v11.2" />
    </g>
    <g id="content" stroke-width="2" >
      <use xlink:href="#eye3" transform="matrix(-.997 0 0 .992 99.9 .3)"/>
      <path id="eye3" fill="none" d="M75.7 34.3c-.6 3.6-10.3 2.7-10.8-1"  />
      <path fill="none" d="m49.8 45 .5 11.8s-1 .8-1 1.3.7 1.1 1.1 1.1c.5 0 1-.6 1-1.1 0-.5-1.1-1.3-1.1-1.3"/>
    </g>
    <g id="pleased" stroke-width="2" >
      <use xlink:href="#eye4" transform="matrix(-.997 0 0 .992 99 .3)"/>
      <path id="eye4" fill="none" d="M65.4 37.4c-1.4-4.4 6.5-6.8 8-.6"  />
      <path fill="none" d="M62.7 52.9c-1 3.7-13.2 7.8-13-1.3V45v6.8c-.3 9.1-11.9 6.3-13 1" />
    </g>
    <g id="cheerful" stroke-width="2" >
      <use xlink:href="#eye5" transform="matrix(-.997 0 0 .992 100.3 .3)"/>
      <path id="eye5" fill="none" d="M76.6 36.8c-19 .7-16 .3-1.4-5"  />
      <path fill="#ff8080" d="M60.2 49.3C50.5 59.8 49.8 45 49.8 45s0 15.3-10.4 4c0 0-.6 12 10.2 12 10.8-.1 10.6-11.7 10.6-11.7Z" />
    </g>
  `;
  const accessoryDefs = `
    <path id="glasses" fill="#1a1a1a" d="M28.2 24.3c-5 .1-10 .4-14.7 1.8-3.2 3 1.7 6 2 9 1.1 4.7 2 10.4 6.5 13 4.4 2.3 9.6 2 14.2 1.2 5.3-1.3 8.9-6 10.4-11 .1-3.7 5-5.2 6.3-1.3 1 3 1.8 6 4.1 8.3 2.8 3.2 7 4.6 11.1 4.6 5 .3 10.9-1 13.4-5.7 2-3.5 2.4-7.7 3.4-11.6 3-1.2 3.8-6.8-.3-6.9a61.4 61.4 0 0 0-31.4 1.6c-6.1 1.3-12-1.8-18-2.4-2.3-.4-4.7-.6-7-.6Zm41.5 3c3.7.2 8 .1 11 2.7 2.1 3.4.8 7.7 0 11.3a9 9 0 0 1-8.1 6.4c-5.5 1-12-.1-15.2-5.2A14 14 0 0 1 54.7 32c1.5-3.5 5.7-4 9-4.4 2-.3 4-.4 6-.4zm-39.5 0c4.7.3 10 .2 14 3.1 2.4 3.2.6 7.4-1 10.6-2 3.9-6 7-10.5 6.8-4.5.5-10.2 0-12.6-4.5a15.3 15.3 0 0 1-1.3-12.6c2.6-3.5 7.6-3 11.4-3.4z" />
    <path id="sunglasses" fill="#3f0a00ff" fill-opacity=".9" d="M28.2 24.3c-5 .1-10 .4-14.7 1.8-3.2 3 1.7 6 2 9 1.1 4.7 2 10.4 6.5 13 4.4 2.3 9.6 2 14.2 1.2 5.3-1.3 8.9-6 10.4-11 .1-3.7 5-5.2 6.3-1.3 1 3 1.8 6 4.1 8.3 2.8 3.2 7 4.6 11.1 4.6 5 .3 10.9-1 13.4-5.7 2-3.5 2.4-7.7 3.4-11.6 3-1.2 3.8-6.8-.3-6.9a61.4 61.4 0 0 0-31.4 1.6c-6.1 1.3-12-1.8-18-2.4-2.3-.4-4.7-.6-7-.6Z" />
    <path id="cap" fill="rgba(248, 67, 43, 1)" d="m27 12.6 22.2-.2-.3-20.3.3 20.4h21.7M48.2-8.3C30.7-8.4 26.1 1 26.1 12.8l1.2-.3s-3.7 5.6-2.6 7.8c2.6 5.5 12.6-1.3 24.7-1.3 12 0 21.5 6.8 24.1 1.3 1-2.2-2.6-7.7-2.6-7.8l1.2.3C72.1 2 65.1-8 49.4-8.4c-.7 0 5-1.2-.4-1.2-6.5 0 .2 1.2-.8 1.2z" />
    <path id="beanie" fill="rgba(2, 185, 73, 1)" d="m42.9-12.3-.1-1a6.6 6.6 0 1 1 13 1M73 9.7l-5.2 11.9m0-12-5.3 12m0-12-5.2 12m0-12-5.2 12m0-12-5.3 12m0-12-5.2 12m0-12-5.3 12m0-12-5.2 12m0-12-5.2 12m47.1 0H25.8v-12h47.1Zm-44.1-12V7.2a20.6 20.6 0 0 1 41.2 0v2.4" />
    <g id="hat" >
      <path id="path8" fill="#deaa87" d="M49.5-12.5a20 20 0 0 0-9.6 2.3C33.9-6.9 29.4 0 29.4 11.3c-5-1.5-8-2.6-8.4-.4-1 4.3 11.6 9.2 28.5 9.2 17 0 29.6-4.9 28.6-9.2-.5-2.2-3.4-1.1-8.4.4 0-17-9.9-23.8-20.2-23.8Z"/>
      <path id="path9-4" fill="#000" fill-opacity=".6" d="M69.8 11.4A47.8 47.8 0 0 1 50 14a52 52 0 0 1-20.6-2.7l.4-5.2a47.8 47.8 0 0 0 19.8 2.7c8.2 0 16-.6 19.8-2.7z"/>
    </g>
    <path id="band" fill="rgba(49, 144, 253, 1)" d="M90.3 28c-7.8 2.3-23.4 2.8-40.1 2.8-16.8 0-34-.5-41.7-2.7l.7-5.2c7.7 2.2 23.4 2.7 40.1 2.7 16.7 0 32.3-.5 40-2.7z" />
    <path id="tie" fill="url(#strips)" d="M47.9 70.4 54 70l4.6 45.6-9 9.1L42 115z" />
    <path id="bowtie" fill="rgba(204, 0, 0, 1)" d="m50.7 70.7-.4 6.2 3.6-.3 11 4.9-.2-16.3-10.8 6 .2 5.6-.2-5.5-3.2-.2L39 64.6l-1 16.8L50.4 77" />
    <g id="scarf" fill="url(#wave)" transform="translate(.6 8.7)">
      <path d="M83.5 97c-14.8.7-30-3.2-44.5 1.2-4 1.5-7-8.6-6-5.9L28.8 81c1-4.2 21.3-2.1 12-2.5 9 .7 18.2-.2 27.3-1.1 5.4-.4 10.9-.7 16.2 0 5.4 3.7 7.4 16.5 6.2 12 .7 3 1.3 8.3-3.5 7.5a62 62 0 0 1-3.4.3z" transform="rotate(90 58 90)"/>
      <path d="M93 49.3a49.9 49.9 0 0 1-16.8 14.5 61 61 0 0 1-40.6 5A70.5 70.5 0 0 1 6.6 51c-4.8-4.5-3.8-10-1.4-12.5.2-4 1.6-8 5.9-5 6.8 3.4 13.3 8.2 21 13.6 14.3 9.8 22.8 6.5 37.6-1.8 4.8-2.2 10.4-8 14.6-10.9 4.8-2.8 8.3-2.3 8.3 3.3-.2 3.9 2.1 8.1.4 11.6z"/>
    </g>
    <path id="cane" transform="translate(-55 0)" fill="#803300" d="M100.2 81.6c1.5.2 3 1 4.2 2 1.5 1.2 2.5 2.8 3.2 4.7.5 1.2.7 2.2 1 3.5v54.8c-.2 1.2-.9 2.2-1.8 2.6l-.7.1c-.6 0-.8 0-1.2-.3a3.4 3.4 0 0 1-1.4-2.1V92.6l-.2-.3c-.2-1-.5-1.7-1-2.4a4 4 0 0 0-1.4-1.2c-.8-.5-1.8-.6-2.7-.2a4.8 4.8 0 0 0-2.8 3.3 8 8 0 0 0-.2 1.8 4 4 0 0 1-.3 1.6c-.6 1.1-1.3 1.7-2.3 1.7-1 0-1.9-.7-2.3-1.9a13.1 13.1 0 0 1 1.7-8.7c.3-.6 1.3-1.8 1.7-2.3a9 9 0 0 1 4.3-2.3h2.2z"/>
    <g id="umbrella" transform="scale(0.7 1)translate(30 -5)rotate(30.4 57.4 -17.7)">
      <path id="path1-7" transform="rotate(7 30 -10)" fill="#333" d="m48.1 2.8 23.5 38.7 23.5 38.8v.6c1.6 3.3 2.9 6.7.1 8.1-2.7 1.5-5.1-.6-6.7-1-5.5-3.2-2.9 3.2 3.5 5.1 2.9-.2 5.3.4 7.3-2.5 1.9-2.8 2.4-5.6 1.5-8.3A39685 39685 0 0 0 51.6 1.1" display="inline"/>
      <path id="path1-1" fill="navy" d="M18.5-44.4c-1.3.7-2 3-2 3l-3.1 2A73.3 73.3 0 0 0-14.5-7.5a64 64 0 0 0-3 10 59.1 59.1 0 0 0 10 43.7l.5.8.9-1.7A51.3 51.3 0 0 1 5.2 31.6a29.4 29.4 0 0 1 27.1-5l.3-1.1c.6-3.4 3-7.9 6.1-11.4A54.3 54.3 0 0 1 55.3 2.2c8-3.6 15.1-5.1 21.3-4.5l1.7.1.2-.8c1.1-6 3.4-10.7 7-14.7a36.1 36.1 0 0 1 16.8-9.6c2.4-.7 6.7-1.3 9.2-1.4l2.1-.1-1.4-2c-13.4-19.3-29.9-28.4-50-27.7a81.3 81.3 0 0 0-38.5 12.7l-2 1.2s-2-.6-3.2.2z"/>
    </g>
    <path id="bag" transform="translate(-55 0)" fill="#f4eed7" d="M82.4 100.6S80 85.9 94 86c13.8.2 11.5 14 11.5 14l-3.7-.2s1.4-11.5-8-11.5c-9.6 0-8.7 12.4-8.7 12.4s25.3-2.3 28.7 1.6c3.3 4 5.3 21.4 2.5 24.8-2.9 3.4-41.3 2.4-44.6-.2-3.4-2.7 0-21.9 2.6-24.8 2.7-3 8-1.6 8-1.6z"/>
    <path id="balloon" transform="translate(-55 0)" fill="#fd5" d="M95.3-55.6a20 20 0 0 0-5.4 2 22.3 22.3 0 0 0-11.3 17.1 29 29 0 0 0 3 15.1 71.1 71.1 0 0 0 10.2 15 16.3 16.3 0 0 0 5.4 4c.2.2-.2.9-1.3 2.5-.7 1.2-.7 1.3-.2 1.3l.5.1 1.6.4c.4 0 .4 0 .3.3-.1.4-.2 88.7 0 89 0 .4.3.6.4.3l.2-28.9.1-60.3 1 .2 1 .2.3-.4c.2-.3.7-.6 1.1-.8.5-.2.8-.4.8-.6 0 0-.2-.5-.7-1-1-1.2-1.5-2-1.5-2.3a24.4 24.4 0 0 0 8.4-8 76 76 0 0 0 6.5-10.4 25 25 0 0 0 3.4-12.4 23.4 23.4 0 0 0-3.7-13.6c-3.1-4.6-8.1-8-13.2-8.8a39 39 0 0 0-6.9 0z" />
  `;
  APP.innerHTML = `
  <svg id="game" height="100%" viewBox="0 0 ${WIDTH} ${HEIGHT}" >
  <defs>
    <pattern id="tabby" width="24" height="10" fill="#ccc" patternTransform="scale(3)" patternUnits="userSpaceOnUse">
        <path d="M12-2C9.2-2 7.2-.6 5.4.7 3.7 1.9 2.2 3 0 3v2c2.8 0 4.8-1.4 6.6-2.7C8.3 1.1 9.8 0 12 0s3.7 1 5.4 2.3C19.2 3.6 21.2 5 24 5V3c-2.2 0-3.7-1-5.4-2.3C16.8-.6 14.8-2 12-2Z"/>
        <path d="M12 3C9.2 3 7.2 4.4 5.4 5.7 3.7 6.9 2.2 8 0 8v2c2.8 0 4.8-1.4 6.6-2.7C8.3 6.1 9.8 5 12 5s3.7 1 5.4 2.3C19.2 8.6 21.2 10 24 10V8c-2.2 0-3.7-1-5.4-2.3C16.8 4.4 14.8 3 12 3Z"/>
        <path d="M12 8c-2.8 0-4.8 1.4-6.6 2.7C3.7 11.9 2.2 13 0 13v2c2.8 0 4.8-1.4 6.6-2.7C8.3 11.1 9.8 10 12 10s3.7 1 5.4 2.3c1.8 1.3 3.8 2.7 6.6 2.7v-2c-2.2 0-3.7-1-5.4-2.3C16.8 9.4 14.8 8 12 8Z"/>
    </pattern>
    <pattern id="strips" width="4" height="1" fill="rgba(199, 11, 11, 1)" patternTransform="rotate(45 -3.3 .6) scale(2)" patternUnits="userSpaceOnUse">
      <rect fill="rgba(0, 0, 167, 0.5)" width="100%" height="100%" />
      <path id="rect152" stroke="none" d="M0-.5h1v2H0z"/>
    </pattern>
    <pattern id="wave" width="24" height="10" fill="#e87e7e" patternTransform="matrix(20 50 0 20 28 0)" patternUnits="userSpaceOnUse">
        <rect width="100%" height="100%" fill="#ffb3b3ff"/>
        <path id="path3" d="M12-2C9.2-2 7.2-.6 5.4.7 3.7 1.9 2.2 3 0 3v2c2.8 0 4.8-1.4 6.6-2.7C8.3 1.1 9.8 0 12 0s3.7 1 5.4 2.3C19.2 3.6 21.2 5 24 5V3c-2.2 0-3.7-1-5.4-2.3C16.8-.6 14.8-2 12-2Z"/>
        <path id="path4" d="M12 3C9.2 3 7.2 4.4 5.4 5.7 3.7 6.9 2.2 8 0 8v2c2.8 0 4.8-1.4 6.6-2.7C8.3 6.1 9.8 5 12 5s3.7 1 5.4 2.3C19.2 8.6 21.2 10 24 10V8c-2.2 0-3.7-1-5.4-2.3C16.8 4.4 14.8 3 12 3Z"/>
        <path id="path7" d="M12 8c-2.8 0-4.8 1.4-6.6 2.7C3.7 11.9 2.2 13 0 13v2c2.8 0 4.8-1.4 6.6-2.7C8.3 11.1 9.8 10 12 10s3.7 1 5.4 2.3c1.8 1.3 3.8 2.7 6.6 2.7v-2c-2.2 0-3.7-1-5.4-2.3C16.8 9.4 14.8 8 12 8Z"/>
    </pattern>
    <path id="body" d="M52.8 149.5a203 203 0 0 1-44-4c-5.8-.6-7-6.8-7.4-12.2a314 314 0 0 1 2.6-70C8 36 12.5 29.5 5.3 1c0 0 9.7 5 28.5 17 10.5-.8 23.3 1 32.9 0C86.2 3.2 92 1.3 92 1.3c-6.4 30.8.3 37.8 4 65.3 3.8 27.6 4 52 2.6 67.6.2 6.5-4.8 10.7-10.2 11.7a138.6 138.6 0 0 1-35.7 3.7Z" />
    ${icons}
    ${faceDefs}
    ${accessoryDefs}
  </defs>
    <foreignObject x="0" y="0" width="320" height="${INFO_HEIGHT}"><ul id="objectives"></ul></foreignObject>
    <foreignObject x="0" y="300" width="640" height="${INFO_HEIGHT}"><div id="info"></div></foreignObject>

    <foreignObject x="330" y="0" width="300" height="${INFO_HEIGHT}" id="catInfo"></foreignObject>
    <g id="gameArea">
    ${rows}
    ${catsHtml}
    </g>
    <rect id="flash" x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="#eff" opacity="0" />
    <g id="menuBtn" transform="translate(${WIDTH - 60
    } 10)" style="cursor:pointer">
      <rect width="48" height="48" fill="#eee" rx="5" ry="5"/>
      <use href="#menu" transform="scale(2)" style="cursor:pointer">
    </g>
    <g id="helpBtn" transform="translate(${WIDTH - 100
    } 34)" style="cursor:pointer">
      <rect x="-24" y="-24" width="48" height="48" fill="#eee" rx="5" ry="5"/>
      <text font-size="48" text-anchor="middle" dominant-baseline="central">?</text>
    </g>
    <g id="nxtLvlBtn" style="cursor:pointer" transform="translate(${WIDTH / 2} ${HEIGHT - 62
    })">
      <rect fill="#eee" width="250" height="40" x="-125" y="-20" rx="5" ry="5"/>
      <text fill="#111" font-size="24" text-anchor="middle" dominant-baseline="middle">Next Level</text>
    </g>
    <text id="score" x="200" y="200" font-size="48" fill="green"></text>
    <g id="end">
    <rect fill="#eee" x="170" width="135" height="40" y="270" />
    <text y="300" font-size="48" fill="black" font-weight="bold"></text>
    </g>
    <g id="blackBar" transform="translate(0 ${HEIGHT - BOTTOM_BAR})">
      <rect  width="${WIDTH+5}" height="${BOTTOM_BAR}" fill="#111" />
      <text fill="#eee" font-size="36" transform="translate(50 54)">${lvl+1}</text>
      <use id="replay" href="#restart" stroke="#eee" transform="translate(570 16)scale(2)"/>
      <g transform="translate(${WIDTH / 2} ${BOTTOM_BAR / 2
    })" id="photo" style="cursor:pointer">
        <circle cx="0" cy="0" r="${BOTTOM_BAR / 2 - 5}" fill="#eee" />
        <use href="#camera" transform="scale(2)translate(-12 -12)" />
        <use href="#xmark" stroke="rgba(187, 0, 0, 1)" transform="scale(4)translate(-12 -12)" />
      </g>
    </g>
    <g id="overlay" />
  </svg>
  `;
  //    <foreignObject  x="10" y="10" width="${WIDTH / 2 - 50}" height="${
  //    BOTTOM_BAR - 20
  //  }">
  //      <p id="textl"></p>
  //      </foreignObject>
  //      <foreignObject  x="${WIDTH / 2 + 40}" y="10" width="${
  //    WIDTH / 2 - 50
  //  }" height="${BOTTOM_BAR - 20}">
  //      <p id="textr"></p>
  //      </foreignObject>
  //console.warn(textl, textr);

  const removeEvents = setDragEvents();
  document.getElementById("score")!.textContent = "";
  document.getElementById("photo")!.onclick = () => takePhoto(removeEvents);
  document.getElementById("menuBtn")!.onclick = showLevelMenu;
  document.getElementById("helpBtn")!.onclick = showHelpMenu;
  document.getElementById("replay")!.onclick = () => initLevel(lvl, true)
  const nextLevel = document.getElementById("nxtLvlBtn")!
  nextLevel.onclick = () => { initLevel(lvl + 1); };
  nextLevel.style.display = "none";

  const draggables =
    document.querySelectorAll<SVGGeometryElement>(`.draggable`);
  //if (DEBUG) {
  //  const { row, x } = solutions[lvl];
  //  catList.forEach((cat, i) => {
  //    const catEl = document.querySelector<SVGGeometryElement>(`#${cat.name}`)!;
  //    const rowEl = getRowAt(row[i]);
  //    console.warn(catEl, rowEl, x[i]);
  //    putElementInRow(catEl, rowEl, x[i]);
  //  });
  //} else {*/
    draggables.forEach((cat) => {
      const c = forceRandom ? null : levelState.cats[cat.id as CatName];
      putElementInRow(cat, getRowAt(c?.row ?? rand(0, rowCount - 1)), c?.x ?? rand(110, 530))
    });
  //}
  draggables.forEach((cat) => setSmile(cat));

  const txt = levelDefs[lvl].objectives?.map(objectiveText).join("");
  document.getElementById("objectives")!.innerHTML =
    txt ? "<h3>Objectives</h3>" + txt : "";

  const { doneFn } = levelDefs[lvl];
  if (doneFn) doneFn(updateInfo);
  updateInfo(levelDefs[lvl].text ?? "");
  checkObjectives();
}

function createCat({
  name,
  color,
  patterns,
  accessories,
  xScale,
  yScale,
}: Cat): string {
  if (color === "black") patterns = patterns.filter((p) => p !== "tabby");
  else if (color === "white")
    patterns = patterns.filter((p) => p !== "tuxedo" && p !== "tabby");

  const stroke = "#100f0d";
  const black = color === "black";
  const tabby = patterns.includes("tabby");
  const tuxedo = patterns.includes("tuxedo");

  return `<g class="draggable ${tuxedo ? "white" : ""} ${[
    color,
    /*...patterns*/
    ,
  ].join(" ")}" id="${name}" style="--color:${CAT_COLORS[color]}">
  <g transform="scale(${xScale} ${yScale})">
    <use class="body" href="#body" fill="var(--color)" stroke="${stroke}" />
    <circle class="cathead" cx="50" cy="50" r="35" fill="var(--color)" stroke="none" />
    ${tabby
      ? '<use class="tabby" href="#body" fill="url(#tabby)" stroke="none" style="mix-blend-mode:multiply"/>'
      : ""
    }
    ${tuxedo
      ? '<path class="tuxedo" fill="#fbfcfc" stroke="none" stroke-width="1" d="M5.4 93c-12.4 0 34.4 15.7 9.5 52.6 34.7 4 38.3 4.4 73.8-1.4-34.3-35.5 20-50.7 7.8-50.8-42.4-.4-35.9-58-47-73.3C37.8 38.3 53.1 93.4 5.4 93Z" />'
      : ""
    }
    <use class="face" xlink:href="#content" style="${black ? "stroke:#fff; mix-blend-mode:difference" : "stroke:" + stroke
    }"/>
    <path id="nose" fill="${stroke}" stroke="#999" stroke-linecap="butt" stroke-linejoin="miter" stroke-width="1" d="M44.8 40.9c0-1.3 9.7-1.4 9.8-.2 0 0-2.5 4.6-4.8 4.6-2.4 0-5-4.4-5-4.4Z"/>
    <path id="ear" fill="#faa" stroke="${stroke}" stroke-width="1" d="m86.3 10-11.2 7 9.5 5.7Z"/>
    <use xlink:href="#ear" id="earl" stroke-width="1" transform="matrix(-.997 0 0 .992 98 0)"/>
    <g class="accessories">
    ${accessories.sort((a, b) => placeOrder.indexOf(a[1]) - placeOrder.indexOf(b[1])).map(
      ([item, place]) => `<use xlink:href="#${item}" class="${item} ${place}"/>`
    )}
    </g>
    <g id="hand${name}" style="${black && !tuxedo ? "stroke:#aaa" : "stroke:" + stroke
    }" fill="${tuxedo ? "#fbfcfc" : "var(--color)"
    }" stroke-width="1.5" transform="translate(-.4)rotate(90,77,87)">
      <path id="paw" d="M83.6 75.2c0-.4 1.7-7.4.2-10.4-.7-1.4-2.6-2.2-5.2-2.1h-.5c-2.5.1-5.3 1-6.2 2.6-1.5 2.8-.4 10-.4 10.4"/>
      <path id="finger" stroke-linejoin="miter" d="M79.8 63.1v2.6"/>
      <use xlink:href="#finger" id="finger2" transform="matrix(.988 0 0 .992 -3 .8)"/>
    </g>
    <use xlink:href="#hand${name}" fill="#fff" stroke-width="1" transform="matrix(-.997 0 0 .992 99.6 .5)rotate(180,78,87)"/>
  </g>
  <!--<g transform="translate(${xScale * 50 - 25} ${yScale * 150 - 50})">
    <rect width="50" height="50" fill="#eee9" />
    <text class="score" x="25" y="12" text-anchor="middle" dominant-baseline="central" fill="#000">0</text>
    <text class="contrib" x="25" y="38" text-anchor="middle" dominant-baseline="central" fill="#000">0</text>
  </g>-->
  </g>`;
}

function createRow(index: number) {
  const y = ROW_MIN - ROW_HEIGHT * index;
  const step = ROW_HEIGHT / 2 - 10;
  const x = 10 + index * 10;
  const y2 = y + step - STEP_OFFSET;
  return `<g class="row" data-index="${index}">
    <polygon points="${x},${y} ${WIDTH - x},${y} ${WIDTH - x + 10},${y + step
    } ${x - 10},${y + step}" fill="#e0e0e0"/>
    <rect x="${x - 10}" y="${y + step}" width="${WIDTH - 2 * x + 20}" height="${ROW_HEIGHT - step
    }" fill="#a0a0a0"/>
    <line class="row-line" x1="0" y1="${y2}" x2="${WIDTH}" y2="${y2}" />
  </g>`;
}

function getElemsByTrait(
  trait: CatTrait,
  name: CatName
): [
    key: "likes" | "dislikes",
    elems: NodeListOf<SVGGraphicsElement> | undefined
  ] {
  const [key, items] =
    "likes" in trait ? ["likes", trait.likes] : ["dislikes", trait.dislikes];
  let elems: NodeListOf<SVGGraphicsElement> | undefined;
  switch (trait.kind) {
    case "cat":
      elems = document.querySelectorAll(
        items.map((i) => `#${i}:not(#${name}) .cathead`).join(",")
      );
      break;
    case "color":
      elems = document.querySelectorAll(
        items.map((i) => `.${i}:not(#${name}) .body`).join(",")
      );
      break;
    case "pattern":
      elems = document.querySelectorAll(
        items.map((i) => `:not(#${name}) .${i}`).join(",")
      );
      break;
    case "accessory":
      elems = document.querySelectorAll(
        items.map((i) => `.draggable:not(#${name}) .${i}`).join(",")
      );
      break;
    case "place":
      // NOTE highlights only if there is an item there
      elems = document.querySelectorAll(
        items.map((i) => `.draggable:not(#${name}) .${i}`).join(",")
      );
      break;
  }
      //console.error(elems)
  return [key as "likes" | "dislikes", elems ?? []];
}

function filterTraits(traits: CatTrait[], name: CatName) {
  const catList = Object.values(cats).filter((c) => c.name !== name);
  const names = new Set(catList.map((c) => c.name));
  const colors = new Set(catList.map((c) => c.color));
  const patterns = new Set(catList.flatMap((c) => c.patterns));
  const accessories = new Set(
    catList.flatMap((c) => c.accessories.map(([a]) => a))
  );
  const places = new Set(
    catList.flatMap((c) => c.accessories.map(([_, p]) => p))
  );
  return traits
    .map((trait) => {
      const [key, items] =
        "likes" in trait
          ? ["likes", trait.likes]
          : ["dislikes", trait.dislikes];
      const filtered = items.filter((item) => {
        switch (trait.kind) {
          case "cat":
            return names.has(item as CatName);
          case "color":
            return colors.has(item as CatColor);
          case "pattern":
            return patterns.has(item as CatPattern);
          case "accessory":
            return accessories.has(item as Accessory);
          case "place":
            return places.has(item as AccessoryPlace);
        }
      });
      return filtered.length > 0 ? { kind: trait.kind, [key]: filtered } : null;
    })
    .filter((t): t is CatTrait => t !== null);
}

function markTraits(name: CatName) {
  const catTraits = filterTraits(cats[name].traits, name);
  //console.warn(catTraits);
  // NOTE name(3) > color(2) = pattern(2) and accessory(1) > place(1)
  // TODO name overrides color and pattern
  // TODO dislike/like nullify if color and pattern does not aggree
  // TODO accessory overrides place
  catTraits.forEach((trait) => {
    const [key, elems] = getElemsByTrait(trait, name);
    if (elems) markElements([...elems], key);
  });
  updateCatInfo(name, catTraits);
}

function calcScore(
  name: CatName,
  elemPair: [CatName, ReturnType<typeof getRelativeElements>[number]][]
): number {
  //console.warn(name, elemPair);
  //const catTraits = cats[name].traits;
  let totalScore = 0;
  const index = indices[name];
  elemPair.forEach(([catName, { dist_sq }]) => {
    if (name === catName) return 0; // itself
    const distNormal =
      Math.max(0, NEAR_LIMIT_SQUARED - dist_sq) / NEAR_LIMIT_SQUARED;
    const score = distNormal * contributions[index][indices[catName]];
    //document.querySelector(`#${name} .contrib`)!.textContent = score.toFixed(2);
    totalScore += score;
  });
  /*catTraits.forEach((trait) => {
    const [key, elems] = getElemsByTrait(trait, name);
    if (elems) {
      const score =
        [...elems]
          .map((el) => {
            let draggable = el!.parentNode!.parentNode! as SVGGraphicsElement;
            if (!draggable.classList.contains("draggable"))
              draggable = draggable!.parentNode! as SVGGraphicsElement;
            const catName = draggable.id as CatName;
            if (name === catName) return 0; // itself
            return (
              Math.max(0, NEAR_LIMIT - elemMap.get(catName)!.dist) / NEAR_LIMIT
            );
          })
          .reduce((a, b) => a + b, 0) *
        Score[trait.kind] *
        (key === "likes" ? 1 : -1);
      setContribution(name, score);
      totalScore += score;
    }
  });*/
  return totalScore;
}

// TODO make a function setScores - set scores for all cats on a foreground debug view (since no z-index for svgs)
// one line for contribution to selectedCat, other for cats' total score
function makeSmile(element: SVGGraphicsElement, score: number) {
  //(element.querySelector(".score") as SVGTextElement | null)!.textContent =
  //  score.toFixed(2);
  const index = MoodLevels.findIndex((level) => level > score);
  (element.querySelector(".face") as SVGUseElement | null)?.setAttribute(
    "xlink:href",
    `#${Moods.at(index)}`
  );
}

function setSmile(element: SVGGraphicsElement) {
  const row = element.parentNode! as SVGGElement;
  const rowIndex = parseInt(row.dataset.index!);
  //console.warn(row, rowIndex, element);
  const elements = getRelativeElements(element, rowIndex);
  const elementPair: [
    CatName,
    ReturnType<typeof getRelativeElements>[number]
  ][] = elements.map((e) => [e.el.id as CatName, e]);
  const name = element.id as CatName;
  const score = calcScore(name, elementPair);
  element.dataset.score = String(score);
  makeSmile(element, score);
}

function objectiveText(obj: Objective) {
  let text = "";
  if (obj.value === "fallback") text = "any other cat";
  else if (obj.value === blackCat) text = "the <i>black cats</i>";
  else {
    type Key = keyof TypeMap;
    const kinds: { [K in Key]?: TypeMap[K][] } = {};
    obj.value.forEach(([key, value]) => {
      type Key = keyof TypeMap;
      if (kinds[key as Key]) (kinds[key as Key] as any[]).push(value);
      else kinds[key as Key] = [value as any];
    });
    const cat = kinds.cat ? `the <i>${kinds.cat.join("/")}</i>` : "";
    const color = kinds.color ? `<i>${kinds.color.join("/")}</i> colored` : "";
    const pattern = kinds.pattern
      ? `<i>${kinds.pattern.join("/")}</i> patterned`
      : "";
    const accessory = kinds.accessory
      ? `with <i>${kinds.accessory.join("/")}</i>`
      : "";
    const place = kinds.place
      ? `with accessories on the <i>${kinds.place.join("/")}</i>`
      : "";
    text =
      "cats " +
      [cat, color, pattern, accessory, place]
        .filter((s) => s !== "")
        .join(", ");
  }
  const compText = {
    EQ: "exactly",
    LT: "less than",
    GT: "more than",
    LE: "at most",
    GE: "at least",
  } as { [K in ComparatorKey]: string };
  //console.error(`${text} are <u>${compText[obj.comp]}</u> <b>${obj.mood}</b>`);
  return `<li>${text} are <u>${compText[obj.comp]}</u> <b>${obj.mood}</b></li>`;
}

function checkObjectives() {
  const levelDef = levelDefs[levelState.level];
  if (!levelDef.objectives || levelDef.objectives.length === 0) {
    toggleNoPhoto();
    return;
  }
  const objectives = levelDef.objectives;
  const catList = Object.values(cats);

  let allreadyMatched = catList.map(() => false);
  let objectivesMet = true;
  objectives?.map((obj, i) => {
    let matches = objectiveMatches(obj, catList)
    if (obj.value === "fallback") {
      matches = matches.map(
        (m, j) => m && !allreadyMatched[j]
      );
    }
    allreadyMatched = allreadyMatched.map(
      (m, j) => m || (matches[j] && !allreadyMatched[j])
    );
    const check = catList
      .filter((_, i) => matches[i])
      .every((cat) => {
        const href = document
          .querySelector(`#${cat.name} .face`)!
          .getAttribute("xlink:href")!;
        return Comparators[obj.comp](href.slice(1) as Mood, obj.mood);
      });
    (
      document.querySelectorAll("#objectives li")[i] as HTMLLIElement
    ).classList.toggle("check", check);
    objectivesMet = objectivesMet && check;
  });
  levelState.objectivesMet = objectivesMet;
  toggleNoPhoto();
}

function toggleNoPhoto() {
  const { level, done, /*state,*/ objectivesMet } = levelState;
  let no = !(done || objectivesMet);
  const hasDoneCond = "doneFn" in levelDefs[level];
  if (hasDoneCond) no ||= !done;
  document.getElementById("photo")?.classList.toggle("no", no);
}

function updateInfo(/*state: LevelState*/ txt: string, done: boolean = false) {
  //levelState.state = state;
  //const { level } = levelState;
  //const txt = levelDefs[level].text?.[state]
  levelState.done = done;
  document.getElementById("info")!.innerHTML = txt ? `<h3 style="text-align:center">Tutorial</h3><ul>${txt}</ul>` : "";
  toggleNoPhoto();
}

function updateCatInfo(name: CatName, traits: CatTrait[]) {
  const info = traits
    .map((trait) => {
      const score = Score[trait.kind];
      const [word, items] =
        "likes" in trait
          ? [`${score}⨯ <span class="like">👍</span> ${trait.kind}`, trait.likes] // 👍🏽 
          : [`${score}⨯ <span class="dislike">👎</span> ${trait.kind}`, trait.dislikes]; //👎 
      return items.length === 0
        ? null
        : `<tr><td>${items.join(", ")}</td><td>${word}</td></tr>`;
    })
    .filter((item) => item !== null)
    .join("");
  document.querySelector("#catInfo")!.innerHTML = `<h3>Cat: ${name}</h3>
    <table>${info}</table>`;
  //console.warn(info);
}

/*function updateInfo(name: CatName, traits: CatTrait[]) {
  const info = traits.map((trait) => {
    const [word, items] =
      "likes" in trait ? ["👍🏽", trait.likes] : ["👎", trait.dislikes];
    return items.length === 0
      ? null
      : `-${word} ${trait.kind}s: ${items.join(", ")}`;
  });
  document.querySelector("#info")!.innerHTML =
    `${name}: ` +
    info
      .filter((item) => item !== null)
      .map((t) => `<tspan x="10" dy="20"}">${t}</tspan>`)
      .join("");
}*/

function putElementInRow(
  element: SVGGeometryElement,
  row: SVGGElement,
  x: number,
  resolve = true
) {
  const { height, y } = element.getBBox();
  const h = height + y;
  const rowY = parseFloat(row.querySelector(".row-line")!.getAttribute("y1")!);
  element.setAttribute("transform", `translate(${x}, ${rowY - h})`);

  if (resolve) resolveCollisions(element, row);
  row.appendChild(element); // update z order
  putSound.play();
  levelState.cats[element.id as CatName] = { row: parseInt(row.dataset.index!), x };
}

function getRowAt(i: number) {
  return document.querySelector(`.row[data-index="${i}"]`) as SVGGElement;
}

function getRows() {
  return [...document.querySelectorAll(".row")] as SVGGElement[];
}

function getRowElements(row: Element | undefined) {
  return [
    ...(row?.querySelectorAll(`.draggable`) ?? []),
  ] as SVGGraphicsElement[];
}

function calcDistance(
  el: SVGGraphicsElement,
  bbox: DOMRect,
  transform: DOMMatrix
) {
  const { height, y, width, x } = el.getBBox();
  const aTransform = el.transform.baseVal.getItem(0).matrix;

  const aLeft = aTransform.e;
  const aRight = aTransform.e + width + x;
  const bLeft = transform.e;
  const bRight = transform.e + bbox.width + bbox.x;

  const dx = Math.max(0, aLeft >= bLeft ? aLeft - bRight : bLeft - aRight);
  const dy = Math.abs(
    aTransform.f + height + y - (transform.f + bbox.height + bbox.y)
  );

  const xSpatial =
    dx > 0
      ? Spatial.Disjoint
      : (aLeft >= bLeft && aRight <= bRight) ||
        (aLeft <= bLeft && aRight >= bRight)
        ? Spatial.Contained
        : Spatial.Overlapping;

  return { dx, dy, xSpatial };
}

function getRelativeElements(element: SVGGraphicsElement, rowIndex: number) {
  //console.warn(element, rowIndex);
  const { height, y, width, x } = element.getBBox();
  const transform = element.transform.baseVal.getItem(0).matrix;
  const rows = getRows();

  return Array.from(rows).flatMap((row) => {
    const index = parseInt(row.dataset.index!);
    const dRow = rowIndex - index;
    return getRowElements(row)
      .filter((el) => el !== element)
      .map((el) => {
        let { dx, dy, xSpatial } = calcDistance(
          el,
          { width, height, x, y } as DOMRect,
          transform
        );
        //if (xSpatial === Spatial.Contained && dRow <= 1) dy = 0;
        return {
          el,
          dRow,
          dx,
          dy,
          xSpatial,
          dist_sq: dx * dx + dy * dy,
        };
      });
  });
}

function markElements(elements: SVGGraphicsElement[], mark: string) {
  elements.forEach((el) => el?.classList.add(mark));
}

function unmarkElements(mark: string) {
  document
    .querySelectorAll("." + mark)
    .forEach((el) => el?.classList.remove(mark));
}

function markAll(element: SVGGraphicsElement, rowIndex: number) {
  const elements = getRelativeElements(element, rowIndex);
  const far = elements
    .filter(({ dist_sq }) => dist_sq > NEAR_LIMIT_SQUARED)
    .map(({ el }) => el);
  markElements([element], "selected");
  markElements(far, "far");
  const name = element.id as CatName;
  markTraits(name);
  checkObjectives();
  //console.error(element.dataset.score);
}

function unmarkAll() {
  unmarkElements("selected");
  unmarkElements("far");
  unmarkElements("likes");
  unmarkElements("dislikes");
}

const resolveCollisions = (intruder: SVGGraphicsElement, row: SVGGElement) => {
  const elements = getRowElements(row);
  const spacing = -3;
  const transform = intruder.transform.baseVal.getItem(0).matrix;
  const left = transform.e;
  const { width, x } = intruder.getBBox();
  const right = left + x + width;
  const midX = left + (x + width) / 2;

  // TODO use body dimensions
  // Push right elements
  elements
    .filter((el: any) => {
      const { width, x } = el.getBBox();
      return (
        el !== intruder &&
        el.transform.baseVal.getItem(0).matrix.e + (width + x) / 2 >= midX
      );
    })
    .sort(
      (a: any, b: any) =>
        a.transform.baseVal.getItem(0).matrix.e -
        b.transform.baseVal.getItem(0).matrix.e
    )
    .reduce((anchor: number, el: any) => {
      const { width, x } = el.getBBox();
      const t = el.transform.baseVal.getItem(0).matrix;
      if (t.e < anchor) {
        el.setAttribute("transform", `translate(${anchor}, ${t.f})`);
        return anchor + width + x + spacing;
      }
      return t.e + width + x + spacing;
    }, right + spacing);

  // Push left elements
  elements
    .filter((el: any) => {
      const { width, x } = el.getBBox();
      return (
        el !== intruder &&
        el.transform.baseVal.getItem(0).matrix.e + (width + x) / 2 < midX
      );
    })
    .sort(
      (a: any, b: any) =>
        b.transform.baseVal.getItem(0).matrix.e -
        a.transform.baseVal.getItem(0).matrix.e
    )
    .reduce((anchor: number, el: any) => {
      const t = el.transform.baseVal.getItem(0).matrix;
      const { width, x } = el.getBBox();
      const w = width + x;
      if (t.e + w > anchor) {
        el.setAttribute("transform", `translate(${anchor - w}, ${t.f})`);
        return anchor - w - spacing;
      }
      return t.e - spacing;
    }, left - spacing);
};

function setDragEvents() {
  const svg = document.querySelector<SVGSVGElement>("#game")!;
  const rows = getRows();
  const draggableElements = document.querySelectorAll(
    ".draggable"
  ) as NodeListOf<SVGGeometryElement>;

  let selectedElement: SVGGeometryElement | null = null;
  let oldRow: SVGGElement;
  let oldPos = { x: 0, y: 0 };
  let offset = { x: 0, y: 0 };

  const getMousePosition = (evt: PointerEvent) => {
    const ctm = svg.getScreenCTM()!;
    return {
      x: (evt.clientX - ctm.e) / ctm.a,
      y: (evt.clientY - ctm.f) / ctm.d,
    };
  };

  const startDrag = (evt: PointerEvent) => {
    evt.stopPropagation();
    evt.preventDefault();
    selectedElement = evt.currentTarget as SVGGeometryElement;
    selectedElement.setPointerCapture(evt.pointerId);
    oldRow = selectedElement.parentNode! as SVGGElement;
    const rowIndex = parseInt(oldRow.dataset.index!);
    //if (levelState.state !== "done") updateInfo("dragging");

    unmarkAll();
    markAll(selectedElement, rowIndex);

    // Bring element to the very top while dragging
    svg.appendChild(selectedElement);

    const mousePos = getMousePosition(evt);
    const transform = selectedElement.transform.baseVal.getItem(0).matrix;
    oldPos = { x: transform.e, y: transform.f };
    offset = { x: mousePos.x - transform.e, y: mousePos.y - transform.f };
  };

  const drag = (evt: PointerEvent) => {
    if (!selectedElement) return;

    evt.preventDefault();
    const mousePos = getMousePosition(evt);
    selectedElement.setAttribute(
      "transform",
      `translate(${mousePos.x - offset.x}, ${mousePos.y - offset.y})`
    );
  };

  const endDrag = (evt: PointerEvent) => {
    if (!selectedElement) return;
    selectedElement.releasePointerCapture(evt.pointerId);
    //if (levelState.state !== "done") updateInfo("base");

    const mousePos = getMousePosition(evt);
    const { f } = selectedElement.transform.baseVal.getItem(0).matrix;
    const { height, y } = selectedElement.getBBox();
    let activeRow = null;

    // Find active row
    for (const row of rows) {
      const rowLine = row.querySelector(".row-line");
      const rowY = parseFloat(rowLine!.getAttribute("y1")!);
      const elY = f + height + y;
      if (elY > rowY - ROW_HEIGHT && elY <= rowY + STEP_OFFSET) {
        activeRow = row;
        break;
      }
    }

    let x = mousePos.x - offset.x;
    let resolve = true;
    if (!activeRow) {
      // revert
      activeRow = oldRow;
      x = oldPos.x;
      resolve = false;
    }

    putElementInRow(selectedElement, activeRow, x, resolve);
    const rowIndex = parseInt(activeRow.dataset.index!);
    draggableElements.forEach(setSmile);
    unmarkAll();
    markAll(selectedElement, rowIndex);
    selectedElement = null;
    //console.error("endDrag")
  };

  const clear = (_: PointerEvent) => {
    selectedElement = null;
    unmarkAll();
    document.querySelector("#catInfo")!.innerHTML = "";
  };

  const removeEvents = () => {
    draggableElements.forEach((el) => {
      el.removeEventListener("pointerdown", startDrag as any);
    });
    svg.removeEventListener("pointerdown", clear);
    svg.removeEventListener("pointermove", drag);
    svg.removeEventListener("pointerup", endDrag);
    svg.removeEventListener("pointerleave", endDrag);
  };

  // Setup draggable elements
  draggableElements.forEach((el) => {
    el.addEventListener("pointerdown", startDrag as any);
  });

  svg.addEventListener("pointerdown", clear);
  // Global listeners
  svg.addEventListener("pointermove", drag);
  svg.addEventListener("pointerup", endDrag, true); // NOTE: should be before doneFn to mark things
  svg.addEventListener("pointerleave", endDrag);

  return removeEvents;
}
