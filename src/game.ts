import {
  choose,
  popRandom,
  rand,
  randb,
  randf,
  randomItem,
  randomTrait,
} from "./utils";
import { CAT_COLORS, type CatColor, type CatPattern } from "./colors";
import {
  ACCESSORIES,
  type Accessory,
  type AccessoryPlace,
} from "./accessories";
import { type CatName, CAT_NAMES } from "./names";
import { MoodLevels, Moods, Score, type CatTrait } from "./traits";

const WIDTH = 640;
const HEIGHT = 800;
const ROW_HEIGHT = 60;
const ROW_PROXIMITY_MULTIPLIER = 2;
const STEP_OFFSET = 10;
const BOTTOM_BAR = 80;
const ROW_MIN = HEIGHT - (BOTTOM_BAR + 30);
const NEAR_LIMIT = 200;

type Cat = {
  name: CatName;
  color: CatColor;
  patterns: CatPattern[];
  accessories: [Accessory, AccessoryPlace][];
  xScale: number;
  yScale: number;
};

const Spatial = {
  Disjoint: 0,
  Overlapping: 1,
  Contained: 2,
} as const;

const cats = {} as Record<CatName, Cat>;
const traits = {} as Record<CatName, CatTrait[]>;
let catNames = {} as Record<CatColor, CatName[]>;

export function returnToMenu(app: HTMLDivElement) {
  console.debug("Returning to menu");

  app.innerHTML = `
    <div class="card">
      <!--<h1>Snap Cat !</h1>
      <h1>📸 😺</h1>-->
    </div>
    <div>
      <button id="game" type="button">Start Game</button>
    </div>
`;
  document
    .querySelector<HTMLButtonElement>("#game")!
    .addEventListener("click", () => startGame(app));
  startGame(app);
}

function takePhoto() {
  document.getElementById("info")!.style.display = "none";
  const flash = document.getElementById("flash")!;
  flash.classList.add("fire");
  flash.onanimationend = () => {
    document.getElementById("gameArea")?.classList.add("sepia");
    flash.style.animation = "";
  };
}

function startGame(app: HTMLDivElement) {
  console.log("Game started");
  initLevel(app);
}

