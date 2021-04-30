const SIZE = 40;
const TICK_DURATION = 1;

const initial = new Array(SIZE);
for (let i = 0; i < SIZE; i++) {
  initial[i] = new Array(SIZE);
  for (let j = 0; j < SIZE; j++) {
    const exists = localStorage.getItem(`map_${i}_${j}`) !== null;
    initial[i][j] = exists ? 1 : 0;
  }
}

const STATE = {
  invalidate: true,
  map: initial,
  done: false,
  from: {
    x: parseInt(localStorage.getItem("from_x")) || 0,
    y: parseInt(localStorage.getItem("from_y")) || 0,
  },
  to: {
    x: parseInt(localStorage.getItem("to_x")) || SIZE - 1,
    y: parseInt(localStorage.getItem("to_y")) || SIZE - 1,
  },
  current: null,
  openList: [],
  closedList: [],
};

reset();

function reset() {
  STATE.current = {
    x: STATE.from.x,
    y: STATE.from.y,
    h: 0,
    f: 0,
    g: 0,
    ax: STATE.from.x,
    ay: STATE.from.y,
  };
  STATE.openList = [STATE.current];
  STATE.closedList = [];
  STATE.done = false;
}
