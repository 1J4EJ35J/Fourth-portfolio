// js/particle.js

// 註冊 GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// ==========================================
// 1. 全域變數宣告
// ==========================================

// --- System A: 舊背景粒子 (不動) ---
let scene;
let camera;
let renderer;
let container = document.getElementById("canvas-container");

let firstParticleSystem, secondParticleSystem, secondParticleMaterial;
let thirdParticleSystem, thirdParticleMaterial;
let fourthParticleSystem, fourthParticleMaterial;
let fifthParticleSystem, fifthParticleMaterial;

// --- System B: 光束粒子 (6組獨立) ---
let sceneLight;
let cameraLight;
let rendererLight;
let containerLight = document.getElementById("canvas-container-light");

// 6 個獨立的光束粒子系統
let beam1System; // 垂直 A
let beam2System; // 垂直 B
let beam3System; // 左弧 A
let beam4System; // 左弧 B
let beam5System; // 右弧 A
let beam6System; // 右弧 B

// 路徑查表 (Look-Up Tables)
let leftPathLUT = [];
let rightPathLUT = [];
let pathHeight = 0;

// 視窗邊界計算
let lightBounds = { top: 0, bottom: 0, floorY: 0, pixelScale: 1 };

// --- 共用變數 ---
let time = 0;
let runFirst = true;
let firstParticleData = [];
let mouse = new THREE.Vector2(9999, 9999);
let mouse3DVec = new THREE.Vector3(0, 0, 0);
let isIdle = true;
let idleTimer = null;
let mousePath = [];

// ==========================================
// 2. 參數設定 (Config)
// ==========================================

const config = {
  // 舊背景粒子 (不動)
  firstParticle: {
    count: 150000,
    color: 0x008cff,
    size: 4.4,
    opacity: 0.7,
    pathLength: 90,
    speedFast: 0.6,
    speedSlow: 0.3,
    scatterHead: 1,
    scatterTail: 200,
    sphereRadius: 800,
    idleTimeout: 800,
    returnSpeed: 0.02,
    rippleIntensity: 255,
    rippleSpeed: 1.7,
    rippleFrequency: 0.026,
  },
  secondParticle: {
    count: 4000,
    rangeZ: 1600,
    rangeXY: 2500,
    speed: 20.0,
    size: 2800.0 * window.devicePixelRatio,
    color: "#008cff",
  },
  thirdParticle: {
    count: 6,
    rangeZ: 3000,
    rangeXY: 2000,
    speed: 40.0,
    streakLength: 200.0,
    color: "#008cff",
  },
  fourthParticle: {
    count: 18000,
    rangeZ: 2500,
    rangeXY: 2500,
    speed: 120.0,
    maxSpeed: 240.0,
    size: 4800.0 * window.devicePixelRatio,
    color: "#008cff",
  },
  fifthParticle: {
    count: 8,
    rangeZ: 3000,
    rangeXY: 2000,
    speed: 140.0,
    maxSpeed: 190.0,
    streakLength: 300.0,
    color: "#008cff",
  },
};

// ★ 新：光束粒子控制台 (新增 thickness 粗細控制)
const configBeam = {
  cameraZ: 1000,
  floorOffset: 80,

  // SVG 路徑數據
  pathRight:
    "M0.5 0.0078125C3.16667 143.008 10.2 430.008 17 496.008C25.5 578.508 84.5775 598.428 101 605.008C247 663.508 156 751.008 113 765.508C70 780.008 50.5 790.508 50.5 841.008C50.5 881.408 50.5 912.841 50.5 923.508",
  pathLeft:
    "M180.704 0.0078125C178.038 143.008 171.004 430.008 164.204 496.008C155.704 578.508 96.6269 598.428 80.2043 605.008C-65.7957 663.508 25.2043 751.008 68.2043 765.508C111.204 780.008 130.704 790.508 130.704 841.008C130.704 881.408 130.704 912.841 130.704 923.508",

  // --- 垂直下墜組 (Straight) ---
  // 光粒 1
  beam1: {
    count: 700,
    color: "#3adeff",
    size: 10.0,
    speed: 0.4,
    thickness: 40.0, // ★ 實體粗細 (穩定半徑)
    noise: 3.0, // ★ 震動幅度 (調小，避免亂晃)
    opacity: 0.8,
    spread: 360,
    blur: 0.8,
    rotationSpeed: 1,
  },
  // 光粒 2
  beam2: {
    count: 0,
    color: "#008cff",
    size: 12.0,
    speed: 1.0,
    thickness: 30.0, // ★ 實體粗細
    noise: 10.0, // ★ 震動幅度 (調小)
    opacity: 0.7,
    spread: 0,
    blur: 0.5,
    rotationSpeed: -0.5,
  },

  // --- 左弧線組 (Left Path) ---
  // 光粒 3 (核心)
  beam3: {
    count: 1000,
    color: "#0068f0",
    size: 6.0,
    speed: 0.8,
    thickness: 60.0, // ★ 牆壁厚度
    noise: 0.0,
    opacity: 0.8,
    spread: 400,
    blur: 0.6,
    rotationSpeed: 0.0,
  },
  // 光粒 4 (外暈)
  beam4: {
    count: 1000,
    color: "#00ffea",
    size: 8.0,
    speed: 1,
    thickness: 60.0, // ★ 更厚的霧氣層
    noise: 0.0,
    opacity: 0.9,
    spread: 800,
    blur: 1,
    rotationSpeed: 0.0,
  },

  // --- 右弧線組 (Right Path) ---
  // 光粒 5 (核心)
  beam5: {
    count: 1000,
    color: "#008cff",
    size: 10.0,
    speed: 0.5,
    thickness: 60.0, // ★ 牆壁厚度
    noise: 0.0,
    opacity: 0.8,
    spread: 400,
    blur: 0.6,
    rotationSpeed: 0.0,
  },
  // 光粒 6 (外暈)
  beam6: {
    count: 400,
    color: "#008cff",
    size: 10.0,
    speed: 0.01,
    thickness: 835.0, // ★ 更厚的霧氣層
    noise: 75.0,
    opacity: 0.8,
    spread: 1520,
    blur: 0.9,
    rotationSpeed: 0.0,
  },
};