function initLevel(app: HTMLDivElement) {
  const catCount = 9;
  catNames = Object.assign({} as typeof catNames, CAT_NAMES);

  const rowCount = 5;
  const rows = Array.from({ length: rowCount }, (_, i) =>
    createRow(rowCount - i - 1)
  ).join("");

  const catPatterns: CatPattern[] = ["tuxedo", "tabby"];
  const colors = Object.keys(CAT_COLORS) as (keyof typeof CAT_COLORS)[];
  for (let i = 0; i < catCount; i++) {
    const xScale = randf(0.7, 1.3);
    const yScale = randf(0.7, 1.3);
    const color = choose(colors);

    // TODO handle no name remained
    const name = popRandom(catNames[color]);
    if (!name) throw new Error("No name remained");
    const patterns = catPatterns.filter(() => randb());
    const accessories = Object.entries(ACCESSORIES)
      .map(([place, items]) => [randomItem(items), place])
      .filter(([item, _place]) => item !== null) as [
      Accessory,
      AccessoryPlace
    ][];

    const cat = { name, color, patterns, accessories, xScale, yScale };
    cats[name] = cat;
  }
  ensureABlackCat();
  console.warn(cats);

  const catsHtml = Object.values(cats)
    .map((cat) => createCat(cat))
    .join("");

  const faceDefs = `
    <g id="miserable" stroke-width="2" >
      <use xlink:href="#eye1" stroke-width="2"  transform="matrix(-.997 0 0 .992 99 .3)"/>
      <path id="eye1" fill="none" stroke-width="3" d="m65 36.6 8.5 4.9"  />
      <path fill="none" stroke-linejoin="miter" stroke-width="2" d="M57.6 59.4c.3-3.4-1.2-6.3-7.4-7.8l-.4-7 .4 7c-7.2 1-7 7.8-7 7.8" />
    </g>
    <g id="downcast" stroke-width="2" >
      <use xlink:href="#eye2" stroke-width="2"  transform="matrix(-.997 0 0 .992 99 .3)"/>
      <path id="eye2" fill="none" stroke-width="5" d="M67.7 38.4h.4"  />
      <path fill="none" stroke-linejoin="miter" stroke-width="2" d="M49.8 45.3v11.2" />
    </g>
    <g id="content" stroke-width="2" >
      <use xlink:href="#eye3" transform="matrix(-.997 0 0 .992 99.9 .3)"/>
      <path id="eye3" fill="none" d="M75.7 34.3c-.6 3.6-10.3 2.7-10.8-1"  />
      <path fill="none" d="m49.8 45 .5 11.8s-1 .8-1 1.3.7 1.1 1.1 1.1c.5 0 1-.6 1-1.1 0-.5-1.1-1.3-1.1-1.3"  paint-order="fill markers stroke"/>
    </g>
    <g id="pleased" stroke-width="2" >
      <use xlink:href="#eye4" transform="matrix(-.997 0 0 .992 99 .3)"/>
      <path id="eye4" fill="none" d="M65.4 37.4c-1.4-4.4 6.5-6.8 8-.6"  />
      <path fill="none" stroke-linejoin="miter" d="M62.7 52.9c-1 3.7-13.2 7.8-13-1.3V45v6.8c-.3 9.1-11.9 6.3-13 1" />
    </g>
    <g id="cheerful" stroke-width="2" >
      <use xlink:href="#eye5" transform="matrix(-.997 0 0 .992 100.3 .3)"/>
      <path id="eye5" fill="none" d="M76.6 36.8c-19 .7-16 .3-1.4-5"  />
      <path fill="#ff8080" stroke-linejoin="miter" d="M60.2 49.3C50.5 59.8 49.8 45 49.8 45s0 15.3-10.4 4c0 0-.6 12 10.2 12 10.8-.1 10.6-11.7 10.6-11.7Z" />
    </g>
  `;
  const accessoryDefs = `
    <path id="glasses" fill="#1a1a1a" stroke="#eee" stroke-width=".5" d="M28.2 24.3c-5 .1-10 .4-14.7 1.8-3.2 3 1.7 6 2 9 1.1 4.7 2 10.4 6.5 13 4.4 2.3 9.6 2 14.2 1.2 5.3-1.3 8.9-6 10.4-11 .1-3.7 5-5.2 6.3-1.3 1 3 1.8 6 4.1 8.3 2.8 3.2 7 4.6 11.1 4.6 5 .3 10.9-1 13.4-5.7 2-3.5 2.4-7.7 3.4-11.6 3-1.2 3.8-6.8-.3-6.9a61.4 61.4 0 0 0-31.4 1.6c-6.1 1.3-12-1.8-18-2.4-2.3-.4-4.7-.6-7-.6Zm41.5 3c3.7.2 8 .1 11 2.7 2.1 3.4.8 7.7 0 11.3a9 9 0 0 1-8.1 6.4c-5.5 1-12-.1-15.2-5.2A14 14 0 0 1 54.7 32c1.5-3.5 5.7-4 9-4.4 2-.3 4-.4 6-.4zm-39.5 0c4.7.3 10 .2 14 3.1 2.4 3.2.6 7.4-1 10.6-2 3.9-6 7-10.5 6.8-4.5.5-10.2 0-12.6-4.5a15.3 15.3 0 0 1-1.3-12.6c2.6-3.5 7.6-3 11.4-3.4z" />
    <path id="sunglasses" fill="#3f0a00ff" fill-opacity=".9" stroke="#eee" stroke-width=".5" d="M28.2 24.3c-5 .1-10 .4-14.7 1.8-3.2 3 1.7 6 2 9 1.1 4.7 2 10.4 6.5 13 4.4 2.3 9.6 2 14.2 1.2 5.3-1.3 8.9-6 10.4-11 .1-3.7 5-5.2 6.3-1.3 1 3 1.8 6 4.1 8.3 2.8 3.2 7 4.6 11.1 4.6 5 .3 10.9-1 13.4-5.7 2-3.5 2.4-7.7 3.4-11.6 3-1.2 3.8-6.8-.3-6.9a61.4 61.4 0 0 0-31.4 1.6c-6.1 1.3-12-1.8-18-2.4-2.3-.4-4.7-.6-7-.6Z" />
    <path id="cap" fill="rgba(248, 67, 43, 1)" stroke="#231f20" stroke-miterlimit="10" stroke-width=".8" d="m27 12.6 22.2-.2-.3-20.3.3 20.4h21.7M48.2-8.3C30.7-8.4 26.1 1 26.1 12.8l1.2-.3s-3.7 5.6-2.6 7.8c2.6 5.5 12.6-1.3 24.7-1.3 12 0 21.5 6.8 24.1 1.3 1-2.2-2.6-7.7-2.6-7.8l1.2.3C72.1 2 65.1-8 49.4-8.4c-.7 0 5-1.2-.4-1.2-6.5 0 .2 1.2-.8 1.2z" />
    <path id="beanie" fill="rgba(2, 185, 73, 1)" stroke="#231f20" stroke-miterlimit="10" stroke-width=".8" d="m42.9-12.3-.1-1a6.6 6.6 0 1 1 13 1M73 9.7l-5.2 11.9m0-12-5.3 12m0-12-5.2 12m0-12-5.2 12m0-12-5.3 12m0-12-5.2 12m0-12-5.3 12m0-12-5.2 12m0-12-5.2 12m47.1 0H25.8v-12h47.1Zm-44.1-12V7.2a20.6 20.6 0 0 1 41.2 0v2.4" />
    <g id="hat" stroke="#231f20" stroke-miterlimit="10" stroke-width=".8" >
      <path id="path8" fill="#deaa87" d="M49.5-12.5a20 20 0 0 0-9.6 2.3C33.9-6.9 29.4 0 29.4 11.3c-5-1.5-8-2.6-8.4-.4-1 4.3 11.6 9.2 28.5 9.2 17 0 29.6-4.9 28.6-9.2-.5-2.2-3.4-1.1-8.4.4 0-17-9.9-23.8-20.2-23.8Z"/>
      <path id="path9-4" fill="#000" fill-opacity=".6" d="M69.8 11.4A47.8 47.8 0 0 1 50 14a52 52 0 0 1-20.6-2.7l.4-5.2a47.8 47.8 0 0 0 19.8 2.7c8.2 0 16-.6 19.8-2.7z"/>
    </g>
    <path id="band" fill="rgba(49, 144, 253, 1)" stroke="#231f20" stroke-miterlimit="10" stroke-width="1.1" d="M90.3 28c-7.8 2.3-23.4 2.8-40.1 2.8-16.8 0-34-.5-41.7-2.7l.7-5.2c7.7 2.2 23.4 2.7 40.1 2.7 16.7 0 32.3-.5 40-2.7z" />
    <path id="tie" fill="url(#strips)" stroke="#999" stroke-linecap="butt" stroke-linejoin="miter" stroke-width="1" d="M47.9 70.4 54 70l4.6 45.6-9 9.1L42 115z" />
    <path id="bowtie" fill="rgba(204, 0, 0, 1)" stroke="#000" stroke-linecap="butt" stroke-linejoin="miter" stroke-width="1" d="m50.7 70.7-.4 6.2 3.6-.3 11 4.9-.2-16.3-10.8 6 .2 5.6-.2-5.5-3.2-.2L39 64.6l-1 16.8L50.4 77" />
    <g id="scarf" fill="url(#wave)" transform="translate(.6 8.7)">
      <path d="M83.5 97c-14.8.7-30-3.2-44.5 1.2-4 1.5-7-8.6-6-5.9L28.8 81c1-4.2 21.3-2.1 12-2.5 9 .7 18.2-.2 27.3-1.1 5.4-.4 10.9-.7 16.2 0 5.4 3.7 7.4 16.5 6.2 12 .7 3 1.3 8.3-3.5 7.5a62 62 0 0 1-3.4.3z" transform="rotate(90 58 90)"/>
      <path d="M93 49.3a49.9 49.9 0 0 1-16.8 14.5 61 61 0 0 1-40.6 5A70.5 70.5 0 0 1 6.6 51c-4.8-4.5-3.8-10-1.4-12.5.2-4 1.6-8 5.9-5 6.8 3.4 13.3 8.2 21 13.6 14.3 9.8 22.8 6.5 37.6-1.8 4.8-2.2 10.4-8 14.6-10.9 4.8-2.8 8.3-2.3 8.3 3.3-.2 3.9 2.1 8.1.4 11.6z"/>
    </g>
    <path id="cane" transform="translate(-55 0)" fill="#803300" d="M100.2 81.6c1.5.2 3 1 4.2 2 1.5 1.2 2.5 2.8 3.2 4.7.5 1.2.7 2.2 1 3.5v54.8c-.2 1.2-.9 2.2-1.8 2.6l-.7.1c-.6 0-.8 0-1.2-.3a3.4 3.4 0 0 1-1.4-2.1V92.6l-.2-.3c-.2-1-.5-1.7-1-2.4a4 4 0 0 0-1.4-1.2c-.8-.5-1.8-.6-2.7-.2a4.8 4.8 0 0 0-2.8 3.3 8 8 0 0 0-.2 1.8 4 4 0 0 1-.3 1.6c-.6 1.1-1.3 1.7-2.3 1.7-1 0-1.9-.7-2.3-1.9a13.1 13.1 0 0 1 1.7-8.7c.3-.6 1.3-1.8 1.7-2.3a9 9 0 0 1 4.3-2.3h2.2z"/>
    <g id="umbrella" transform="scale(0.7 1)translate(30 -5)rotate(30.4 57.4 -17.7)">
      <path id="path1-7" fill="#333" stroke-width=".8" d="m48.1 2.8 23.5 38.7 23.5 38.8v.6c1.6 3.3 2.9 6.7.1 8.1-2.7 1.5-5.1-.6-6.7-1-5.5-3.2-2.9 3.2 3.5 5.1 2.9-.2 5.3.4 7.3-2.5 1.9-2.8 2.4-5.6 1.5-8.3A39685 39685 0 0 0 51.6 1.1" display="inline"/>
      <path id="path1-1" fill="navy" stroke-width="1" d="M18.5-44.4c-1.3.7-2 3-2 3l-3.1 2A73.3 73.3 0 0 0-14.5-7.5a64 64 0 0 0-3 10 59.1 59.1 0 0 0 10 43.7l.5.8.9-1.7A51.3 51.3 0 0 1 5.2 31.6a29.4 29.4 0 0 1 27.1-5l.3-1.1c.6-3.4 3-7.9 6.1-11.4A54.3 54.3 0 0 1 55.3 2.2c8-3.6 15.1-5.1 21.3-4.5l1.7.1.2-.8c1.1-6 3.4-10.7 7-14.7a36.1 36.1 0 0 1 16.8-9.6c2.4-.7 6.7-1.3 9.2-1.4l2.1-.1-1.4-2c-13.4-19.3-29.9-28.4-50-27.7a81.3 81.3 0 0 0-38.5 12.7l-2 1.2s-2-.6-3.2.2z"/>
    </g>
    <path id="bag" transform="translate(-55 0)" fill="#f4eed7" d="M82.4 100.6S80 85.9 94 86c13.8.2 11.5 14 11.5 14l-3.7-.2s1.4-11.5-8-11.5c-9.6 0-8.7 12.4-8.7 12.4s25.3-2.3 28.7 1.6c3.3 4 5.3 21.4 2.5 24.8-2.9 3.4-41.3 2.4-44.6-.2-3.4-2.7 0-21.9 2.6-24.8 2.7-3 8-1.6 8-1.6z"/>
    <path id="balloon" transform="translate(-55 0)" fill="#fd5" d="M95.3-55.6a20 20 0 0 0-5.4 2 22.3 22.3 0 0 0-11.3 17.1 29 29 0 0 0 3 15.1 71.1 71.1 0 0 0 10.2 15 16.3 16.3 0 0 0 5.4 4c.2.2-.2.9-1.3 2.5-.7 1.2-.7 1.3-.2 1.3l.5.1 1.6.4c.4 0 .4 0 .3.3-.1.4-.2 88.7 0 89 0 .4.3.6.4.3l.2-28.9.1-60.3 1 .2 1 .2.3-.4c.2-.3.7-.6 1.1-.8.5-.2.8-.4.8-.6 0 0-.2-.5-.7-1-1-1.2-1.5-2-1.5-2.3a24.4 24.4 0 0 0 8.4-8 76 76 0 0 0 6.5-10.4 25 25 0 0 0 3.4-12.4 23.4 23.4 0 0 0-3.7-13.6c-3.1-4.6-8.1-8-13.2-8.8a39 39 0 0 0-6.9 0z" />
  `;
  app.innerHTML = `
  <svg id="game" height="100%" viewBox="0 0 ${WIDTH} ${HEIGHT}" >
  <defs>
    <filter id="turbulence">
      <feTurbulence type="turbulence" baseFrequency="0.015 0.1" numOctaves="1" seed="2" result="NOISE"></feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="NOISE" scale="10">
      </feDisplacementMap>
    </filter>
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
    ${faceDefs}
    ${accessoryDefs}
  </defs>
    <text x="10" y="15" id="info"></text>
    <g id="gameArea">
    ${rows}
    ${catsHtml}
    </g>
    <rect id="flash" x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="#eff" opacity="0" />
    <rect y="${
      HEIGHT - BOTTOM_BAR
    }" width="${WIDTH}" height="${BOTTOM_BAR}" fill="#111" />
    <g transform="translate(${WIDTH / 2}, ${
    HEIGHT - BOTTOM_BAR / 2
  })" id="camera" style="cursor:pointer">
    <circle cx="0" cy="0" r="${BOTTOM_BAR / 2 - 5}" fill="#eee" />
    <text font-size="${
      BOTTOM_BAR / 2
    }" text-anchor="middle" dominant-baseline="central">📷</text>
    </g>
  </svg>
  `;

  document.getElementById("camera")!.onclick = takePhoto;
  setDragEvents();

  Object.keys(cats).forEach((name, index) => {
    traits[name as CatName] = generateTraits(
      Object.values(cats).filter((_, i) => i !== index)
    );
  });
  console.warn(traits);

  const draggables =
    document.querySelectorAll<SVGGeometryElement>(`.draggable`);
  draggables.forEach((cat) =>
    putElementInRow(cat, getRowAt(rand(0, rowCount - 1)), WIDTH / 2)
  );
  draggables.forEach((cat) => setSmile(cat));
}

