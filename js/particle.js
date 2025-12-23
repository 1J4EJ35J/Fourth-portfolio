// js/particle.js

// 全域變數：控制隧道模式
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

// --- 變數宣告 ---
let scene, camera, renderer, particleSystem;
let container = document.getElementById('canvas-container');
let particlesData = [];
let mouse = new THREE.Vector2(9999, 9999);
let mouse3DVec = new THREE.Vector3(0, 0, 0);
let isIdle = true;
let idleTimer = null;
let time = 0;
let mousePath = [];

// --- 程式入口點 ---
init();
initScrollAnimation();
animate();


// --- 滾動動畫邏輯 (修正版) ---
function initScrollAnimation() {
    console.log("🚀 初始化滾動監聽 (Fixed Position Version)...");

    const heroSection = document.querySelector('.hero-section');
    const heroLeft = document.querySelector('.hero-left');
    const heroRight = document.querySelector('.hero-right');
    const tunnelEffect = document.getElementById('tunnel-effect');
    const aboutSection = document.getElementById('about');
    const canvasContainer = document.getElementById('canvas-container');

    if (!heroSection || !tunnelEffect || !aboutSection) {
        console.error("❌ 找不到必要元素，請檢查 HTML");
        return;
    }

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // ==========================================
        // 1. Hero 散射 (0px ~ 800px)
        // ==========================================
        const scatterRange = 800;
        
        if (scrollY >= 0) {
            // 計算進度 0 ~ 1
            let p = Math.min(Math.max(scrollY / scatterRange, 0), 1);
            
            // 動作設定：
            // moveX: 往外推 100vw (保證飛出螢幕)
            // scale: 放大到 4 倍
            // opacity: 慢慢變透明
            const moveX = p * 100; 
            const scale = 1 + (p * 3);
            const opacity = 1 - p;

            if (heroLeft && heroRight) {
                // 【關鍵修正】Y 軸設為 0，因為 CSS position:fixed 已經幫我們定好位了
                heroLeft.style.transform = `translate3d(-${moveX}vw, 0, 0) scale(${scale})`;
                heroLeft.style.opacity = opacity;
                // 避免看不見時誤觸
                heroLeft.style.pointerEvents = p > 0.9 ? 'none' : 'auto';

                heroRight.style.transform = `translate3d(${moveX}vw, 0, 0) scale(${scale})`;
                heroRight.style.opacity = opacity;
                heroRight.style.pointerEvents = p > 0.9 ? 'none' : 'auto';
            }
        }

        // ==========================================
        // 2. Hero區塊淡出與隱藏 (800px ~ 900px)
        // ==========================================
        // 當文字飛走後，讓整個 hero section 消失，避免擋到底下的連結
        if (scrollY > 900) {
            heroSection.style.display = 'none';
        } else if (scrollY > 800) {
            heroSection.style.display = 'flex';
            heroSection.style.opacity = 1 - ((scrollY - 800) / 100);
        } else {
            heroSection.style.display = 'flex';
            heroSection.style.opacity = 1;
        }

        // ==========================================
        // 3. 隧道模式切換 & 光壁淡入 (700px ~ )
        // ==========================================
        // 進入隧道模式 (改變粒子物理)
        if (scrollY > 700) {
            if (!isTunnelMode) isTunnelMode = true;
        } else {
            if (isTunnelMode) isTunnelMode = false;
        }

        // 隧道光壁顯示 (700px ~ 1200px 淡入)
        if (scrollY > 700) {
            let tunnelP = (scrollY - 700) / 500;
            tunnelEffect.style.opacity = Math.min(Math.max(tunnelP, 0), 1);
        } else {
            tunnelEffect.style.opacity = 0;
        }

        // ==========================================
        // 4. About Me 淡入 & 粒子淡出 (1800px ~ 2500px)
        // ==========================================
        const aboutStart = 1800;
        const aboutEnd = 2500;
        const aboutRange = aboutEnd - aboutStart;

        if (scrollY > aboutStart) {
            let p = (scrollY - aboutStart) / aboutRange;
            p = Math.min(Math.max(p, 0), 1);

            // About Me 出現
            aboutSection.style.opacity = p;
            aboutSection.style.transform = `scale(${0.8 + (p * 0.2)})`; // 0.8 -> 1.0

            // 粒子特效淡出 (避免干擾閱讀)
            if (canvasContainer) {
                canvasContainer.style.opacity = 1 - p;
            }
        } else {
            aboutSection.style.opacity = 0;
            aboutSection.style.transform = `scale(0.8)`;
            if (canvasContainer) canvasContainer.style.opacity = 1;
        }
    });
}


// --- 粒子系統 (保持之前版本，包含隧道物理) ---
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

    // === 狀態機 ===
    if (isTunnelMode) {
        // 隧道模式：向外炸開 + 彎曲
        let bx = basePositions[i3];
        let by = basePositions[i3+1];
        let dist = Math.sqrt(bx*bx + by*by);
        
        // 往外推
        let pushX = (bx / dist) * 1000; 
        let pushY = (by / dist) * 1000;

        tx = pushX;
        ty = pushY;
        // 彎曲
        tx += Math.sin(time * 0.5) * 200; 
        
        tz = 0; 
        s = 0.02;

    } else if (isIdle) {
      // 閒置模式
      let bx = basePositions[i3]; let by = basePositions[i3+1]; let bz = basePositions[i3+2];
      let dist = Math.sqrt(bx*bx + by*by + bz*bz);
      let ripple = Math.sin(time * config.rippleSpeed - dist * config.rippleFrequency);
      let scale = (dist + ripple * config.rippleIntensity) / dist;
      tx = bx * scale; ty = by * scale; tz = bz * scale;
      s = config.returnSpeed;

    } else {
      // 滑鼠跟隨
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

  // 旋轉
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

// ... (init, onMouseMove 等輔助函數保持原樣即可) ...
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