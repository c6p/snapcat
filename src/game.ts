import { choose, rand, randb, randf } from "./utils";
import { CAT_COLORS, type CatPattern } from "./colors";

const WIDTH = 640;
const HEIGHT = 640;
const ROW_HEIGHT = 60;
const ROW_PROXIMITY_MULTIPLIER = 2;
const STEP_OFFSET = 10;
const ROW_MIN = HEIGHT - 100;

const rowElements = new Map();
let highlighted: SVGGraphicsElement[] = [];

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
    cats += createCat(
      i,
      width,
      height,
      color,
      patterns.filter(() => randb())
    );
  }

  app.innerHTML = `
  <svg id="game" width="100%" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" >
  <defs>
    <pattern id="tabby" width="100" height="100" patternTransform="rotate(90)scale(0.7)" patternUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="#fff"/><path fill="#e0e0e0" d="M100 20.234v41.641q-6.719 7.656-10.234 17.812-3.36 9.766-3.125 20.313h-3.438v-4.531q0-2.657.39-4.532l.626-3.359.703-3.281 2.265-7.656q1.329-4.22 2.813-7.344.781-1.719 2.812-4.453l2.891-4.297.86-2.578.312-2.735q.156-5-.547-13.203l-2.344-20.937Q92.656 8.516 92.422 0h6.797q-.078 6.172.078 10.156.156 5.547.703 10.078m0 49.532v20.468q-.469 2.11-.703 4.844L99.063 100H92.5l-.078-8.594q0-5.156.547-8.515.469-3.047 2.89-6.797zM79.219 100h-3.672l.39-8.36.938-8.359q1.016-6.953 1.875-10.781 1.328-5.86 3.36-10.313l2.5-6.015 1.562-6.328.547-5q.078-2.813-.703-4.844l-3.282-9.531-3.28-9.531q-1.876-6.094-2.735-10.313Q75.547 4.922 75.547 0h3.672q.078 8.516 2.422 17.031 2.343 8.282 6.718 15.782l-2.03-11.016-1.876-11.016-.86-5.312L83.126 0h3.516l.234 4.531.547 4.532 2.5 16.25 2.422 16.328q1.015 8.125.156 15.625l-.625 3.28q-.547 1.798-1.562 2.97l-1.875 1.953q-1.094 1.172-1.641 2.187-1.64 2.735-2.89 7.813l-2.423 8.047q-1.406 3.515-1.875 8.125-.39 3.125-.39 8.359m-6.406 0H64.53q-2.11-9.922-1.718-18.828.39-4.922 1.796-8.203l2.97-7.5q1.405-4.219 1.718-7.89.312-2.735-.39-5.313-.704-2.657-2.345-4.844-2.343-3.125-5.78-6.328l-.938 2.5-.86 2.656q-2.343 6.797-4.922 11.953-3.125 6.25-7.03 10.86-1.485 2.265-2.579 5.312-.781 2.344-1.484 5.781Q41.25 88.75 41.25 100h-6.484l.312-12.266q.39-6.718 1.64-12.265 1.72-7.344 4.844-11.407l2.344-2.5 2.344-2.5q2.5-2.968 3.906-6.875 1.328-3.671 1.485-7.734.156-5.156-.86-12.5L48.906 19.61Q47.578 8.516 47.97 0h10.078q-.625 12.188 1.875 22.11 2.422 9.218 8.515 16.25l5 5.234q3.047 3.203 4.375 5.781 2.657 4.922.938 12.266-1.016 4.609-3.906 10.859-1.172 2.578-1.797 5.86-.547 2.5-.781 6.093-.391 7.266.546 15.547m-14.765 0H47.969V89.453q.312-5.937 1.718-10.39 4.297-12.657 10.157-22.813l1.797-3.047 2.109-2.812q1.25 4.687-1.094 11.562-5.625 16.953-4.61 38.047m-29.296 0H17.969l.234-5.781.469-5.782L21.25 65.86l2.422-22.578q1.172-12.031-1.875-21.797-1.719 3.047-2.969 7.5l-2.031 7.813q-.469 1.719-.547 4.219l.078 4.218-.547 11.094-1.797 10.469Q12.5 74.062 12.11 77.266q-.39 2.734-.312 6.406l.234 6.406.39 5q.235 2.813.704 4.922H5.781V81.25l-.078-6.016Q1.563 81.797 0 89.844v-20.39q5.86-10.47 7.422-22.657 1.25-9.14.078-23.36L6.406 11.72Q5.86 4.844 5.781 0h7.344l1.406 11.328 1.094 11.328q1.25-2.422 1.797-6.015l.625-6.25.078-5.157L17.969 0h10.86q.077 2.969.702 6.953l1.172 6.797 1.64 11.094q.626 6.172.157 11.172-.547 4.297-2.031 9.687L27.5 55.078q-2.031 6.719-2.344 14.531-.078 3.75.625 8.36l1.563 8.203.703-2.422 4.531-18.672q2.344-10.312 3.594-18.828.625-3.984.625-9.062l-.313-9.141-1.093-13.984Q34.688 5.547 34.766 0h6.484q-.078 8.984 1.953 19.688l1.64 8.75q.938 5.078.938 8.75 0 3.828-1.015 7.5-.938 3.671-2.813 6.874-4.61 9.375-7.812 20.47-2.813 9.687-4.766 21.405-.703 3.75-.625 6.563M0 61.797V19.766l.781 4.375.703 4.453 2.344 13.984.235 1.563.234 2.343Q5.078 54.61 0 61.797M64.61 0h8.202q-.39 7.266.157 11.953l.86 4.531 1.25 4.532 3.593 13.672 3.36 13.671.546 2.657.156 2.656-2.343-6.406q-1.407-3.516-3.047-6.172l-4.14-6.64-4.298-6.563q-1.172-1.953-1.875-4.61-.547-1.875-.937-4.922Q64.844 9.453 64.609 0"/></pattern>
    <path id="body" stroke-width="1.5" d="M-1.7 201c-14.8-.2-29.7-.6-44.2-4-5.7-.6-7.8-7.2-8.3-12.6a363 363 0 0 1 4.1-72.1c3.8-27.4 7.9-42.4 14-57.3 5.4-14.5 8.5 15.8 19.3 14.2 10.6-.7 19.4.3 29-.6 4-3 11.8-26.7 14.4-13 6.6 17.2 12 33.2 15.7 61 3.8 27.8 3.4 53.2 2 69 .2 6.5-4.8 10.6-10.2 11.7A138.4 138.4 0 0 1-1.7 201z"/>
  </defs>
    ${rows}
    ${cats}
  </svg>
  `;

  setDragEvents();

  for (const cat of document.querySelectorAll<SVGGeometryElement>(
    `.draggable`
  )) {
    putElementInRow(
      cat,
      document.querySelector(`#row${rand(0, rowCount - 1)}`)!,
      WIDTH / 2
    );
  }
}

