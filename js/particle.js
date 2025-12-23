// js/particle.js

// 全域變數
let isTunnelMode = false;

// --- 參數設定 ---
const config = {
  particleCount: 150000,
  hue: 0.6,
  baseSize: 4.4,
  baseOpacity: 0.7,
  pathLength: 90,
  speedFast: 0.6,
  speedSlow: 0.3,
  scatterHead: 1,
  scatterTail: 300,
  sphereRadius: 400,
  idleTimeout: 800,
  returnSpeed: .02,
  rippleIntensity: 255,
  rippleSpeed: 1.7,
  rippleFrequency: 0.026,
};

let scene, camera, renderer, particleSystem;
let container = document.getElementById('canvas-container');
let particlesData = [];
let mouse = new THREE.Vector2(9999, 9999);
let mouse3DVec = new THREE.Vector3(0, 0, 0);
let isIdle = true;
let idleTimer = null;
let time = 0;
let mousePath = [];

// --- 程式入口 ---
init();
initScrollAnimation();
animate();

// --- 滾動動畫邏輯 (最關鍵的部分) ---
function initScrollAnimation() {
    console.log("🚀 動畫監聽啟動中...");

    const heroSection = document.querySelector('.hero-section');
    const heroLeft = document.querySelector('.hero-left');
    const heroRight = document.querySelector('.hero-right');
    const tunnelEffect = document.getElementById('tunnel-effect');
    const aboutSection = document.getElementById('about');
    const canvasContainer = document.getElementById('canvas-container');

    // 檢查元素是否存在
    if (!aboutSection) console.error("❌ 找不到 #about 區塊！");
    if (!tunnelEffect) console.error("❌ 找不到 #tunnel-effect！");

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        // console.log("目前捲動高度:", scrollY); // 測試用，您可以打開來看數值有沒有跑

        // 1. Hero 散射 (0 ~ 800px)
        if (scrollY >= 0) {
            let p = Math.min(Math.max(scrollY / 800, 0), 1);
            const moveX = p * 100; 
            const scale = 1 + (p * 3);
            const opacity = 1 - p;

            if (heroLeft && heroRight) {
                heroLeft.style.transform = `translate3d(-${moveX}vw, 0, 0) scale(${scale})`;
                heroLeft.style.opacity = opacity;
                heroRight.style.transform = `translate3d(${moveX}vw, 0, 0) scale(${scale})`;
                heroRight.style.opacity = opacity;
            }
        }

        // 2. Hero 區塊淡出 (800 ~ 900px)
        if (scrollY > 900) {
            heroSection.style.display = 'none';
        } else if (scrollY > 800) {
            heroSection.style.display = 'flex';
            heroSection.style.opacity = 1 - ((scrollY - 800) / 100);
        } else {
            heroSection.style.display = 'flex';
            heroSection.style.opacity = 1;
        }

        // 3. 隧道模式 (700px ~ )
        if (scrollY > 700) {
            if (!isTunnelMode) isTunnelMode = true;
            // 隧道光壁顯示
            let tunnelP = (scrollY - 700) / 500;
            if(tunnelEffect) tunnelEffect.style.opacity = Math.min(Math.max(tunnelP, 0), 1);
        } else {
            if (isTunnelMode) isTunnelMode = false;
            if(tunnelEffect) tunnelEffect.style.opacity = 0;
        }

        // 4. About Me 出現 (1500px ~ )
        // 只要捲動超過 1500，就開始淡入 About Me
        const aboutTrigger = 1500;
        const aboutComplete = 2200;
        
        if (scrollY > aboutTrigger) {
            let p = (scrollY - aboutTrigger) / (aboutComplete - aboutTrigger);
            p = Math.min(Math.max(p, 0), 1);

            if(aboutSection) {
                aboutSection.style.opacity = p;
                aboutSection.style.transform = `scale(${0.8 + (p * 0.2)})`;
                aboutSection.style.pointerEvents = "auto"; // 出現後允許滑鼠互動
            }
            
            // 粒子淡出
            if (canvasContainer) canvasContainer.style.opacity = 1 - p;
        } else {
            if(aboutSection) {
                aboutSection.style.opacity = 0;
                aboutSection.style.transform = `scale(0.8)`;
                aboutSection.style.pointerEvents = "none";
            }
            if (canvasContainer) canvasContainer.style.opacity = 1;
        }
    });
}

