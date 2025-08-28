import { choose, rand, randb, randf, randomItem } from "./utils";
import { CAT_COLORS, type CatPattern } from "./colors";
import {
  ACCESSORIES,
  type Accessory,
  type AccessoryPlace,
} from "./accessories";

const WIDTH = 640;
const HEIGHT = 640;
const ROW_HEIGHT = 60;
const ROW_PROXIMITY_MULTIPLIER = 2;
const STEP_OFFSET = 10;
const ROW_MIN = HEIGHT - 100;

const Spatial = {
  Disjoint: 0,
  Overlapping: 1,
  Contained: 2,
} as const;

export function returnToMenu(app: HTMLDivElement) {
  console.debug("Returning to menu");

  app.innerHTML = `
    <div class="card">
      <h1>Snap Cat !</h1>
      <h1>📸 😺</h1>
    </div>
    <div>
      <button id="game" type="button">Start Game</button>
    </div>
`;
  document
    .querySelector<HTMLButtonElement>("#game")!
    .addEventListener("click", () => startGame(app));
}

function startGame(app: HTMLDivElement) {
  console.log("Game started");

  const rowCount = 5;
  const rows = Array.from({ length: rowCount }, (_, i) =>
    createRow(rowCount - i - 1)
  ).join("");

  const catCount = 9;
  let cats = "";
  const patterns: CatPattern[] = ["tuxedo", "tabby"];
  const colors = Object.keys(CAT_COLORS) as (keyof typeof CAT_COLORS)[];
  for (let i = 0; i < catCount; i++) {
    const width = randf(0.5, 1.3);
    const height = randf(0.5, 1.3);
    const color = choose(colors);
    const accessories = Object.entries(ACCESSORIES)
      .map(([place, items]) => [randomItem(items), place])
      .filter(([item, _place]) => item !== null) as [
      Accessory,
      AccessoryPlace
    ][];
    cats += createCat(
      i,
      width,
      height,
      color,
      patterns.filter(() => randb()),
      accessories
    );
  }

  const faceDefs = `
    <g id="1" stroke-width="2" >
      <use xlink:href="#eye1" stroke-width="2"  transform="matrix(-.997 0 0 .992 99 .3)"/>
      <path id="eye1" fill="none" stroke-width="3" d="m65 36.6 8.5 4.9"  />
      <path fill="none" stroke-linejoin="miter" stroke-width="2" d="M57.6 59.4c.3-3.4-1.2-6.3-7.4-7.8l-.4-7 .4 7c-7.2 1-7 7.8-7 7.8" />
    </g>
    <g id="2" stroke-width="2" >
      <use xlink:href="#eye2" stroke-width="2"  transform="matrix(-.997 0 0 .992 99 .3)"/>
      <path id="eye2" fill="none" stroke-width="5" d="M67.7 38.4h.4"  />
      <path fill="none" stroke-linejoin="miter" stroke-width="2" d="M49.8 45.3v11.2" />
    </g>
    <g id="3" stroke-width="2" >
      <use xlink:href="#eye3" transform="matrix(-.997 0 0 .992 99.9 .3)"/>
      <path id="eye3" fill="none" d="M75.7 34.3c-.6 3.6-10.3 2.7-10.8-1"  />
      <path fill="none" d="m49.8 45 .5 11.8s-1 .8-1 1.3.7 1.1 1.1 1.1c.5 0 1-.6 1-1.1 0-.5-1.1-1.3-1.1-1.3"  paint-order="fill markers stroke"/>
    </g>
    <g id="4" stroke-width="2" >
      <use xlink:href="#eye4" transform="matrix(-.997 0 0 .992 99 .3)"/>
      <path id="eye4" fill="none" d="M65.4 37.4c-1.4-4.4 6.5-6.8 8-.6"  />
      <path fill="none" stroke-linejoin="miter" d="M62.7 52.9c-1 3.7-13.2 7.8-13-1.3V45v6.8c-.3 9.1-11.9 6.3-13 1" />
    </g>
    <g id="5" stroke-width="2" >
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
  `;
  app.innerHTML = `
  <svg id="game" width="100%" height="100%" viewBox="0 0 ${WIDTH} ${HEIGHT}" >
  <defs>
    <pattern id="tabby" width="24" height="10" fill="#ccc" patternTransform="scale(3)" patternUnits="userSpaceOnUse">
        <path d="M12-2C9.2-2 7.2-.6 5.4.7 3.7 1.9 2.2 3 0 3v2c2.8 0 4.8-1.4 6.6-2.7C8.3 1.1 9.8 0 12 0s3.7 1 5.4 2.3C19.2 3.6 21.2 5 24 5V3c-2.2 0-3.7-1-5.4-2.3C16.8-.6 14.8-2 12-2Z"/>
        <path d="M12 3C9.2 3 7.2 4.4 5.4 5.7 3.7 6.9 2.2 8 0 8v2c2.8 0 4.8-1.4 6.6-2.7C8.3 6.1 9.8 5 12 5s3.7 1 5.4 2.3C19.2 8.6 21.2 10 24 10V8c-2.2 0-3.7-1-5.4-2.3C16.8 4.4 14.8 3 12 3Z"/>
        <path d="M12 8c-2.8 0-4.8 1.4-6.6 2.7C3.7 11.9 2.2 13 0 13v2c2.8 0 4.8-1.4 6.6-2.7C8.3 11.1 9.8 10 12 10s3.7 1 5.4 2.3c1.8 1.3 3.8 2.7 6.6 2.7v-2c-2.2 0-3.7-1-5.4-2.3C16.8 9.4 14.8 8 12 8Z"/>
    </pattern>
    <pattern id="strips" width="4" height="1" fill="rgba(199, 11, 11, 1)" patternTransform="rotate(45 -3.3 .6) scale(2)" patternUnits="userSpaceOnUse">
      <rect fill="rgba(0, 0, 167, 1)" width="100%" height="100%" />
      <path id="rect152" stroke="none" d="M0-.5h1v2H0z"/>
    </pattern>
    <path id="body" stroke-width="1" d="M52.8 149.5a203 203 0 0 1-44-4c-5.8-.6-7-6.8-7.4-12.2a314 314 0 0 1 2.6-70C8 36 12.5 29.5 5.3 1c0 0 9.7 5 28.5 17 10.5-.8 23.3 1 32.9 0C86.2 3.2 92 1.3 92 1.3c-6.4 30.8.3 37.8 4 65.3 3.8 27.6 4 52 2.6 67.6.2 6.5-4.8 10.7-10.2 11.7a138.6 138.6 0 0 1-35.7 3.7Z" />
    ${faceDefs}
    ${accessoryDefs}
  </defs>
    ${rows}
    ${cats}
  </svg>
  `;

  setDragEvents();

  for (const cat of document.querySelectorAll<SVGGeometryElement>(
    `.draggable`
  )) {
    putElementInRow(cat, getRowAt(rand(0, rowCount - 1)), WIDTH / 2);
  }
}