function createCat(
  index: number,
  width: number,
  height: number,
  color: keyof typeof CAT_COLORS,
  patterns: CatPattern[]
): string {
  if (color === "black") patterns = patterns.filter((p) => p !== "tabby");
  else if (color === "white")
    patterns = patterns.filter((p) => p !== "tuxedo" && p !== "tabby");

  return `<g class="draggable" style=--color:${CAT_COLORS[color]}>
  <g transform="scale(${width} ${height})translate(59 -51)">
    <use class="body" href="#body" fill="var(--color)" stroke="#100f0d" />
    ${
      patterns.includes("tabby")
        ? '<use href="#body" fill="url(#tabby)" stroke="none" style="mix-blend-mode:multiply"/>'
        : ""
    }
    ${
      patterns.includes("tuxedo")
        ? '<path id="belly" fill="#fbfcfc" d="M16 151.6c-6.8-6-27.6-7.6-37.6-.5s-10.5 40.1-13 47c9.6 2.2 27 2.4 32.9 2.4 12.4 0 22.7-1 26.2-1.8-1.5-7.8-3.5-42.7-8.6-47.1"/>'
        : ""
    }
    <path id="ear" fill="#ffd0e8" d="M23.7 56.2c-1.8 0-5.8 8.6-6.2 10.7-.3 1.4 10 1.8 10.4.6.3-1.2-3-11.4-4.2-11.3z"/>
    <path id="eye" stroke="#9cca1cff" stroke-width="3.1" d="m10 89 4 1" />
    <g id="hand${index}" transform="rotate(90,24,135)">
      <path id="paw" fill="${
        patterns.includes("tuxedo") ? "#fbfcfc" : "var(--color)"
      }" stroke="#100f0d" stroke-width="1.6" d="M30.8 120.8c0-.4 1.7-7.4.2-10.5-.7-1.4-2.7-2.2-5.2-2.2h-.6c-2.5.2-5.4 1-6.3 2.8-1.5 2.7-.3 10-.3 10.4"/>
      <path id="finger" stroke="#100f0d" stroke-width="1.1" d="M27 108.6v2.6"/>
      <use xlink:href="#finger" id="finger2" transform="translate(-4.6 .5)"/>
    </g>
    <use xlink:href="#hand${index}" id="handl" transform="matrix(-1 0 0 1 -8 0)rotate(180,24,135)"/>
    <use xlink:href="#eye" id="eyel" transform="matrix(-1 0 0 1 -8 0)" />
    <g id="nm" transform="translate(1.8 2.1)" >
      <path id="mouth" fill="none" stroke="#11100e" stroke-width="1" d="M0 96.2c-.4.5-1.1 1.9-2.5 1.6C-4 97.5-4 95.6-4 95.6"/>
      <path id="nose" fill="#ffaad6" d="M-4.8 95.8v-3c1.5 0 2.7 0 2.8.8 0 .7-1 1.8-2.2 2v.1a2.5 2.5 0 0 1-.6 0"/>
      <use xlink:href="#mouth" id="mouthl" transform="matrix(-1 0 0 1 -9.6 0)"/>
      <use xlink:href="#nose" id="nosel" transform="matrix(-1 0 0 1 -9.6 0)"/>
    </g>
    <use xlink:href="#ear" id="earl" transform="matrix(-1 0 0 1 -9 .4)"/>
  </g>
  </g>`;
}

