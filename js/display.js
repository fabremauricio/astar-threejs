// Initializates everything and handles rendering

let MODE = "PLAY";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
const controls = new THREE.OrbitControls(camera, renderer.domElement);
const objects = new Map();
const raycaster = new THREE.Raycaster();

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

document.body.appendChild(renderer.domElement);
window.addEventListener("resize", _onWindowResize, false);
document.addEventListener("pointerdown", _onPointerDown);
document.addEventListener("keypress", onKeyPress);

function init(size) {
  scene.background = new THREE.Color(0xffffff);

  _loadFloor(size);
  _loadLights();
  _loadCamera();
  _loadCube(size);
}

function render(state) {
  update(state);
  controls.update();
  renderer.render(scene, camera);
}

function _loadLights() {
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  const light = new THREE.AmbientLight(0x888888); // soft white light

  directionalLight.position.set(0, 2, 0);
  directionalLight.target.position.set(-1, 0, 0);

  scene.add(directionalLight);
  scene.add(directionalLight.target);
  scene.add(light);
}

function _loadCamera() {
  camera.position.y = 1;
  camera.position.z = 1;
  camera.lookAt(new THREE.Vector3(0, 0, 0));
}

function _loadCube(size) {
  const geometry = new THREE.BoxGeometry(0.5 / size, 0.5 / size, 0.5 / size);
  const material = new THREE.MeshPhongMaterial({ color: 0x06aed5 });
  const cube = new THREE.Mesh(geometry, material);

  scene.add(cube);
  objects.set("cube", cube);
}
function _loadFloor(size) {
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const geometry = new THREE.BoxGeometry(1 / size, 1 / size / 10, 1 / size);
      const material = new THREE.MeshBasicMaterial({ color: 0xeeeeee });
      const cell = new THREE.Mesh(geometry, material);

      const geo = new THREE.EdgesGeometry(geometry);
      const mat = new THREE.LineBasicMaterial({
        color: 0x999999,
        linewidth: 1,
      });
      const wireframe = new THREE.LineSegments(geo, mat);

      cell.add(wireframe);

      cell.position.x = -0.5 + 0.5 / size + (1 / size) * i;
      cell.position.z = -0.5 + 0.5 / size + (1 / size) * j;
      cell.position.y = -1 / size / 10;
      cell.type = "floor";
      cell.posX = i;
      cell.posY = j;

      scene.add(cell);
      objects.set(`floor_${i}_${j}`, cell);
    }
  }
}

