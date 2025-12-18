// --- 參數設定 ---
const config = {
  particleCount: 150000,    // 粒子總數
  
  // --- 1. 視覺修正 (海藍色核心) ---
  hue: 0.6,                // 0.6 = 正藍色
  baseSize: 4.4,           // 粒子大小 (稍微調大一點點，補償深色帶來的視覺縮小)
  baseOpacity: 0.7,        // 透明度
  
  // --- 2. 軌跡設定 (貪食蛇路徑) ---
  pathLength: 90,         // 軌跡長度
  
  // 速度設定
  speedFast: 0.6,          // 頭部緊跟
  speedSlow: 0.3,         // 尾巴拖曳
  
  // 擴散設定
  scatterHead: 1,          // 頭部集中
  scatterTail: 300,        // 尾巴擴散
  
  // --- 3. 靜止光球設定 ---
  sphereRadius: 400, //光球範圍
  idleTimeout: 800,
  returnSpeed: .02,
  
  // 漣漪效果
  rippleIntensity: 255,     
  rippleSpeed: 1.7,        
  rippleFrequency: 0.026,   
};

// --- 變數宣告 ---
let scene, camera, renderer, particleSystem;
let container = document.getElementById('canvas-container');
let particlesData = []; 

// 狀態管理
let mouse = new THREE.Vector2(9999, 9999);
let mouse3DVec = new THREE.Vector3(0, 0, 0); 
let isIdle = true;
let idleTimer = null;
let time = 0;

// 路徑記憶
let mousePath = []; 

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
  camera.position.z = 750; 

  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.autoClear = false; 
  container.appendChild(renderer.domElement);

  // 初始化路徑
  for(let i=0; i<config.pathLength; i++) {
    mousePath.push(new THREE.Vector3(0,0,0));
  }

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(config.particleCount * 3);
  const basePositions = new Float32Array(config.particleCount * 3);
  const colors = new Float32Array(config.particleCount * 3);
  const colorObj = new THREE.Color();

  for (let i = 0; i < config.particleCount; i++) {
    let i3 = i * 3;
    let t = Math.random(); 
    
    // 分佈曲線
    let distribution = Math.pow(t, 2); 

    // 計算軌跡索引
    let pathIndex = Math.floor(distribution * (config.pathLength - 1));

    let speed = config.speedFast * (1 - distribution) + config.speedSlow * distribution;
    let scatter = config.scatterHead * (1 - distribution) + config.scatterTail * distribution;

    // --- 光球座標 ---
    const r = config.sphereRadius * Math.pow(Math.random(), 0.8); 
    const phi = Math.acos(-1 + (2 * i) / config.particleCount);
    const theta = Math.sqrt(config.particleCount * Math.PI) * phi;

    let bx = r * Math.cos(theta) * Math.sin(phi);
    let by = r * Math.sin(theta) * Math.sin(phi);
    let bz = r * Math.cos(phi);

    basePositions[i3] = bx;
    basePositions[i3+1] = by;
    basePositions[i3+2] = bz;
    positions[i3] = bx;
    positions[i3+1] = by;
    positions[i3+2] = bz;

    particlesData.push({
      speed: speed,
      scatterRadius: scatter * Math.random(), 
      angle: Math.random() * Math.PI * 2,
      pathIndex: pathIndex 
    });

    // --- 關鍵修改：海藍色核心 ---
    let distFromCenter = r / config.sphereRadius; // 0 = 中心, 1 = 邊緣
    
    // HSL 設定：
    // 色相 (Hue): 0.6 (藍色)
    // 飽和度 (Sat): 1.0 (最鮮豔)
    // 亮度 (Light): 
    //    中心 (0.0) -> 0.3 (深海藍) <-- 這裡改暗了
    //    邊緣 (1.0) -> 0.7 (亮青藍)
    let lightness = 0.3 + (distFromCenter * 0.4); 
    
    colorObj.setHSL(config.hue, 1.0, lightness); 
    
    colors[i3] = colorObj.r;
    colors[i3+1] = colorObj.g;
    colors[i3+2] = colorObj.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.userData = { basePositions: basePositions };

  const texture = createGlowingDot();
  const material = new THREE.PointsMaterial({
    size: config.baseSize,
    map: texture,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: config.baseOpacity,
    depthWrite: false
  });

  particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);

  document.addEventListener('mousemove', onMouseMove, false);
  document.addEventListener('mouseout', () => {
     if(idleTimer) clearTimeout(idleTimer);
     idleTimer = setTimeout(() => { isIdle = true; }, 100);
  }, false);
  window.addEventListener('resize', onWindowResize, false);
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
  isIdle = false;
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { isIdle = true; }, config.idleTimeout);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  const positions = particleSystem.geometry.attributes.position.array;
  const basePositions = particleSystem.geometry.userData.basePositions;
  time += 0.015; 

  // 更新路徑
  let targetPoint = isIdle ? new THREE.Vector3(0,0,0) : mouse3DVec;
  if (!isIdle) {
      mousePath.unshift(targetPoint.clone());
      if (mousePath.length > config.pathLength) {
        mousePath.pop();
      }
  }

  for (let i = 0; i < config.particleCount; i++) {
    let i3 = i * 3;
    let pData = particlesData[i];
    let cx = positions[i3];
    let cy = positions[i3+1];
    let cz = positions[i3+2];
    let tx, ty, tz, s;

    if (isIdle) {
      // --- 閒置光球 ---
      let bx = basePositions[i3];
      let by = basePositions[i3+1];
      let bz = basePositions[i3+2];
      
      let dist = Math.sqrt(bx*bx + by*by + bz*bz);
      let ripple = Math.sin(time * config.rippleSpeed - dist * config.rippleFrequency);
      let scale = (dist + ripple * config.rippleIntensity) / dist;
      
      tx = bx * scale;
      ty = by * scale;
      tz = bz * scale;
      s = config.returnSpeed;
    } else {
      // --- 軌跡跟隨 ---
      let targetIndex = Math.min(pData.pathIndex, mousePath.length - 1);
      let pathPos = mousePath[targetIndex];

      let ox = Math.cos(pData.angle) * pData.scatterRadius;
      let oy = Math.sin(pData.angle) * pData.scatterRadius;
      
      tx = pathPos.x + ox;
      ty = pathPos.y + oy;
      tz = 0;
      s = pData.speed;
    }

    positions[i3]   += (tx - cx) * s;
    positions[i3+1] += (ty - cy) * s;
    positions[i3+2] += (tz - cz) * s;
  }

  particleSystem.geometry.attributes.position.needsUpdate = true;

  if (isIdle) {
    particleSystem.rotation.y += 0.003;
    particleSystem.rotation.z = Math.sin(time * 0.2) * 0.05; 
  } else {
    particleSystem.rotation.y *= 0.92;
    particleSystem.rotation.z *= 0.92;
  }

  renderer.render(scene, camera);
}

// --- 貼圖產生器 ---
function createGlowingDot() {
  const size = 64; 
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const center = size / 2;
  
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  // 核心微調：保持一定透明度，避免死白
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)'); 
  gradient.addColorStop(0.5, 'rgba(180, 220, 255, 0.5)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); 
  
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}