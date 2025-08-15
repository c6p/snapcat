import { randf } from "./utils";

const WIDTH = 640;
const HEIGHT = 640;
const DOCK_STEP = 60;
const DOCK_MIN = HEIGHT - 100;

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

  const docks = Array.from({ length: 5 }, (_, i) => createDock(i)).join("");

  const catCount = 9;
  let cats = "";
  cats += createCat(-9, 0.5, 1.3);
  cats += createCat(-9, 1.3, 0.7);
  for (let i = 0; i < catCount; i++) {
    const width = randf(0.5, 1.3);
    const height = randf(0.5, 1.3);
    cats += createCat(i, width, height);
  }

  app.innerHTML = `
  <svg id="game" width="100%" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" >
    ${docks}
    ${cats}
  </svg>
  `;

  setDragEvents();
}

function createCat(_index: number, width: number, height: number): string {
  return `<g class="draggable">
  <g transform="scale(${width} ${height})translate(59 -51)">
    <path id="body" fill="#797b7c" stroke="#100f0d" stroke-width="1.5" d="M-1.7 201c-14.8-.2-29.7-.6-44.2-4-5.7-.6-7.8-7.2-8.3-12.6a363 363 0 0 1 4.1-72.1c3.8-27.4 7.9-42.4 14-57.3 5.4-14.5 8.5 15.8 19.3 14.2 10.6-.7 19.4.3 29-.6 4-3 11.8-26.7 14.4-13 6.6 17.2 12 33.2 15.7 61 3.8 27.8 3.4 53.2 2 69 .2 6.5-4.8 10.6-10.2 11.7A138.4 138.4 0 0 1-1.7 201z"/>
    <path id="belly" fill="#fbfcfc" d="M16 151.6c-6.8-6-27.6-7.6-37.6-.5s-10.5 40.1-13 47c9.6 2.2 27 2.4 32.9 2.4 12.4 0 22.7-1 26.2-1.8-1.5-7.8-3.5-42.7-8.6-47.1"/>
    <path id="ear" fill="#fbfcfc" d="M23.7 56.2c-1.8 0-5.8 8.6-6.2 10.7-.3 1.4 10 1.8 10.4.6.3-1.2-3-11.4-4.2-11.3z"/>
    <path id="eye" stroke="#100f0d" stroke-width="3.1" d="m10 89 4 1"/>
    <g id="hand" transform="rotate(90,24,135)">
      <path id="paw" fill="#797b7c" stroke="#100f0d" stroke-width="1.6" d="M30.8 120.8c0-.4 1.7-7.4.2-10.5-.7-1.4-2.7-2.2-5.2-2.2h-.6c-2.5.2-5.4 1-6.3 2.8-1.5 2.7-.3 10-.3 10.4"/>
      <path id="finger" stroke="#100f0d" stroke-width="1.1" d="M27 108.6v2.6"/>
      <use xlink:href="#finger" id="finger2" transform="translate(-4.6 .5)"/>
    </g>
    <use xlink:href="#hand" id="handl" transform="matrix(-1 0 0 1 -8 0)rotate(180,24,135)"/>
    <use xlink:href="#eye" id="eyel" transform="matrix(-1 0 0 1 -8 0)"/>
    <g id="nm" transform="translate(1.8 2.1)">
      <path id="mouth" fill="none" stroke="#11100e" stroke-width="1" d="M0 96.2c-.4.5-1.1 1.9-2.5 1.6C-4 97.5-4 95.6-4 95.6"/>
      <path id="nose" fill="#100f0d" d="M-4.8 95.8v-3c1.5 0 2.7 0 2.8.8 0 .7-1 1.8-2.2 2v.1a2.5 2.5 0 0 1-.6 0"/>
      <use xlink:href="#mouth" id="mouthl" transform="matrix(-1 0 0 1 -9.6 0)"/>
      <use xlink:href="#nose" id="nosel" transform="matrix(-1 0 0 1 -9.6 0)"/>
    </g>
    <use xlink:href="#ear" id="earl" transform="matrix(-1 0 0 1 -9 .4)"/>
  </g>
  </g>`;
}

function createDock(index: number) {
  const y = DOCK_MIN - DOCK_STEP * index;
  return `<g class="dock" id="dock${index}">
    <line class="dock-line" x1="0" y1="${y}" x2="${WIDTH}" y2="${y}" />
  </g>`;
}

function setDragEvents() {
  const svg = document.querySelector<SVGSVGElement>("#game")!;
  const docks = document.querySelectorAll(".dock");
  const draggableElements = document.querySelectorAll(".draggable");

  let selectedElement: SVGGeometryElement | null = null;
  let offset = { x: 0, y: 0 };
  const dockElements = new Map();

  // Initialize dock tracking
  docks.forEach((dock) => dockElements.set(dock.id, []));

  const getMousePosition = (evt: MouseEvent | TouchEvent) => {
    const ctm = svg.getScreenCTM()!;
    const client =
      "touches" in evt ? evt.touches?.[0] ?? evt.changedTouches[0] : evt;
    return {
      x: (client.clientX - ctm.e) / ctm.a,
      y: (client.clientY - ctm.f) / ctm.d,
    };
  };

  const resolveCollisions = (intruder: any, dockId: string) => {
    const elements = dockElements.get(dockId);
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
          el.transform.baseVal.getItem(0).matrix.e + el.getBBox().width / 2 <
            midX
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

  const updateZOrder = () => {
    Array.from(docks)
      .sort(
        (a: any, b: any) =>
          parseFloat(a.querySelector(".dock-line").getAttribute("y1")) -
          parseFloat(b.querySelector(".dock-line").getAttribute("y1"))
      )
      .forEach((dock: any) =>
        (dockElements.get(dock.id) || []).forEach((el: any) =>
          svg.appendChild(el)
        )
      );
  };

  const startDrag = (evt: MouseEvent | TouchEvent) => {
    evt.preventDefault();
    selectedElement = evt.currentTarget as SVGGeometryElement;
    // Bring element to the very top while dragging
    svg.appendChild(selectedElement);

    const mousePos = getMousePosition(evt);
    const transform = selectedElement.transform.baseVal.getItem(0).matrix;
    offset = { x: mousePos.x - transform.e, y: mousePos.y - transform.f };

    // Remove from docks
    for (const [, elements] of dockElements.entries()) {
      const index = elements.indexOf(selectedElement);
      if (index > -1) {
        elements.splice(index, 1);
        break;
      }
    }
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
    let activeDock = null;

    // Find active dock
    for (const dock of docks) {
      const dockLine = dock.querySelector(".dock-line");
      const dockY = parseFloat(dockLine!.getAttribute("y1")!);
      if (mousePos.y > dockY - 60 && mousePos.y < dockY + 20) {
        activeDock = dock;
        break;
      }
    }

    if (activeDock) {
      const height = selectedElement.getBBox().height;
      const dockY = parseFloat(
        activeDock.querySelector(".dock-line")!.getAttribute("y1")!
      );
      selectedElement.setAttribute(
        "transform",
        `translate(${mousePos.x - offset.x}, ${dockY - height})`
      );

      dockElements.get(activeDock.id).push(selectedElement);
      resolveCollisions(selectedElement, activeDock.id);
      updateZOrder();
    }
    selectedElement = null;
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

  updateZOrder();
}