function ensureABlackCat() {
  const blackCats = Object.values(cats).filter(
    (cat) => cat.color === "black" && !cat.patterns.includes("tuxedo")
  );
  if (blackCats.length === 0) {
    const name = Object.keys(cats)[0] as CatName;
    convertToBlack(name);
  }
}

function convertToBlack(name: CatName) {
  const cat = cats[name];
  cat.color = "black";
  cat.name = popRandom(catNames[cat.color])!;
  cat.patterns = [];
  delete cats[name];
  cats[cat.name] = cat;
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
    ...patterns,
  ].join(" ")}" id="${name}" style="--color:${CAT_COLORS[color]}">
  <g transform="scale(${xScale} ${yScale})">
    <use class="body" href="#body" fill="var(--color)" stroke="${stroke}" />
    ${
      tabby
        ? '<use href="#body" fill="url(#tabby)" stroke="none" style="mix-blend-mode:multiply"/>'
        : ""
    }
    ${
      tuxedo
        ? '<path fill="#fbfcfc" stroke="none" stroke-width="1" d="M5.4 93c-12.4 0 34.4 15.7 9.5 52.6 34.7 4 38.3 4.4 73.8-1.4-34.3-35.5 20-50.7 7.8-50.8-42.4-.4-35.9-58-47-73.3C37.8 38.3 53.1 93.4 5.4 93Z" />'
        : ""
    }
    <use class="face" xlink:href="#3" style="${
      black ? "stroke:#fff; mix-blend-mode:difference" : "stroke:" + stroke
    }"/>
    <path id="nose" fill="${stroke}" stroke="#999" stroke-linecap="butt" stroke-linejoin="miter" stroke-width="1" d="M44.8 40.9c0-1.3 9.7-1.4 9.8-.2 0 0-2.5 4.6-4.8 4.6-2.4 0-5-4.4-5-4.4Z"/>
    <path id="ear" fill="#faa" stroke="${stroke}" stroke-width="1" d="m86.3 10-11.2 7 9.5 5.7Z"/>
    <use xlink:href="#ear" id="earl" stroke-width="1" transform="matrix(-.997 0 0 .992 98 0)"/>
    <g class="accessories">
    ${accessories.map(
      ([item, place]) => `<use xlink:href="#${item}" class="${item} ${place}"/>`
    )}
    </g>
    <g id="hand${name}" fill="${
    tuxedo ? "#fbfcfc" : "var(--color)"
  }" stroke-width="1.5" transform="translate(-.4)rotate(90,77,87)">
      <path id="paw" stroke="${stroke}" d="M83.6 75.2c0-.4 1.7-7.4.2-10.4-.7-1.4-2.6-2.2-5.2-2.1h-.5c-2.5.1-5.3 1-6.2 2.6-1.5 2.8-.4 10-.4 10.4"/>
      <path id="finger" stroke="${stroke}" stroke-linejoin="miter" d="M79.8 63.1v2.6"/>
      <use xlink:href="#finger" id="finger2" transform="matrix(.988 0 0 .992 -3 .8)"/>
    </g>
    <use xlink:href="#hand${name}" id="handl" fill="#fff" stroke-width="1" transform="matrix(-.997 0 0 .992 99.6 .5)rotate(180,78,87)"/>
  </g>
  <g transform="translate(${xScale * 50 - 25} ${yScale * 150 - 50})">
    <rect width="50" height="50" fill="#eee9" />
    <text class="score" x="25" y="12" text-anchor="middle" dominant-baseline="central" fill="#000">0</text>
    <text class="contrib" x="25" y="38" text-anchor="middle" dominant-baseline="central" fill="#000">0</text>
  </g>
  </g>`;
}

function createRow(index: number) {
  const y = ROW_MIN - ROW_HEIGHT * index;
  const step = ROW_HEIGHT / 2 - 10;
  const x = 10 + index * 10;
  const y2 = y + step - STEP_OFFSET;
  return `<g class="row" data-index="${index}">
    <polygon points="${x},${y} ${WIDTH - x},${y} ${WIDTH - x + 10},${
    y + step
  } ${x - 10},${y + step}" fill="#e0e0e0"/>
    <rect x="${x - 10}" y="${y + step}" width="${WIDTH - 2 * x + 20}" height="${
    ROW_HEIGHT - step
  }" fill="#a0a0a0"/>
    <line class="row-line" x1="0" y1="${y2}" x2="${WIDTH}" y2="${y2}" />
  </g>`;
}

function generateTraits(cats: Cat[]): CatTrait[] {
  const names = cats.map((c) => c.name);
  const colors = [
    ...new Set(cats.map((c) => c.color).filter((c) => c !== "black")),
  ];
  const patterns = [...new Set(cats.flatMap((c) => c.patterns))];
  const accessories = [
    ...new Set(
      cats.flatMap((c) => c.accessories.map(([accessory, _]) => accessory))
    ),
  ];
  const places = [
    ...new Set(cats.flatMap((c) => c.accessories.map(([_, place]) => place))),
  ];

  const likeDislike = ["likes", "dislikes"] as const;
  const randomBlack = likeDislike[Number(randb())];
  const traits = likeDislike
    .flatMap((key) => [
      randomTrait("cat", key, names),
      (() => {
        const color = randomTrait("color", key, colors, 0.5, false);
        // every cat has an opinion for black cats - like or dislike
        const items = (color as any)[key];
        if (key === randomBlack) items.push("black");
        return items.length === 0 ? null : color;
      })(),
      randomTrait("pattern", key, patterns),
      randomTrait("accessory", key, accessories),
      randomTrait("place", key, places),
    ])
    .filter((trait) => trait !== null);
  console.warn(names, colors, patterns, accessories, places);
  return traits;
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
        items.map((i) => `#${i} .body`).join(",")
      );
      break;
    case "color":
      elems = document.querySelectorAll(
        items.map((i) => `.${i}:not(#${name}) .body`).join(",")
      );
      break;
    case "pattern":
      elems = document.querySelectorAll(
        items.map((i) => `.${i}:not(#${name}) .body`).join(",")
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
  return [key as "likes" | "dislikes", elems];
}

