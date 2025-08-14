import { rand } from "./utils";

const WIDTH = 800;
const HEIGHT = 550;
const DOCK_STEP = 60;
const DOCK_MIN = HEIGHT - 100;

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
}

function startGame(app: HTMLDivElement) {
  console.log("Game started");

  const docks = Array.from({ length: 3 }, (_, i) => createDock(i)).join("");

  const catCount = 9;
  let cats = "";
  for (let i = 0; i < catCount; i++) {
    const width = rand(50, 100);
    const height = rand(75, 150);
    cats += createCat(i, width, height);
  }

  app.innerHTML = `
  <svg id="game"width="${WIDTH}" height="${HEIGHT}">
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

  // Initialize map for each dock
  docks.forEach((dock) => dockElements.set(dock.id, []));

  // Initialize all elements to use transform for positioning
  draggableElements.forEach((el) => {
    el.addEventListener("mousedown", startDrag);
  });

  const getMousePosition = (evt: MouseEvent | TouchEvent) => {
    const CTM = svg.getScreenCTM()!;
    const client = "touches" in evt ? evt.touches[0] : evt;
    return {
      x: (client.clientX - CTM.e) / CTM.a,
      y: (client.clientY - CTM.f) / CTM.d,
    };
  };

  function startDrag(evt: MouseEvent | TouchEvent) {
    evt.preventDefault();
    selectedElement = evt.target as SVGGeometryElement;
    // Bring element to the very top while dragging
    svg.appendChild(selectedElement);

    const mousePos = getMousePosition(evt);
    const transform = selectedElement.transform.baseVal.getItem(0).matrix;
    offset = {
      x: mousePos.x - transform.e,
      y: mousePos.y - transform.f,
    };

    // If the element was in a dock, remove it from tracking.
    // This leaves a gap, as requested.
    for (const [_dockId, elements] of dockElements.entries()) {
      const index = elements.indexOf(selectedElement);
      if (index > -1) {
        elements.splice(index, 1);
        break;
      }
    }
  }

  function drag(evt: MouseEvent | TouchEvent) {
    if (!selectedElement) return;
    evt.preventDefault();
    const mousePos = getMousePosition(evt);
    const newX = mousePos.x - offset.x;
    const newY = mousePos.y - offset.y;
    selectedElement.setAttribute("transform", `translate(${newX}, ${newY})`);
  }

  function endDrag(evt: MouseEvent | TouchEvent) {
    if (!selectedElement) return;

    const activeDock = getActiveDock(evt);

    if (activeDock) {
      const mousePos = getMousePosition(evt);
      const elHeight = parseFloat(selectedElement.getAttribute("height"));
      const dockLineY = parseFloat(
        activeDock.querySelector(".dock-line").getAttribute("y1")
      );

      // Set precise drop position based on cursor
      const newX = mousePos.x - offset.x;
      const newY = dockLineY - elHeight;
      selectedElement.setAttribute("transform", `translate(${newX}, ${newY})`);

      // Add to the new dock's tracking array and resolve collisions
      dockElements.get(activeDock.id).push(selectedElement);
      resolveCollisionsFrom(selectedElement, activeDock.id);

      // Update the z-order of all docked elements
      updateZOrder();
    }
    selectedElement = null;
  }

  function resolveCollisionsFrom(intruder, dockId) {
    const elements = dockElements.get(dockId);
    const spacing = 5; // Minimum space between elements

    const intruderTransform = intruder.transform.baseVal.getItem(0).matrix;
    const intruderLeft = intruderTransform.e;
    const intruderWidth = parseFloat(intruder.getAttribute("width"));
    const intruderRight = intruderLeft + intruderWidth;
    const intruderMidX = intruderLeft + intruderWidth / 2;

    // --- PUSH ELEMENTS TO THE RIGHT ---
    const rightGroup = elements
      .filter((el) => {
        if (el === intruder) return false;
        const elMidX =
          el.transform.baseVal.getItem(0).matrix.e +
          parseFloat(el.getAttribute("width")) / 2;
        return elMidX >= intruderMidX;
      })
      .sort(
        (a, b) =>
          a.transform.baseVal.getItem(0).matrix.e -
          b.transform.baseVal.getItem(0).matrix.e
      );

    let anchorRight = intruderRight + spacing;
    rightGroup.forEach((el) => {
      const transform = el.transform.baseVal.getItem(0).matrix;
      const elLeft = transform.e;

      if (elLeft < anchorRight) {
        const newX = anchorRight;
        el.setAttribute("transform", `translate(${newX}, ${transform.f})`);
        anchorRight = newX + parseFloat(el.getAttribute("width")) + spacing;
      } else {
        anchorRight = elLeft + parseFloat(el.getAttribute("width")) + spacing;
      }
    });

    // --- PUSH ELEMENTS TO THE LEFT ---
    const leftGroup = elements
      .filter((el) => {
        if (el === intruder) return false;
        const elMidX =
          el.transform.baseVal.getItem(0).matrix.e +
          parseFloat(el.getAttribute("width")) / 2;
        return elMidX < intruderMidX;
      })
      .sort(
        (a, b) =>
          b.transform.baseVal.getItem(0).matrix.e -
          a.transform.baseVal.getItem(0).matrix.e
      );

    let anchorLeft = intruderLeft - spacing;
    leftGroup.forEach((el) => {
      const transform = el.transform.baseVal.getItem(0).matrix;
      const elWidth = parseFloat(el.getAttribute("width"));
      const elRight = transform.e + elWidth;

      if (elRight > anchorLeft) {
        const newX = anchorLeft - elWidth;
        el.setAttribute("transform", `translate(${newX}, ${transform.f})`);
        anchorLeft = newX - spacing;
      } else {
        anchorLeft = transform.e - spacing;
      }
    });
  }

  function getActiveDock(evt) {
    const mousePos = getMousePosition(evt);
    for (const dock of docks) {
      const dockLine = dock.querySelector(".dock-line");
      const dockY = parseFloat(dockLine.getAttribute("y1"));
      const sensitivity = 60; // How close the mouse needs to be to the dock line
      if (mousePos.y > dockY - sensitivity && mousePos.y < dockY + 20) {
        return dock;
      }
    }
    return null;
  }

  function updateZOrder() {
    // Sort docks from top to bottom (visually)
    const sortedDocks = Array.from(docks).sort((a, b) => {
      const yA = parseFloat(a.querySelector(".dock-line").getAttribute("y1"));
      const yB = parseFloat(b.querySelector(".dock-line").getAttribute("y1"));
      return yA - yB;
    });

    // Re-append elements dock by dock. SVG appends to the end, making
    // the last appended elements appear on top.
    sortedDocks.forEach((dock) => {
      const elementsInDock = dockElements.get(dock.id) || [];
      elementsInDock.forEach((el) => {
        svg.appendChild(el);
      });
    });
  }

  // --- Attach Event Listeners ---
  svg.addEventListener("mousemove", drag);
  svg.addEventListener("mouseup", endDrag);
  svg.addEventListener("mouseleave", endDrag); // End drag if mouse leaves SVG

  // Touch event support
  svg.addEventListener("touchmove", drag, { passive: false });
  svg.addEventListener("touchend", endDrag);
  svg.addEventListener("touchcancel", endDrag);

  // Set initial Z-order on page load
  updateZOrder();
}