// ==========================================
// 3. 主程式入口
// ==========================================

try {
  initSceneOld();
  initSceneLight();
  initPathLUTs();

  // 舊粒子
  initFirstParticle();
  initFirstParticleEffects();
  initSecondParticle();
  initSecondParticleEffects();
  initThirdParticle();
  initThirdParticleEffects();
  initFourthParticle();
  initFifthParticle();

  // ★ 新光束粒子
  initBeamSystem();

  // 特效
  initTunnelEffects();
  initAboutEffects();
  initTextEffects();
  initCompetenciesEffects();

  animate();

  console.log("✅ V29 啟動：新增 Thickness 粗細控制 (分離震動與寬度)");
} catch (e) {
  console.error("❌ 錯誤:", e);
}

// ==========================================
// 4. 場景初始化
// ==========================================

function initSceneOld() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
  );
  camera.position.z = 750;
  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  if (container) container.appendChild(renderer.domElement);

  document.addEventListener("mousemove", onMouseMove, false);
  document.addEventListener(
    "mouseout",
    () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        isIdle = true;
      }, 100);
    },
    false
  );
  for (let i = 0; i < config.firstParticle.pathLength; i++)
    mousePath.push(new THREE.Vector3(0, 0, 0));
}

function initSceneLight() {
  sceneLight = new THREE.Scene();
  cameraLight = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
  );
  cameraLight.position.set(0, 0, configBeam.cameraZ);
  cameraLight.lookAt(0, 0, 0);

  rendererLight = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  rendererLight.setSize(window.innerWidth, window.innerHeight);
  rendererLight.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  if (containerLight) containerLight.appendChild(rendererLight.domElement);

  updateLightLayout();
}

function updateLightLayout() {
  const vFOV = THREE.Math.degToRad(cameraLight.fov);
  const dist = cameraLight.position.z;
  const height3D = 2 * Math.tan(vFOV / 2) * dist;

  lightBounds.height = height3D;
  lightBounds.top = height3D / 2;
  lightBounds.bottom = -height3D / 2;
  lightBounds.pixelScale = height3D / window.innerHeight;

  const offset3D = 80 * lightBounds.pixelScale;
  lightBounds.floorY = lightBounds.bottom + offset3D;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  cameraLight.aspect = window.innerWidth / window.innerHeight;
  cameraLight.updateProjectionMatrix();
  rendererLight.setSize(window.innerWidth, window.innerHeight);

  updateLightLayout();
  ScrollTrigger.refresh();
}
window.addEventListener("resize", onWindowResize, false);

// ==========================================
// 5. ★ 新：路徑與粒子系統 (含圓形模糊與旋轉)
// ==========================================

function parsePathToLUT(dString, steps = 1000) {
  const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathEl.setAttribute("d", dString);
  const len = pathEl.getTotalLength();
  const points = [];
  let maxY = -99999;
  let minY = 99999;

  for (let i = 0; i <= steps; i++) {
    const p = pathEl.getPointAtLength((i / steps) * len);
    points.push({ x: p.x, y: p.y });
    if (p.y > maxY) maxY = p.y;
    if (p.y < minY) minY = p.y;
  }

  const startP = pathEl.getPointAtLength(0);
  const centerX = startP.x;
  const lut = [];
  const height = maxY - minY;
  const resolution = Math.ceil(height);

  for (let i = 0; i <= resolution; i++) lut[i] = 0;

  points.forEach((p) => {
    const distFromBottom = Math.floor(maxY - p.y);
    if (distFromBottom >= 0 && distFromBottom <= resolution) {
      lut[distFromBottom] = p.x - centerX;
    }
  });

  for (let i = 1; i < lut.length; i++) {
    if (lut[i] === 0 && lut[i - 1] !== 0) lut[i] = lut[i - 1];
  }

  return { lut, height };
}

