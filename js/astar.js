function step(state) {
  if (state.openList.length) {
    state.openList.sort((a, b) => a.f - b.f);

    const current = state.openList.shift();
    const x = current.x;
    const y = current.y;

    state.closedList.push(current);
    state.current = current;

    console.log(state);
    if (x === state.to.x && y === state.to.y) {
      state.done = true;
      console.log("done");
      return;
    }

    const dx = [1, 0, -1, 0];
    const dy = [0, 1, 0, -1];

    for (let i = 0; i < dx.length; i++) {
      const px = x + dx[i];
      const py = y + dy[i];

      if (px >= 0 && px < SIZE && py >= 0 && py < SIZE) {
        const obstacle = state.map[py][px] === 1;
        if (!obstacle) {
          const h = dist(px, py, state.to.x, state.to.y);
          const g = current.g + 1;
          const f = g + h;

          const candidate = {
            x: px,
            y: py,
            ax: x,
            ay: y,
            h,
            g,
            f,
          };

          const inClosed = state.closedList.find(
            (e) => e.x === px && e.y === py
          );
          const inOpen = state.openList.find((e) => e.x === px && e.y === py);

          if (!inClosed && !inOpen) {
            state.openList.push(candidate);
          }
        }
      }
    }
  }
}

function dist(x1, y1, x2, y2) {
  //return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

  //return Math.pow(x1+x2+y1+y2,2);
}