// --- 粒子系統 (保持不變) ---
function animate() {
  requestAnimationFrame(animate);
  time += 0.015;

  let targetPoint = (isIdle || isTunnelMode) ? new THREE.Vector3(0,0,0) : mouse3DVec;
  if (!isTunnelMode) {
      mousePath.unshift(targetPoint.clone());
      if (mousePath.length > config.pathLength) mousePath.pop();
  }

  const positions = particleSystem.geometry.attributes.position.array;
  const basePositions = particleSystem.geometry.userData.basePositions;

  for (let i = 0; i < config.particleCount; i++) {
    let i3 = i * 3;
    let pData = particlesData[i];
    let cx = positions[i3]; let cy = positions[i3+1]; let cz = positions[i3+2];
    let tx, ty, tz, s;

    if (isTunnelMode) {
        let bx = basePositions[i3]; let by = basePositions[i3+1];
        let dist = Math.sqrt(bx*bx + by*by);
        let pushX = (bx / dist) * 1000; 
        let pushY = (by / dist) * 1000;
        tx = pushX + Math.sin(time * 0.5) * 200;
        ty = pushY;
        tz = 0; 
        s = 0.02;
    } else if (isIdle) {
      let bx = basePositions[i3]; let by = basePositions[i3+1]; let bz = basePositions[i3+2];
      let dist = Math.sqrt(bx*bx + by*by + bz*bz);
      let ripple = Math.sin(time * config.rippleSpeed - dist * config.rippleFrequency);
      let scale = (dist + ripple * config.rippleIntensity) / dist;
      tx = bx * scale; ty = by * scale; tz = bz * scale;
      s = config.returnSpeed;
    } else {
      let targetIndex = Math.min(pData.pathIndex, mousePath.length - 1);
      let pathPos = mousePath[targetIndex] || mousePath[0];
      let ox = Math.cos(pData.angle) * pData.scatterRadius;
      let oy = Math.sin(pData.angle) * pData.scatterRadius;
      tx = pathPos.x + ox; ty = pathPos.y + oy; tz = 0;
      s = pData.speed;
    }
    positions[i3] += (tx - cx) * s;
    positions[i3+1] += (ty - cy) * s;
    positions[i3+2] += (tz - cz) * s;
  }
  particleSystem.geometry.attributes.position.needsUpdate = true;

  if (isTunnelMode) {
      particleSystem.rotation.z += 0.001; 
      particleSystem.rotation.y *= 0.95; 
  } else if (isIdle) {
    particleSystem.rotation.y += 0.003;
    particleSystem.rotation.z = Math.sin(time * 0.2) * 0.05; 
  } else {
    particleSystem.rotation.y *= 0.92;
    particleSystem.rotation.z *= 0.92;
  }
  renderer.render(scene, camera);
}

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
  camera.position.z = 750;
  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.autoClear = false;
  container.appendChild(renderer.domElement);
  
  for(let i=0; i<config.pathLength; i++) mousePath.push(new THREE.Vector3(0,0,0));

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(config.particleCount * 3);
  const basePositions = new Float32Array(config.particleCount * 3);
  const colors = new Float32Array(config.particleCount * 3);
  const colorObj = new THREE.Color();

  for (let i = 0; i < config.particleCount; i++) {
    let i3 = i * 3;
    let t = Math.random();
    let distribution = Math.pow(t, 2);
    let pathIndex = Math.floor(distribution * (config.pathLength - 1));
    let speed = config.speedFast * (1 - distribution) + config.speedSlow * distribution;
    let scatter = config.scatterHead * (1 - distribution) + config.scatterTail * distribution;

    const r = config.sphereRadius * Math.pow(Math.random(), 0.8);
    const phi = Math.acos(-1 + (2 * i) / config.particleCount);
    const theta = Math.sqrt(config.particleCount * Math.PI) * phi;
    let bx = r * Math.cos(theta) * Math.sin(phi);
    let by = r * Math.sin(theta) * Math.sin(phi);
    let bz = r * Math.cos(phi);
    basePositions[i3] = bx; basePositions[i3+1] = by; basePositions[i3+2] = bz;
    positions[i3] = bx; positions[i3+1] = by; positions[i3+2] = bz;

    particlesData.push({ speed: speed, scatterRadius: scatter * Math.random(), angle: Math.random() * Math.PI * 2, pathIndex: pathIndex });

    let distFromCenter = r / config.sphereRadius;
    let lightness = 0.3 + (distFromCenter * 0.4);
    colorObj.setHSL(config.hue, 1.0, lightness);
    colors[i3] = colorObj.r; colors[i3+1] = colorObj.g; colors[i3+2] = colorObj.b;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.userData = { basePositions: basePositions };

  const texture = createGlowingDot();
  const material = new THREE.PointsMaterial({ size: config.baseSize, map: texture, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, opacity: config.baseOpacity, depthWrite: false });
  particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);
  document.addEventListener('mousemove', onMouseMove, false);
  document.addEventListener('mouseout', () => { if(idleTimer) clearTimeout(idleTimer); idleTimer = setTimeout(() => { isIdle = true; }, 100); }, false);
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
function onWindowResize() { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }
function createGlowingDot() { const size = 64; const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size; const context = canvas.getContext('2d'); const center = size / 2; const gradient = context.createRadialGradient(center, center, 0, center, center, center); gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)'); gradient.addColorStop(0.5, 'rgba(180, 220, 255, 0.5)'); gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); context.fillStyle = gradient; context.fillRect(0, 0, size, size); return new THREE.CanvasTexture(canvas); }