function initPathLUTs() {
  const rightData = parsePathToLUT(configBeam.pathRight);
  rightPathLUT = rightData.lut;
  const leftData = parsePathToLUT(configBeam.pathLeft);
  leftPathLUT = leftData.lut;
  pathHeight = Math.max(rightData.height, leftData.height);
}

// 產生圓形模糊貼圖的輔助函式
function createBlurryTexture(bluriness = 0.5) {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const center = size / 2;
  const radius = size / 2;

  const gradient = ctx.createRadialGradient(
    center,
    center,
    0,
    center,
    center,
    radius
  );

  const fadeStart = Math.max(0, 1 - bluriness);

  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(fadeStart, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

function createBeamSystem(cfg, type) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(cfg.count * 3);
  const initialData = [];

  for (let i = 0; i < cfg.count; i++) {
    const y = THREE.MathUtils.randFloat(
      lightBounds.floorY,
      lightBounds.top + 200
    );

    positions[i * 3] = 0;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = 0;

    // 計算隨機角度 (Spread Logic)
    const angleRandom = (Math.random() - 0.5) * ((cfg.spread * Math.PI) / 180);

    // ★ 計算隨機厚度偏移 (Thickness Logic)
    // 每個粒子固定一個 -0.5 ~ 0.5 的相對位置
    // 在 update 時再乘上 cfg.thickness，這樣調整 thickness 時粒子會縮放但相對位置不變
    const thicknessRandom = Math.random() - 0.5;

    initialData.push({
      y: y,
      speed: cfg.speed * (0.8 + Math.random() * 0.4),
      noiseOffset: Math.random() * 100,
      angleRandom: angleRandom,
      thicknessRandom: thicknessRandom, // 儲存厚度偏移量
    });
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const texture = createBlurryTexture(cfg.blur);

  const material = new THREE.PointsMaterial({
    color: new THREE.Color(cfg.color),
    size: cfg.size,
    map: texture,
    transparent: true,
    opacity: cfg.opacity,
    sizeAttenuation: true,
    blending: THREE.NormalBlending,
    depthWrite: false,
    depthTest: false,
  });

  const system = new THREE.Points(geometry, material);
  system.userData = { config: cfg, initialData: initialData, type: type };
  return system;
}

function initBeamSystem() {
  beam1System = createBeamSystem(configBeam.beam1, "straight");
  sceneLight.add(beam1System);

  beam2System = createBeamSystem(configBeam.beam2, "straight");
  sceneLight.add(beam2System);

  beam3System = createBeamSystem(configBeam.beam3, "left");
  sceneLight.add(beam3System);

  beam4System = createBeamSystem(configBeam.beam4, "left");
  sceneLight.add(beam4System);

  beam5System = createBeamSystem(configBeam.beam5, "right");
  sceneLight.add(beam5System);

  beam6System = createBeamSystem(configBeam.beam6, "right");
  sceneLight.add(beam6System);
}

// ★ 動畫更新：加入 Thickness 運算
function updateBeam(system) {
  if (!system) return;
  const positions = system.geometry.attributes.position.array;
  const data = system.userData.initialData;
  const type = system.userData.type;
  const cfg = system.userData.config;

  let currentLUT = null;
  let baseAngle = 0;

  if (type === "left") {
    currentLUT = leftPathLUT;
    baseAngle = Math.PI;
  } else if (type === "right") {
    currentLUT = rightPathLUT;
    baseAngle = 0;
  } else {
    baseAngle = 0;
  }

  const timeRotation = (cfg.rotationSpeed || 0) * time;

  for (let i = 0; i < cfg.count; i++) {
    const i3 = i * 3;
    const p = data[i];

    // 1. 移動
    p.y -= p.speed;
    if (p.y < lightBounds.floorY) {
      p.y = lightBounds.top + Math.random() * 100;
    }

    // 2. 查表半徑 (基礎位置)
    let radius = 0;
    const distFromFloor3D = p.y - lightBounds.floorY;
    const distFromFloorPx = Math.max(
      0,
      distFromFloor3D / lightBounds.pixelScale
    );

    if (type === "straight") {
      radius = 0;
    } else if (currentLUT) {
      const index = Math.floor(distFromFloorPx);
      let rawVal = 0;
      if (index < currentLUT.length) {
        rawVal = currentLUT[index];
      } else {
        rawVal = currentLUT[currentLUT.length - 1];
      }
      radius = Math.abs(rawVal) * lightBounds.pixelScale;
    }

    // ★ 3. 加上實體厚度偏移 (Thickness)
    // 這裡使用預存的隨機值 * 設定的厚度
    radius += p.thicknessRandom * (cfg.thickness || 0);

    // 4. 角度計算
    const finalAngle = baseAngle + p.angleRandom + timeRotation;

    // 5. 極座標轉直角座標
    let finalX = radius * Math.cos(finalAngle);
    let finalZ = radius * Math.sin(finalAngle);

    // 6. 噪點 (動態震動)
    const noise = Math.sin(time * 2 + p.noiseOffset) * cfg.noise;
    finalX += noise;
    finalZ += noise * 0.5;

    positions[i3] = finalX;
    positions[i3 + 1] = p.y;
    positions[i3 + 2] = finalZ;
  }

  system.geometry.attributes.position.needsUpdate = true;
}

// ==========================================
// 6. 舊粒子系統 (維持原樣)
// ==========================================
// ... (與上一版完全相同，未刪減)

function initFirstParticle() {
  const pConfig = config.firstParticle;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(pConfig.count * 3);
  const basePositions = new Float32Array(pConfig.count * 3);
  const colors = new Float32Array(pConfig.count * 3);
  const colorObj = new THREE.Color();
  for (let i = 0; i < pConfig.count; i++) {
    let i3 = i * 3;
    let t = Math.random();
    let distribution = Math.pow(t, 2);
    let pathIndex = Math.floor(distribution * (pConfig.pathLength - 1));
    let speed =
      pConfig.speedFast * (1 - distribution) + pConfig.speedSlow * distribution;
    let scatter =
      pConfig.scatterHead * (1 - distribution) +
      pConfig.scatterTail * distribution;
    const r = pConfig.sphereRadius * Math.pow(Math.random(), 0.8);
    const phi = Math.acos(-1 + (2 * i) / pConfig.count);
    const theta = Math.sqrt(pConfig.count * Math.PI) * phi;
    let bx = r * Math.cos(theta) * Math.sin(phi);
    let by = r * Math.sin(theta) * Math.sin(phi);
    basePositions[i3] = bx;
    basePositions[i3 + 1] = by;
    basePositions[i3 + 2] = 0;
    positions[i3] = bx;
    positions[i3 + 1] = by;
    positions[i3 + 2] = 0;
    firstParticleData.push({
      speed: speed,
      scatterRadius: scatter * Math.random(),
      angle: Math.random() * Math.PI * 2,
      pathIndex: pathIndex,
    });
    let distFromCenter = r / pConfig.sphereRadius;
    let lightness = 0.3 + distFromCenter * 0.4;
    colorObj.setHSL(0.6, 1.0, lightness);
    colors[i3] = colorObj.r;
    colors[i3 + 1] = colorObj.g;
    colors[i3 + 2] = colorObj.b;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.userData = { basePositions: basePositions };
  const texture = createGlowingDot();
  const material = new THREE.PointsMaterial({
    size: pConfig.size,
    map: texture,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: pConfig.opacity,
    depthWrite: false,
  });
  firstParticleSystem = new THREE.Points(geometry, material);
  scene.add(firstParticleSystem);
}
function initFirstParticleEffects() {
  if (!firstParticleSystem) return;
  gsap.to(firstParticleSystem.scale, {
    x: 4,
    y: 4,
    z: 1,
    ease: "power1.in",
    scrollTrigger: {
      trigger: "body",
      start: "500px top",
      end: "1200px top",
      scrub: 0.1,
    },
  });
  gsap.to(firstParticleSystem.material, {
    opacity: 0,
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "1100px top",
      end: "1200px top",
      scrub: 0.1,
      onLeave: () => {
        runFirst = false;
      },
      onEnterBack: () => {
        runFirst = true;
      },
    },
  });
}
function initSecondParticle() {
  const params = config.secondParticle;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(params.count * 3);
  const randomness = new Float32Array(params.count * 3);
  for (let i = 0; i < params.count; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * params.rangeXY * 2;
    positions[i3 + 1] = (Math.random() - 0.5) * params.rangeXY * 2;
    positions[i3 + 2] = (Math.random() - 0.5) * params.rangeZ * 2;
    randomness[i3] = Math.random();
    randomness[i3 + 1] = Math.random();
    randomness[i3 + 2] = Math.random();
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute(
    "aRandomness",
    new THREE.BufferAttribute(randomness, 3)
  );
  secondParticleMaterial = new THREE.ShaderMaterial({
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: false,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: params.speed },
      uRangeZ: { value: params.rangeZ },
      uSize: { value: params.size },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color(params.color) },
    },
    vertexShader: `uniform float uTime; uniform float uSpeed; uniform float uRangeZ; uniform float uSize; attribute vec3 aRandomness; varying float vAlpha; void main() { vec3 pos = position; float zOffset = uTime * uSpeed * 5.0 + aRandomness.z * 200.0; pos.z = mod(pos.z + zOffset, uRangeZ * 2.0) - uRangeZ; vec4 modelPosition = modelMatrix * vec4(pos, 1.0); vec4 viewPosition = viewMatrix * modelPosition; gl_Position = projectionMatrix * viewPosition; gl_PointSize = uSize * (1.0 / -viewPosition.z); float dist = abs(pos.z); vAlpha = smoothstep(uRangeZ, uRangeZ * 0.2, dist); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vAlpha; void main() { vec2 coord = gl_PointCoord - vec2(0.5); float dist = length(coord); if (dist > 0.5) discard; float strength = pow(1.0 - (dist * 2.0), 1.5); gl_FragColor = vec4(uColor, strength * uOpacity * vAlpha); }`,
  });
  secondParticleSystem = new THREE.Points(geometry, secondParticleMaterial);
  scene.add(secondParticleSystem);
}
function initSecondParticleEffects() {
  if (!secondParticleMaterial) return;
  gsap.fromTo(
    secondParticleMaterial.uniforms.uOpacity,
    { value: 0 },
    {
      value: 1,
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "1000px top",
        end: "1800px top",
        scrub: 0.1,
        onEnter: () => {
          runSecond = true;
        },
        onLeaveBack: () => {
          runSecond = false;
        },
      },
    }
  );
}
function initThirdParticle() {
  const params = config.thirdParticle;
  const geometry = new THREE.BufferGeometry();
  const vertexCount = params.count * 2;
  const positions = new Float32Array(vertexCount * 3);
  const randomness = new Float32Array(vertexCount * 3);
  const sides = new Float32Array(vertexCount);
  for (let i = 0; i < params.count; i++) {
    const x = (Math.random() - 0.5) * params.rangeXY * 2;
    const y = (Math.random() - 0.5) * params.rangeXY * 2;
    const z = (Math.random() - 0.5) * params.rangeZ * 2;
    const randX = Math.random();
    const randY = Math.random();
    const randZ = Math.random();
    const iHead = i * 2;
    positions[iHead * 3] = x;
    positions[iHead * 3 + 1] = y;
    positions[iHead * 3 + 2] = z;
    randomness[iHead * 3] = randX;
    randomness[iHead * 3 + 1] = randY;
    randomness[iHead * 3 + 2] = randZ;
    sides[iHead] = 0.0;
    const iTail = i * 2 + 1;
    positions[iTail * 3] = x;
    positions[iTail * 3 + 1] = y;
    positions[iTail * 3 + 2] = z;
    randomness[iTail * 3] = randX;
    randomness[iTail * 3 + 1] = randY;
    randomness[iTail * 3 + 2] = randZ;
    sides[iTail] = 1.0;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute(
    "aRandomness",
    new THREE.BufferAttribute(randomness, 3)
  );
  geometry.setAttribute("aSide", new THREE.BufferAttribute(sides, 1));
  thirdParticleMaterial = new THREE.ShaderMaterial({
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: params.speed },
      uRangeZ: { value: params.rangeZ },
      uStreakLength: { value: params.streakLength },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color(params.color) },
    },
    vertexShader: `uniform float uTime; uniform float uSpeed; uniform float uRangeZ; uniform float uStreakLength; attribute vec3 aRandomness; attribute float aSide; varying float vAlpha; void main() { vec3 pos = position; float zOffset = uTime * uSpeed * 20.0 + aRandomness.z * 2000.0; float currentZ = mod(pos.z + zOffset, uRangeZ * 2.0) - uRangeZ; if (aSide > 0.5) { float stretch = uStreakLength * (1.0 + aRandomness.x); currentZ -= stretch; vAlpha = 0.0; } else { vAlpha = 1.0; } pos.z = currentZ; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vAlpha; void main() { gl_FragColor = vec4(uColor, uOpacity * vAlpha); }`,
  });
  thirdParticleSystem = new THREE.LineSegments(geometry, thirdParticleMaterial);
  scene.add(thirdParticleSystem);
}
function initThirdParticleEffects() {
  if (!thirdParticleMaterial) return;
  gsap.fromTo(
    thirdParticleMaterial.uniforms.uOpacity,
    { value: 0 },
    {
      value: 1,
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "800px top",
        end: "1800px top",
        scrub: 0.1,
        onEnter: () => {
          runThird = true;
        },
        onLeaveBack: () => {
          runThird = false;
        },
      },
    }
  );
}
function initFourthParticle() {
  const params = config.fourthParticle;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(params.count * 3);
  const randomness = new Float32Array(params.count * 3);
  for (let i = 0; i < params.count; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.2) * params.rangeXY * 2;
    positions[i3 + 1] = (Math.random() - 0.1) * params.rangeXY * 2;
    positions[i3 + 2] = (Math.random() - 0.3) * params.rangeZ * 2;
    randomness[i3] = Math.random();
    randomness[i3 + 1] = Math.random();
    randomness[i3 + 2] = Math.random();
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute(
    "aRandomness",
    new THREE.BufferAttribute(randomness, 3)
  );
  fourthParticleMaterial = new THREE.ShaderMaterial({
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: false,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: params.speed },
      uRangeZ: { value: params.rangeZ },
      uSize: { value: params.size },
      uOpacity: { value: 1.0 },
      uColor: { value: new THREE.Color(params.color) },
      uDirection: { value: 1.0 },
      uVisibleRatio: { value: 0.0 },
      uBendFactor: { value: 0.0 },
    },
    vertexShader: `uniform float uTime; uniform float uSpeed; uniform float uRangeZ; uniform float uSize; uniform float uDirection; uniform float uVisibleRatio; uniform float uBendFactor; attribute vec3 aRandomness; varying float vAlpha; void main() { vec3 pos = position; float zOffset = uTime * uSpeed * 5.0 * uDirection + aRandomness.z * 200.0; pos.z = mod(pos.z + zOffset, uRangeZ * 2.0) - uRangeZ; float progress = (pos.z + uRangeZ) / (uRangeZ * 2.0); float lift = pow(progress, 3.0) * 2000.0 * uBendFactor; pos.y += lift; pos.x += pos.x * (lift * 0.0001) * uBendFactor; vec4 modelPosition = modelMatrix * vec4(pos, 1.0); vec4 viewPosition = viewMatrix * modelPosition; gl_Position = projectionMatrix * viewPosition; float isVisible = step(aRandomness.x, uVisibleRatio); gl_PointSize = uSize * (1.0 / -viewPosition.z) * isVisible; float dist = abs(pos.z); vAlpha = smoothstep(uRangeZ, uRangeZ * 0.2, dist); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vAlpha; void main() { vec2 coord = gl_PointCoord - vec2(0.5); float dist = length(coord); if (dist > 0.5) discard; float strength = pow(1.0 - (dist * 2.0), 1.5); gl_FragColor = vec4(uColor, strength * uOpacity * vAlpha); }`,
  });
  fourthParticleSystem = new THREE.Points(geometry, fourthParticleMaterial);
  scene.add(fourthParticleSystem);
}
function initFifthParticle() {
  const params = config.fifthParticle;
  const geometry = new THREE.BufferGeometry();
  const vertexCount = params.count * 2;
  const positions = new Float32Array(vertexCount * 3);
  const randomness = new Float32Array(vertexCount * 3);
  const sides = new Float32Array(vertexCount);
  for (let i = 0; i < params.count; i++) {
    const x = (Math.random() - 0.5) * params.rangeXY * 2;
    const y = (Math.random() - 0.5) * params.rangeXY * 2;
    const z = (Math.random() - 0.5) * params.rangeZ * 2;
    const randX = Math.random();
    const randY = Math.random();
    const randZ = Math.random();
    const iHead = i * 2;
    positions[iHead * 3] = x;
    positions[iHead * 3 + 1] = y;
    positions[iHead * 3 + 2] = z;
    randomness[iHead * 3] = randX;
    randomness[iHead * 3 + 1] = randY;
    randomness[iHead * 3 + 2] = randZ;
    sides[iHead] = 0.0;
    const iTail = i * 2 + 1;
    positions[iTail * 3] = x;
    positions[iTail * 3 + 1] = y;
    positions[iTail * 3 + 2] = z;
    randomness[iTail * 3] = randX;
    randomness[iTail * 3 + 1] = randY;
    randomness[iTail * 3 + 2] = randZ;
    sides[iTail] = 1.0;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute(
    "aRandomness",
    new THREE.BufferAttribute(randomness, 3)
  );
  geometry.setAttribute("aSide", new THREE.BufferAttribute(sides, 1));
  fifthParticleMaterial = new THREE.ShaderMaterial({
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: params.speed },
      uRangeZ: { value: params.rangeZ },
      uStreakLength: { value: params.streakLength },
      uOpacity: { value: 1.0 },
      uColor: { value: new THREE.Color(params.color) },
      uDirection: { value: 1.0 },
      uVisibleRatio: { value: 0.0 },
      uBendFactor: { value: 0.0 },
    },
    vertexShader: `uniform float uTime; uniform float uSpeed; uniform float uRangeZ; uniform float uStreakLength; uniform float uDirection; uniform float uVisibleRatio; uniform float uBendFactor; attribute vec3 aRandomness; attribute float aSide; varying float vAlpha; void main() { vec3 pos = position; float zOffset = uTime * uSpeed * 20.0 * uDirection + aRandomness.z * 2000.0; float currentZ = mod(pos.z + zOffset, uRangeZ * 2.0) - uRangeZ; if (aSide > 0.5) { float stretch = uStreakLength * (1.0 + aRandomness.x) * uDirection; currentZ -= stretch; vAlpha = 0.0; } else { vAlpha = 1.0; } pos.z = currentZ; float progress = (pos.z + uRangeZ) / (uRangeZ * 2.0); float lift = pow(progress, 3.0) * 30000.0 * uBendFactor; pos.y += lift; pos.x += pos.x * (lift * 0.0001) * uBendFactor; if(aRandomness.x > uVisibleRatio) { pos = vec3(999999.0); } gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vAlpha; void main() { gl_FragColor = vec4(uColor, uOpacity * vAlpha); }`,
  });
  fifthParticleSystem = new THREE.LineSegments(geometry, fifthParticleMaterial);
  scene.add(fifthParticleSystem);
}
function initCompetenciesEffects() {
  const aboutWrapper = document.querySelector(".about-wrapper-outer");
  const spacer1 = document.querySelector(".competencies-spacer-1");
  const background2 = document.querySelector(".background-layer-2");
  if (!aboutWrapper || !spacer1) return;
  if (!fourthParticleMaterial || !fifthParticleMaterial) return;
  ScrollTrigger.create({
    trigger: aboutWrapper,
    start: "top -25%",
    end: "top -145%",
    scrub: 0.1,
    onEnter: () => {
      runFourth = true;
      runFifth = true;
    },
    onUpdate: (self) => {
      const p = self.progress;
      let ratio = THREE.MathUtils.clamp(p / 0.72, 0, 1);
      fourthParticleMaterial.uniforms.uVisibleRatio.value = ratio;
      fifthParticleMaterial.uniforms.uVisibleRatio.value = ratio;
      if (ratio < 0.375) {
        fourthParticleMaterial.uniforms.uSpeed.value =
          config.fourthParticle.speed;
      } else {
        let speedProgress = (ratio - 0.375) / (1.0 - 0.375);
        let newSpeed =
          config.fourthParticle.speed +
          speedProgress *
            (config.fourthParticle.maxSpeed - config.fourthParticle.speed);
        fourthParticleMaterial.uniforms.uSpeed.value = newSpeed;
      }
      if (ratio < 0.2) {
        fifthParticleMaterial.uniforms.uSpeed.value =
          config.fifthParticle.speed;
      } else {
        let speedProgress = (ratio - 0.2) / (1.0 - 0.2);
        let newSpeed =
          config.fifthParticle.speed +
          speedProgress *
            (config.fifthParticle.maxSpeed - config.fifthParticle.speed);
        fifthParticleMaterial.uniforms.uSpeed.value = newSpeed;
      }
      let fadeOut = 1.0 - p;
      if (secondParticleMaterial)
        secondParticleMaterial.uniforms.uOpacity.value = fadeOut;
      if (thirdParticleMaterial)
        thirdParticleMaterial.uniforms.uOpacity.value = fadeOut;
    },
    onLeave: () => {
      runSecond = false;
      runThird = false;
      if (secondParticleMaterial)
        secondParticleMaterial.uniforms.uOpacity.value = 0;
      if (thirdParticleMaterial)
        thirdParticleMaterial.uniforms.uOpacity.value = 0;
    },
    onEnterBack: () => {
      runSecond = true;
      runThird = true;
    },
    onLeaveBack: () => {
      runFourth = false;
      runFifth = false;
      fourthParticleMaterial.uniforms.uVisibleRatio.value = 0;
      fifthParticleMaterial.uniforms.uVisibleRatio.value = 0;
      fourthParticleMaterial.uniforms.uBendFactor.value = 0;
      fifthParticleMaterial.uniforms.uBendFactor.value = 0;
    },
  });
  ScrollTrigger.create({
    trigger: spacer1,
    start: "top -180px",
    end: "top -880px",
    scrub: 0.1,
    onUpdate: (self) => {
      const ratio = 1.0 - self.progress;
      fourthParticleMaterial.uniforms.uVisibleRatio.value = ratio;
      fifthParticleMaterial.uniforms.uVisibleRatio.value = ratio;
      fourthParticleMaterial.uniforms.uOpacity.value = 1.0;
      fifthParticleMaterial.uniforms.uOpacity.value = 1.0;
    },
  });
  ScrollTrigger.create({
    trigger: spacer1,
    start: "top 97%",
    end: "top -160px",
    scrub: 0.1,
    onUpdate: (self) => {
      const p = self.progress;
      fourthParticleMaterial.uniforms.uBendFactor.value = p;
      fifthParticleMaterial.uniforms.uBendFactor.value = p;
    },
    onLeaveBack: () => {
      fourthParticleMaterial.uniforms.uBendFactor.value = 0;
      fifthParticleMaterial.uniforms.uBendFactor.value = 0;
    },
  });
  if (background2) {
    gsap.to(background2, {
      opacity: 1,
      ease: "none",
      scrollTrigger: {
        trigger: spacer1,
        start: "top 370",
        end: "top -400px",
        scrub: 0.1,
      },
    });
  }
}
function initTunnelEffects() {
  const walls = [
    { el: ".wall-1", start: 700, out: 1400, end: 1500, x: 60, y: 10 },
    { el: ".wall-2", start: 700, out: 1600, end: 1700, x: -60, y: 20 },
    { el: ".wall-3", start: 700, out: 1800, end: 1900, x: 40, y: -20 },
    { el: ".wall-4", start: 720, out: 2000, end: 2100, x: -20, y: -50 },
    { el: ".wall-5", start: 720, out: 2000, end: 2150, x: 10, y: 50 },
  ];
  walls.forEach((w) => {
    const element = document.querySelector(w.el);
    if (!element) return;
    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: "body",
        start: `${w.start}px top`,
        end: `${w.end}px top`,
        scrub: 0.5,
      },
    });
    tl.to(element, {
      scale: 1,
      opacity: 1,
      x: `${w.x * 0.3}vw`,
      y: `${w.y * 0.3}vh`,
      duration: w.out - w.start,
      ease: "power1.in",
    }).to(element, {
      scale: 3,
      opacity: 0,
      x: `${w.x}vw`,
      y: `${w.y}vh`,
      duration: w.end - w.out,
      ease: "power1.in",
    });
  });
}
function initAboutEffects() {
  const outerWrapper = document.querySelector(".about-wrapper-outer");
  const innerContent = document.querySelector(".about-content-inner");
  if (!outerWrapper || !innerContent) return;
  gsap.set(innerContent, { scale: 0.1, opacity: 0 });
  let tl = gsap.timeline({
    scrollTrigger: {
      trigger: outerWrapper,
      start: "top top",
      end: "+=1200",
      pin: true,
      scrub: 0.5,
      anticipatePin: 1,
    },
  });
  tl.to(innerContent, { scale: 1, opacity: 1, ease: "power2.out" });
}
function initTextEffects() {
  const heroContainer = document.querySelector(".hero-container");
  const heroSection = document.querySelector(".hero-section");
  if (heroContainer) {
    gsap.set(heroContainer, { transformOrigin: "center center" });
    gsap.to(heroContainer, {
      scale: 50,
      opacity: 0,
      ease: "power2.in",
      scrollTrigger: {
        trigger: "body",
        start: "680px top",
        end: "2400px top",
        scrub: 0.1,
      },
    });
  }
  if (heroSection) {
    gsap.to(heroSection, {
      autoAlpha: 0,
      scrollTrigger: {
        trigger: "body",
        start: "1000px top",
        toggleActions: "play none none reverse",
      },
    });
  }
}