function markTraits(name: CatName) {
  const catTraits = traits[name];
  // NOTE name(3) > color(2) = pattern(2) and accessory(1) > place(1)
  // TODO name overrides color and pattern
  // TODO dislike/like nullify if color and pattern does not aggree
  // TODO accessory overrides place
  catTraits.forEach((trait) => {
    const [key, elems] = getElemsByTrait(trait, name);
    if (elems) markElements([...elems], key);
  });
  updateInfo(name, catTraits);
}

function calcScore(
  name: CatName,
  elemMap: Map<CatName, ReturnType<typeof getRelativeElements>[number]>
): number {
  const catTraits = traits[name];
  let totalScore = 0;
  catTraits.forEach((trait) => {
    const [key, elems] = getElemsByTrait(trait, name);
    if (elems) {
      const score =
        Score[trait.kind] *
        (key === "likes" ? 1 : -1) *
        [...elems]
          .map((el) => {
            let draggable = el!.parentNode!.parentNode! as SVGGraphicsElement;
            if (!draggable.classList.contains("draggable"))
              draggable = draggable!.parentNode! as SVGGraphicsElement;
            const catName = draggable.id as CatName;
            return (
              Math.max(0, NEAR_LIMIT - elemMap.get(catName)!.dist) / NEAR_LIMIT
            );
          })
          .reduce((a, b) => a + b, 0);
      setContribution(name, score);
      totalScore += score;
    }
  });
  return totalScore;
}