function createRow(index: number) {
  const y = ROW_MIN - ROW_HEIGHT * index;
  const step = ROW_HEIGHT / 2 - 10;
  const x = 10 + index * 10;
  const y2 = y + step - STEP_OFFSET;
  return `<g class="row" id="row${index}">
<polygon points="${x},${y} ${WIDTH - x},${y} ${WIDTH - x + 10},${
    y + step
  } ${x - 10},${y + step}" fill="#e0e0e0"/>
    <rect x="${x - 10}" y="${y + step}" width="${WIDTH - 2 * x + 20}" height="${
    ROW_HEIGHT - step
  }" fill="#a0a0a0"/>
    <line class="row-line" x1="0" y1="${y2}" x2="${WIDTH}" y2="${y2}" />
  </g>`;
}

function putElementInRow(element: SVGGeometryElement, row: Element, x: number) {
  const height = element.getBBox().height;
  const rowY = parseFloat(row.querySelector(".row-line")!.getAttribute("y1")!);
  element.setAttribute("transform", `translate(${x}, ${rowY - height})`);

  rowElements.get(row.id).push(element);
  element.dataset.rowId = row.id;
  resolveCollisions(element, row.id);
  row.appendChild(element); // update z order
}

function inSameColumn(el: SVGGraphicsElement, x: number, width: number) {
  const _x = el.transform.baseVal.getItem(0).matrix.e;
  const _width = el.getBBox().width;
  return _x < x + width && _x + _width > x;
}

function getRows() {
  return [...document.querySelectorAll(".row")];
}

function getElements(row: Element | undefined) {
  return [
    ...(row?.querySelectorAll(".draggable") ?? []),
  ] as SVGGraphicsElement[];
}

function findNeighbours(element: SVGGraphicsElement) {
  const x = element.transform.baseVal.getItem(0).matrix.e;
  const width = element.getBBox().width;
  const rowId = element.dataset.rowId;
  const rows = getRows();

  const neighbours = (rowIndex: number) => {
    const elements = getElements(rows.at(rowIndex));
    return elements.filter((el) => inSameColumn(el, x, width));
  };

  const rowIndex = rows.findIndex((row) => row.id === rowId);
  const allNeighbours = [-1, 0, 1].map((i) => neighbours(rowIndex + i));

  return allNeighbours;
}