// ==========================================
// 9. 動畫渲染迴圈
// ==========================================
function animate() {
  requestAnimationFrame(animate);
  time += 0.015;

  // 舊粒子
  if (runFirst) updateFirstParticlePhysics();
  if (runSecond && secondParticleMaterial)
    secondParticleMaterial.uniforms.uTime.value = time;
  if (runThird && thirdParticleMaterial)
    thirdParticleMaterial.uniforms.uTime.value = time;
  if (runFourth && fourthParticleMaterial)
    fourthParticleMaterial.uniforms.uTime.value = time;
  if (runFifth && fifthParticleMaterial)
    fifthParticleMaterial.uniforms.uTime.value = time;

  // ★ 更新光束 (6組獨立更新)
  if (beam1System) updateBeam(beam1System);
  if (beam2System) updateBeam(beam2System);
  if (beam3System) updateBeam(beam3System);
  if (beam4System) updateBeam(beam4System);
  if (beam5System) updateBeam(beam5System);
  if (beam6System) updateBeam(beam6System);

  renderer.render(scene, camera);
  rendererLight.render(sceneLight, cameraLight);
}

function updateFirstParticlePhysics() {
  if (!firstParticleSystem) return;
  const isScrollUnbound = window.scrollY > 680;
  let targetPoint =
    isIdle || isScrollUnbound ? new THREE.Vector3(0, 0, 0) : mouse3DVec;
  if (!isScrollUnbound) {
    mousePath.unshift(targetPoint.clone());
    if (mousePath.length > config.firstParticle.pathLength) mousePath.pop();
  }
  const positions = firstParticleSystem.geometry.attributes.position.array;
  const basePositions = firstParticleSystem.geometry.userData.basePositions;
  const pConfig = config.firstParticle;
  for (let i = 0; i < pConfig.count; i++) {
    let i3 = i * 3;
    let pData = firstParticleData[i];
    let cx = positions[i3];
    let cy = positions[i3 + 1];
    let tx, ty, s;
    if (isIdle || isScrollUnbound) {
      let bx = basePositions[i3];
      let by = basePositions[i3 + 1];
      let dist = Math.sqrt(bx * bx + by * by);
      let ripple = Math.sin(
        time * pConfig.rippleSpeed - dist * pConfig.rippleFrequency
      );
      let scale = (dist + ripple * pConfig.rippleIntensity) / dist;
      tx = bx * scale;
      ty = by * scale;
      s = pConfig.returnSpeed;
    } else {
      let targetIndex = Math.min(pData.pathIndex, mousePath.length - 1);
      let pathPos = mousePath[targetIndex] || mousePath[0];
      let ox = Math.cos(pData.angle) * pData.scatterRadius;
      let oy = Math.sin(pData.angle) * pData.scatterRadius;
      tx = pathPos.x + ox;
      ty = pathPos.y + oy;
      s = pData.speed;
    }
    positions[i3] += (tx - cx) * s;
    positions[i3 + 1] += (ty - cy) * s;
    positions[i3 + 2] = 0;
  }
  firstParticleSystem.geometry.attributes.position.needsUpdate = true;
}
function onMouseMove(event) {
  event.preventDefault();
  let x = (event.clientX / window.innerWidth) * 2 - 1;
  let y = -(event.clientY / window.innerHeight) * 2 + 1;
  let vector = new THREE.Vector3(x, y, 0.5);
  vector.unproject(camera);
  let dir = vector.sub(camera.position).normalize();
  let distance = -camera.position.z / dir.z;
  let pos = camera.position.clone().add(dir.multiplyScalar(distance));
  mouse3DVec.copy(pos);
  mouse3DVec.z = 0;
  isIdle = false;
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    isIdle = true;
  }, config.firstParticle.idleTimeout);
}
function createGlowingDot() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  const center = size / 2;
  const gradient = context.createRadialGradient(
    center,
    center,
    0,
    center,
    center,
    center
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.3, "rgba(43, 152, 211, 0.5)");
  gradient.addColorStop(1, "rgba(28, 178, 153, .03)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}