function setContribution(name: CatName, contrib: number) {
  document.querySelector(`#${name} .contrib`)!.textContent = contrib.toFixed(2);
}

// TODO make a function setScores - set scores for all cats on a foreground debug view (since no z-index for svgs)
// one line for contribution to selectedCat, other for cats' total score
function makeSmile(element: SVGGraphicsElement, score: number) {
  (element.querySelector(".score") as SVGTextElement | null)!.textContent =
    score.toFixed(2);
  const index = MoodLevels.findIndex((level) => level > score);
  (element.querySelector(".face") as SVGUseElement | null)?.setAttribute(
    "xlink:href",
    `#${Moods.at(index)}`
  );
}

function setSmile(element: SVGGraphicsElement) {
  const row = element.parentNode! as SVGGElement;
  const rowIndex = parseInt(row.dataset.index!);
  const elements = getRelativeElements(element, rowIndex);
  const elementMap = new Map(elements.map((e) => [e.el.id as CatName, e]));
  const name = element.id as CatName;
  const score = calcScore(name, elementMap);
  element.dataset.score = String(score);
  makeSmile(element, score);
}

function updateInfo(name: CatName, traits: CatTrait[]) {
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
}

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
  const { height, y, width, x } = element.getBBox();
  const transform = element.transform.baseVal.getItem(0).matrix;
  const rows = getRows();

  return Array.from(rows).flatMap((row) => {
    const index = parseInt(row.dataset.index!);
    const dRow = rowIndex - index;
    return getRowElements(row)
      .filter((el) => el !== element)
      .map((el) => {
        const { dx, dy, xSpatial } = calcDistance(
          el,
          { width, height, x, y } as DOMRect,
          transform
        );
        return {
          el,
          dRow,
          dx,
          dy,
          xSpatial,
          dist: Math.sqrt(dx * dx + dy * dy * ROW_PROXIMITY_MULTIPLIER),
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
    evt.preventDefault();
    selectedElement = evt.currentTarget as SVGGeometryElement;
    oldRow = selectedElement.parentNode! as SVGGElement;
    const rowIndex = parseInt(oldRow.dataset.index!);

    const elements = getRelativeElements(selectedElement, rowIndex);
    const far = elements
      .filter(({ dist }) => dist > NEAR_LIMIT)
      .map(({ el }) => el);
    markElements([selectedElement], "selected");
    markElements(far, "far");
    const name = selectedElement.id as CatName;
    markTraits(name);

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
    selectedElement = null;
    draggableElements.forEach(setSmile);

    unmarkElements("selected");
    unmarkElements("far");
    unmarkElements("likes");
    unmarkElements("dislikes");
  };

  // Setup draggable elements
  draggableElements.forEach((el) => {
    el.addEventListener("pointerdown", startDrag as any);
  });

  // Global listeners
  svg.addEventListener("pointermove", drag);
  svg.addEventListener("pointerup", endDrag);
  svg.addEventListener("pointerleave", endDrag);
}