function createCat(
  index: number,
  width: number,
  height: number,
  color: keyof typeof CAT_COLORS,
  patterns: CatPattern[],
  accessories: [Accessory, AccessoryPlace][]
): string {
  if (color === "black") patterns = patterns.filter((p) => p !== "tabby");
  else if (color === "white")
    patterns = patterns.filter((p) => p !== "tuxedo" && p !== "tabby");

  const stroke = "#100f0d";
  const black = color === "black";
  const tabby = patterns.includes("tabby");
  const tuxedo = patterns.includes("tuxedo");

  return `<g class="draggable" style=--color:${CAT_COLORS[color]}>
  <g transform="scale(${width} ${height})">
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
    <use xlink:href="#3" style="${
      black ? "stroke:#fff; mix-blend-mode:difference" : "stroke:" + stroke
    }"/>
    <path id="nose" fill="${stroke}" stroke="#999" stroke-linecap="butt" stroke-linejoin="miter" stroke-width="1" d="M44.8 40.9c0-1.3 9.7-1.4 9.8-.2 0 0-2.5 4.6-4.8 4.6-2.4 0-5-4.4-5-4.4Z"/>
    <path id="ear" fill="#faa" stroke="${stroke}" stroke-width="1" d="m86.3 10-11.2 7 9.5 5.7Z"/>
    <use xlink:href="#ear" id="earl" stroke-width="1" transform="matrix(-.997 0 0 .992 98 0)"/>
    ${accessories.map(
      ([item, place]) => `<use xlink:href="#${item}" class="${place}"/>`
    )}
    <g id="hand${index}" fill="${
    tuxedo ? "#fbfcfc" : "var(--color)"
  }" stroke-width="1.5" transform="translate(-.4)rotate(90,77,87)">
      <path id="paw" stroke="${stroke}" d="M83.6 75.2c0-.4 1.7-7.4.2-10.4-.7-1.4-2.6-2.2-5.2-2.1h-.5c-2.5.1-5.3 1-6.2 2.6-1.5 2.8-.4 10-.4 10.4"/>
      <path id="finger" stroke="${stroke}" stroke-linejoin="miter" d="M79.8 63.1v2.6"/>
      <use xlink:href="#finger" id="finger2" transform="matrix(.988 0 0 .992 -3 .8)"/>
    </g>
    <use xlink:href="#hand${index}" id="handl" fill="#fff" stroke-width="1" transform="matrix(-.997 0 0 .992 99.6 .5)rotate(180,78,87)"/>
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

function putElementInRow(
  element: SVGGeometryElement,
  row: SVGGElement,
  x: number,
  resolve = true
) {
  const bbox = element.getBBox();
  const height = bbox.height + bbox.y;
  const rowY = parseFloat(row.querySelector(".row-line")!.getAttribute("y1")!);
  element.setAttribute("transform", `translate(${x}, ${rowY - height})`);

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
    ...(row?.querySelectorAll(".draggable") ?? []),
  ] as SVGGraphicsElement[];
}

function calcDistance(
  el: SVGGraphicsElement,
  bbox: DOMRect,
  transform: DOMMatrix
) {
  const aBox = el.getBBox();
  const aTransform = el.transform.baseVal.getItem(0).matrix;

  const aLeft = aTransform.e;
  const aRight = aTransform.e + aBox.width;
  const bLeft = transform.e;
  const bRight = transform.e + bbox.width;

  const dx = Math.max(0, aLeft >= bLeft ? aLeft - bRight : bLeft - aRight);
  const dy = Math.abs(aTransform.f + aBox.height - (transform.f + bbox.height));

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
  const bbox = element.getBBox();
  const transform = element.transform.baseVal.getItem(0).matrix;
  const rows = getRows();

  return Array.from(rows).flatMap((row) => {
    const index = parseInt(row.dataset.index!);
    const dRow = rowIndex - index;
    return getRowElements(row)
      .filter((el) => el !== element)
      .map((el) => {
        const { dx, dy, xSpatial } = calcDistance(el, bbox, transform);
        return {
          el,
          dRow,
          dx,
          dy,
          xSpatial,
          dist: Math.sqrt(dx * dx + dy * dy * ROW_PROXIMITY_MULTIPLIER),
          touch:
            (dRow === 0 && xSpatial === Spatial.Overlapping) ||
            (Math.abs(dRow) === 1 && xSpatial === Spatial.Contained),
          neighbour: Math.abs(dRow) <= 1 && xSpatial === Spatial.Overlapping,
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
    const spacing = -5;
    const transform = intruder.transform.baseVal.getItem(0).matrix;
    const left = transform.e;
    const width = intruder.getBBox().width;
    const right = left + width;
    const midX = left + width / 2;

    // Push right elements
    elements
      .filter(
        (el: any) =>
          el !== intruder &&
          el.transform.baseVal.getItem(0).matrix.e + el.getBBox().width / 2 >=
            midX
      )
      .sort(
        (a: any, b: any) =>
          a.transform.baseVal.getItem(0).matrix.e -
          b.transform.baseVal.getItem(0).matrix.e
      )
      .reduce((anchor: number, el: any) => {
        const t = el.transform.baseVal.getItem(0).matrix;
        if (t.e < anchor) {
          el.setAttribute("transform", `translate(${anchor}, ${t.f})`);
          return anchor + el.getBBox().width + spacing;
        }
        return t.e + el.getBBox().width + spacing;
      }, right + spacing);

    // Push left elements
    elements
      .filter(
        (el: any) =>
          el !== intruder &&
        el.transform.baseVal.getItem(0).matrix.e + el.getBBox().width / 2 < midX
      )
      .sort(
        (a: any, b: any) =>
          b.transform.baseVal.getItem(0).matrix.e -
          a.transform.baseVal.getItem(0).matrix.e
      )
      .reduce((anchor: number, el: any) => {
        const t = el.transform.baseVal.getItem(0).matrix;
        const w = el.getBBox().width;
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
  const draggableElements = document.querySelectorAll(".draggable");

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
    const touch = elements.filter(({ touch }) => touch).map(({ el }) => el);
    const far = elements.filter(({ dist }) => dist > 200).map(({ el }) => el);
    markElements([selectedElement], "selected");
    markElements(touch, "touch");
    markElements(far, "far");

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
    const { height } = selectedElement.getBBox();
    let activeRow = null;

    // Find active row
    for (const row of rows) {
      const rowLine = row.querySelector(".row-line");
      const rowY = parseFloat(rowLine!.getAttribute("y1")!);
const y = f + height;
      if (y > rowY - ROW_HEIGHT && y <= rowY + STEP_OFFSET) {
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

    unmarkElements("selected");
    unmarkElements("touch");
    unmarkElements("far");
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