function _onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function _onPointerDown(event) {
  const pointer = new THREE.Vector2();
  pointer.set(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(Array.from(objects.values()));

  if (intersects.length > 0) {
    const element = intersects[0].object;

    if (element.type && element.type === "floor") {
      if (MODE === "BOX") {
        _addObstacle(element.posX, element.posY);
      } else if (MODE === "FROM") {
        STATE.from.x = Math.floor(element.posX);
        STATE.from.y = Math.floor(element.posY);
        STATE.invalidate = true;
        localStorage.setItem("from_x", element.posX);
        localStorage.setItem("from_y", element.posY);
      } else if (MODE === "TO") {
        STATE.to.x = Math.floor(element.posX);
        STATE.to.y = Math.floor(element.posY);
        STATE.invalidate = true;
        localStorage.setItem("to_x", element.posX);
        localStorage.setItem("to_y", element.posY);
      }
    } else if (element.type && element.type === "obstacle" && MODE === "BOX") {
      _removeObstacle(element.posX, element.posY);
    }
  }
}

function onKeyPress(event) {
  console.log(event);

  if (event.key === "1") {
    MODE = "PLAY";
    document.title = "MODE: PLAY";
  } else if (event.key === "2") {
    MODE = "BOX";
    document.title = "MODE: BOX";
  } else if (event.key === "3") {
    MODE = "FROM";
    document.title = "MODE: FROM";
  } else if (event.key === "4") {
    MODE = "TO";
    document.title = "MODE: TO";
  } else if (event.key === "r") {
    reset();
  }
}

function _addObstacle(x, y) {
  const key = `obstacle_${x}_${y}`;

  if (!objects.has(key)) {
    const geometry = new THREE.BoxGeometry(1 / SIZE, 1 / SIZE / 3, 1 / SIZE);
    const material = new THREE.MeshPhongMaterial({ color: 0x444444 });
    const cube = new THREE.Mesh(geometry, material);

    cube.type = "obstacle";
    cube.posX = x;
    cube.posY = y;

    cube.position.x = -0.5 + 0.5 / SIZE + (1 / SIZE) * x;
    cube.position.z = -0.5 + 0.5 / SIZE + (1 / SIZE) * y;
    cube.position.y = 0.5 / SIZE / 3;

    scene.add(cube);
    objects.set(key, cube);
    STATE.map[y][x] = 1;
    STATE.invalidate = true;
    localStorage.setItem(`map_${y}_${x}`, 1);
  }
}

function _removeObstacle(x, y) {
  const key = `obstacle_${x}_${y}`;
  const cube = objects.get(key);
  scene.remove(cube);
  objects.delete(key);
  STATE.map[y][x] = 0;
  STATE.invalidate = true;
  localStorage.removeItem(`map_${y}_${x}`);
}

function _updateFrom(x, y) {
  const geometry = new THREE.ConeGeometry(0.5 / SIZE / 2, 0.5 / SIZE, 32);
  const material = new THREE.MeshPhongMaterial({ color: 0x4b58be });
  const cone = new THREE.Mesh(geometry, material);

  cone.position.x = -0.5 + 0.5 / SIZE + (1 / SIZE) * x;
  cone.position.z = -0.5 + 0.5 / SIZE + (1 / SIZE) * y;
  cone.position.y = 0.5 / SIZE / 2;

  if (!objects.has("from")) {
    scene.add(cone);
    objects.set("from", cone);
  } else {
    const cone = objects.get("from");

    cone.position.x = -0.5 + 0.5 / SIZE + (1 / SIZE) * x;
    cone.position.z = -0.5 + 0.5 / SIZE + (1 / SIZE) * y;
    cone.position.y = 0.5 / SIZE / 2;
  }
}

function _updateTo(x, y) {
  const geometry = new THREE.ConeGeometry(0.5 / SIZE / 2, 0.5 / SIZE, 32);
  const material = new THREE.MeshPhongMaterial({ color: 0xb14aed });
  const cone = new THREE.Mesh(geometry, material);

  cone.position.x = -0.5 + 0.5 / SIZE + (1 / SIZE) * x;
  cone.position.z = -0.5 + 0.5 / SIZE + (1 / SIZE) * y;
  cone.position.y = 0.5 / SIZE / 2;

  if (!objects.has("to")) {
    scene.add(cone);
    objects.set("to", cone);
  } else {
    const cone = objects.get("to");

    cone.position.x = -0.5 + 0.5 / SIZE + (1 / SIZE) * x;
    cone.position.z = -0.5 + 0.5 / SIZE + (1 / SIZE) * y;
    cone.position.y = 0.5 / SIZE / 2;
  }
}

function _updateCurrent(x, y) {
  const cube = objects.get("cube");
  cube.rotation.x += 0.07;
  cube.rotation.y += 0.07;
  cube.position.x = -0.5 + 0.5 / SIZE + (1 / SIZE) * x;
  cube.position.z = -0.5 + 0.5 / SIZE + (1 / SIZE) * y;
  cube.position.y = 0.5 / SIZE;
}

function _updateCellColor(x, y, color) {
  const key = `floor_${x}_${y}`;
  const obj = objects.get(key);
  obj.material.color.setHex(color);
}

function update(state) {
  const keys = Array.from(objects.keys());

  if (state.invalidate) {
    keys
      .filter((e) => e.includes("obstacle"))
      .forEach((e) => {
        scene.remove(objects.get(e));
        objects.delete(e);
      });
  }

  for (let x = 0; x < SIZE; x++) {
    for (let y = 0; y < SIZE; y++) {
      if (state.map[y][x] === 1 && state.invalidate) {
        _addObstacle(x, y);
      }

      // Clean
      _updateCellColor(x, y, 0xeeeeee);
    }
  }

  const maxDist = state.openList.map((e) => e.h).sort((a, b) => b - a)[0];

  for (let i = 0; i < state.closedList.length; i++) {
    const item = state.closedList[i];
    _updateCellColor(item.x, item.y, 0x999999);
  }

  for (let i = 0; i < state.openList.length; i++) {
    const item = state.openList[i];
    const dist = item.h / maxDist;
    const color = new THREE.Color()
      .lerpColors(new THREE.Color(0x00ff00), new THREE.Color(0xff0000), dist)
      .getHex();
    _updateCellColor(item.x, item.y, color);
  }

  {
    // Render path
    let item = state.current;
    const next = (list) => list.find((e) => e.x === item.ax && e.y === item.ay);

    _updateCellColor(item.x, item.y, 0x06aed5);
    while (!(item.x === item.ax && item.y === item.ay)) {
      _updateCellColor(item.x, item.y, 0x06aed5);
      item = next(state.closedList);
    }
    _updateCellColor(state.from.x, state.from.y, 0x06aed5);
  }

  _updateFrom(state.from.x, state.from.y);
  _updateTo(state.to.x, state.to.y);
  _updateCurrent(state.current.x, state.current.y);

  if (state.invalidate) {
    state.invalidate = false;
  }
}
