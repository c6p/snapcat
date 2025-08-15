import { rand, randf } from "./utils";

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
  for (let i = 0; i < catCount; i++) {
    const width = rand(50, 100);
    const height = rand(75, 150);
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

function createCat(index: number, width: number, height: number): string {
  return `<rect class="draggable" transform="translate(${
    index * 50
  }, 50)" width="${width}" height="${height}" rx="10" ry="10" fill="#666" />`;
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