function withinDistance(
  a: SVGGraphicsElement,
  b: SVGGraphicsElement,
  dist: number
) {
  const ab = a.getBBox();
  const bb = b.getBBox();
  const at = a.transform.baseVal.getItem(0).matrix;
  const bt = b.transform.baseVal.getItem(0).matrix;

  // NOTE: may also use ab.x and y in calculations
  const dx = Math.max(
    0,
    at.e > bt.e ? at.e - (bt.e + bb.width) : bt.e - (at.e + ab.width)
  );
  const dy = Math.abs(at.f + ab.height - (bt.f + bb.height));
  const distance = Math.sqrt(dx * dx + dy * dy * ROW_PROXIMITY_MULTIPLIER);

  if (distance <= dist) console.warn(at, ab, bt, bb, dx, dy, distance, dist);
  return distance <= dist;
}

function findWithinDistance(element: SVGGraphicsElement, dist: number) {
  const rows = getRows();
  const elements = Array.from(rows).flatMap((row) => getElements(row));
  return elements.filter(
    (el) => element !== el && withinDistance(element, el, dist)
  );
}

function highlightElements(elements: SVGGraphicsElement[]) {
  highlighted = elements;
  elements.forEach((el) => el?.classList.add("highlight"));
}

function unhighlightElements() {
  highlighted.forEach((el) => el?.classList.remove("highlight"));
  highlighted = [];
}

const resolveCollisions = (intruder: any, rowId: string) => {
  const elements = rowElements.get(rowId);
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
  const rows = document.querySelectorAll(".row");
  const draggableElements = document.querySelectorAll(".draggable");

  let selectedElement: SVGGeometryElement | null = null;
  let oldPos = { x: 0, y: 0 };
  let offset = { x: 0, y: 0 };

  // Initialize row tracking
  rows.forEach((row) => rowElements.set(row.id, []));

  const getMousePosition = (evt: MouseEvent | TouchEvent) => {
    const ctm = svg.getScreenCTM()!;
    const client =
      "touches" in evt ? evt.touches?.[0] ?? evt.changedTouches[0] : evt;
    return {
      x: (client.clientX - ctm.e) / ctm.a,
      y: (client.clientY - ctm.f) / ctm.d,
    };
  };

  const startDrag = (evt: MouseEvent | TouchEvent) => {
    evt.preventDefault();
    selectedElement = evt.currentTarget as SVGGeometryElement;
const [prev, cur, next] = findNeighbours(selectedElement);
    const near = findWithinDistance(selectedElement, 200);

    // Bring element to the very top while dragging
    svg.appendChild(selectedElement);

    const mousePos = getMousePosition(evt);
    const transform = selectedElement.transform.baseVal.getItem(0).matrix;
    oldPos = { x: transform.e, y: transform.f };
    offset = { x: mousePos.x - transform.e, y: mousePos.y - transform.f };

    // Remove from rows
    for (const [, elements] of rowElements.entries()) {
      const index = elements.indexOf(selectedElement);
      if (index > -1) {
        elements.splice(index, 1);
        break;
      }
    }

    //highlightElements([...cur, ...prev, ...next]);
    highlightElements(near);
  };

  const drag = (evt: MouseEvent | TouchEvent) => {
    if (!selectedElement) return;
    evt.preventDefault();
    const mousePos = getMousePosition(evt);
    selectedElement.setAttribute(
      "transform",
      `translate(${mousePos.x - offset.x}, ${mousePos.y - offset.y})`
    );
  };

  const endDrag = (evt: MouseEvent | TouchEvent) => {
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
    if (!activeRow) {
      // revert
      activeRow = document.getElementById(selectedElement.dataset.rowId!)!;
      x = oldPos.x;
    }

    putElementInRow(selectedElement, activeRow, x);
    selectedElement = null;
unhighlightElements();
  };

  // Setup draggable elements
  draggableElements.forEach((el) => {
    el.addEventListener("mousedown", startDrag as any);
    el.addEventListener("touchstart", startDrag as any, { passive: false });
  });

  // Global listeners
  svg.addEventListener("mousemove", drag);
  svg.addEventListener("mouseup", endDrag);
  svg.addEventListener("mouseleave", endDrag);
  svg.addEventListener("touchmove", drag, { passive: false });
  svg.addEventListener("touchend", endDrag);
  svg.addEventListener("touchcancel", endDrag);
}
