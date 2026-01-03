// js/particle.js

// 註冊 GSAP ScrollTrigger (給網頁特效用)
gsap.registerPlugin(ScrollTrigger);


// ==========================================
// 1. 全域變數宣告
// ==========================================

// --- System A: 舊背景粒子 (維持原樣，不動) ---
let scene;
let camera;
let renderer;
let container = document.getElementById('canvas-container');

let firstParticleSystem, secondParticleSystem, secondParticleMaterial;
let thirdParticleSystem, thirdParticleMaterial;
let fourthParticleSystem, fourthParticleMaterial;
let fifthParticleSystem, fifthParticleMaterial;

// --- System B: 光束粒子 (全新獨立系統) ---
let sceneLight;
let cameraLight; // 獨立攝影機
let rendererLight;
let containerLight = document.getElementById('canvas-container-light');

// 光束粒子物件
let beamArm1; // 螺旋臂 1
let beamArm2; // 螺旋臂 2

// 螢幕邊界計算 (用於對齊 Top 0 和 Floor)
let lightBounds = { top: 0, bottom: 0, height: 0 };


// --- 共用互動與計時變數 ---
let time = 0;
let runFirst = true;
let runSecond = false;
let runThird = false;
let runFourth = false;
let runFifth = false;

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
    // 舊背景粒子參數 (保持不動)
    firstParticle: { count: 150000, color: 0x008cff, size: 4.4, opacity: 0.7, pathLength: 90, speedFast: 0.6, speedSlow: 0.3, scatterHead: 1, scatterTail: 200, sphereRadius: 800, idleTimeout: 800, returnSpeed: 0.02, rippleIntensity: 255, rippleSpeed: 1.7, rippleFrequency: 0.026 },
    secondParticle: { count: 4000, rangeZ: 1600, rangeXY: 2500, speed: 20.0, size: 2800.0 * window.devicePixelRatio, color: '#008cff' },
    thirdParticle: { count: 6, rangeZ: 3000, rangeXY: 2000, speed: 40.0, streakLength: 200.0, color: '#008cff' },
    fourthParticle: { count: 18000, rangeZ: 2500, rangeXY: 2500, speed: 120.0, maxSpeed: 240.0, size: 4800.0 * window.devicePixelRatio, color: '#008cff' },
    fifthParticle: { count: 8, rangeZ: 3000, rangeXY: 2000, speed: 140.0, maxSpeed: 190.0, streakLength: 300.0, color: '#008cff' }
};

// ★ 新：光束粒子參數 (由此調整)
const configBeam = {
    // 通用設定
    cameraZ: 600,       // 攝影機距離 (影響整體縮放感)
    floorOffset: 80,    // 地板保留高度 (px) - 對應 "100vh - 80px"

    // 螺旋臂 1
    arm1: {
        count: 2000,        // 數量
        color: '#7CF4FF',   // 顏色
        size: 3.5,          // 粒子大小
        speed: 4.0,         // 下降速度 (向下生長速度)
        rotationSpeed: 0.02,// 旋轉速度
        radius: 60,         // 旋轉半徑 (粗細)
        noise: 5.0,         // 噪點震動幅度 (亂數偏移)
        opacity: 0.8        // 透明度
    },

    // 螺旋臂 2
    arm2: {
        count: 4000,        // 數量
        color: '#26C2FF',   // 顏色
        size: 2.5,          // 粒子大小 (稍微小一點創造層次)
        speed: 5.5,         // 下降速度 (稍微快一點)
        rotationSpeed: 0.03,// 旋轉速度
        radius: 90,         // 旋轉半徑 (比第一條寬)
        noise: 8.0,         // 噪點震動幅度
        opacity: 0.7        // 透明度
    }
};


// ==========================================
// 3. 主程式入口
// ==========================================

try {
    // 1. 初始化 System A (舊背景)
    initSceneOld();

    // 2. 初始化 System B (光束粒子專用)
    initSceneLight(); // 建立獨立攝影機與場景

    // 3. 初始化舊粒子 (加入 System A)
    initFirstParticle();
    initFirstParticleEffects();
    initSecondParticle();
    initSecondParticleEffects();
    initThirdParticle();
    initThirdParticleEffects();
    initFourthParticle();
    initFifthParticle();

    // 4. ★ 初始化光束粒子 (加入 System B)
    initBeamParticles();

    // 5. 初始化網頁特效
    initTunnelEffects();
    initAboutEffects();
    initTextEffects();
    initCompetenciesEffects();

    animate();

    console.log("✅ 系統啟動：雙獨立攝影機 | 光束雙螺旋臂 | 舊背景保留");

} catch (e) {
    console.error("❌ 錯誤:", e);
}


// ==========================================
// 4. 場景初始化
// ==========================================

// --- System A: 舊背景 ---
function initSceneOld() {
    scene = new THREE.Scene();
    
    // 舊相機參數維持不變
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.z = 750;

    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (container) container.appendChild(renderer.domElement);

    // 舊互動
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('mouseout', () => { if (idleTimer) clearTimeout(idleTimer); idleTimer = setTimeout(() => { isIdle = true; }, 100); }, false);
    for (let i = 0; i < config.firstParticle.pathLength; i++) mousePath.push(new THREE.Vector3(0, 0, 0));
}

// --- System B: 光束粒子專用 ---
function initSceneLight() {
    sceneLight = new THREE.Scene();

    // ★ 獨立光粒子攝影機
    cameraLight = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
    
    // 設定相機位置
    cameraLight.position.set(0, 0, configBeam.cameraZ); 
    cameraLight.lookAt(0, 0, 0);

    rendererLight = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererLight.setSize(window.innerWidth, window.innerHeight);
    rendererLight.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (containerLight) containerLight.appendChild(rendererLight.domElement);

    // 計算邊界，確保對齊 Top 0 和 100vh-80px
    updateLightBounds();
}

// 計算 System B 的 3D 邊界 (RWD 關鍵)
function updateLightBounds() {
    const vFOV = THREE.Math.degToRad(cameraLight.fov);
    const dist = cameraLight.position.z;
    const height = 2 * Math.tan(vFOV / 2) * dist; // 3D 空間的總可視高度
    
    // 螢幕頂部對應的 3D Y 座標
    lightBounds.top = height / 2;
    
    // 螢幕底部 (100vh) 對應的 3D Y 座標
    const bottom3D = -height / 2;
    
    // 計算 80px 在 3D 空間佔多少單位
    // 比例 = 80px / window.innerHeight
    const offsetRatio = configBeam.floorOffset / window.innerHeight;
    const offset3D = height * offsetRatio;
    
    // 地板位置 = 底部 + 80px 的高度
    lightBounds.bottom = bottom3D + offset3D;
    
    lightBounds.height = height;
}

function onWindowResize() {
    // Update System A
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Update System B
    cameraLight.aspect = window.innerWidth / window.innerHeight;
    cameraLight.updateProjectionMatrix();
    rendererLight.setSize(window.innerWidth, window.innerHeight);
    
    // 重新計算光束邊界
    updateLightBounds();

    ScrollTrigger.refresh();
}
window.addEventListener('resize', onWindowResize, false);


// ==========================================
// 5. ★ 新：光束粒子系統邏輯
// ==========================================

// 建立單一螺旋臂的函式
function createSpiralArm(cfg) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(cfg.count * 3);
    const initialData = []; // 儲存每個粒子的初始狀態 (速度、角度偏移等)

    for (let i = 0; i < cfg.count; i++) {
        const i3 = i * 3;
        
        // 初始高度：隨機分佈在 Top 到 Floor 之間
        // 這樣畫面一開始就是滿的，不會像水龍頭一樣慢慢流下來
        const y = THREE.MathUtils.randFloat(lightBounds.bottom, lightBounds.top);
        
        // 初始角度：0 ~ 360度
        const angle = Math.random() * Math.PI * 2;

        positions[i3] = 0; // X (稍後在 update 計算)
        positions[i3 + 1] = y; // Y
        positions[i3 + 2] = 0; // Z (稍後在 update 計算)

        initialData.push({
            y: y,
            angleOffset: angle, // 每個粒子的起始角度
            speed: cfg.speed * (0.8 + Math.random() * 0.4), // 速度些微隨機 (0.8~1.2倍)
            radius: cfg.radius * (0.8 + Math.random() * 0.4), // 半徑些微隨機
            noiseX: (Math.random() - 0.5) * cfg.noise, // 固有噪點
            noiseZ: (Math.random() - 0.5) * cfg.noise
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: new THREE.Color(cfg.color),
        size: cfg.size,
        transparent: true,
        opacity: cfg.opacity,
        sizeAttenuation: true, // 遠近大小變化
        blending: THREE.AdditiveBlending, // 發光混合模式
        depthWrite: false
    });

    const particleSystem = new THREE.Points(geometry, material);
    particleSystem.userData = { config: cfg, initialData: initialData };
    
    return particleSystem;
}

// 初始化所有光束
function initBeamParticles() {
    // 建立螺旋臂 1
    beamArm1 = createSpiralArm(configBeam.arm1);
    sceneLight.add(beamArm1);

    // 建立螺旋臂 2
    beamArm2 = createSpiralArm(configBeam.arm2);
    sceneLight.add(beamArm2);
}

// 更新單一螺旋臂動畫
function updateSpiralArm(particleSystem, time) {
    if (!particleSystem) return;

    const positions = particleSystem.geometry.attributes.position.array;
    const data = particleSystem.userData.initialData;
    const cfg = particleSystem.userData.config;

    for (let i = 0; i < cfg.count; i++) {
        const i3 = i * 3;
        const pData = data[i];

        // 1. 更新高度 (向下生長/流動)
        pData.y -= pData.speed;

        // 2. 邊界檢查 (循環機制)
        // 如果掉過地板，就回到頂部
        if (pData.y < lightBounds.bottom) {
            pData.y = lightBounds.top;
        }

        // 3. 計算螺旋位置 (X, Z)
        // 角度 = 初始角度 + (時間 * 旋轉速度) + (高度造成的扭曲)
        // (pData.y * 0.01) 這一項讓螺旋隨著高度扭轉，形成 DNA 狀
        const currentAngle = pData.angleOffset + (time * cfg.rotationSpeed) + (pData.y * 0.005);

        // 4. 設定座標
        // X = 中心X + cos(角度) * 半徑 + 噪點
        positions[i3] = Math.cos(currentAngle) * pData.radius + pData.noiseX;
        
        // Y = 目前高度
        positions[i3 + 1] = pData.y;
        
        // Z = 中心Z + sin(角度) * 半徑 + 噪點
        positions[i3 + 2] = Math.sin(currentAngle) * pData.radius + pData.noiseZ;
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;
}


// ==========================================
// 6. 舊粒子系統函式 (維持原樣)
// ==========================================

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
        let speed = pConfig.speedFast * (1 - distribution) + pConfig.speedSlow * distribution;
        let scatter = pConfig.scatterHead * (1 - distribution) + pConfig.scatterTail * distribution;
        
        const r = pConfig.sphereRadius * Math.pow(Math.random(), 0.8);
        const phi = Math.acos(-1 + (2 * i) / pConfig.count);
        const theta = Math.sqrt(pConfig.count * Math.PI) * phi;
        
        let bx = r * Math.cos(theta) * Math.sin(phi); let by = r * Math.sin(theta) * Math.sin(phi);
        basePositions[i3] = bx; basePositions[i3+1] = by; basePositions[i3+2] = 0;
        positions[i3] = bx; positions[i3+1] = by; positions[i3+2] = 0;
        
        firstParticleData.push({ speed: speed, scatterRadius: scatter * Math.random(), angle: Math.random() * Math.PI * 2, pathIndex: pathIndex });
        let distFromCenter = r / pConfig.sphereRadius; let lightness = 0.3 + (distFromCenter * 0.4);
        colorObj.setHSL(0.6, 1.0, lightness); colors[i3] = colorObj.r; colors[i3+1] = colorObj.g; colors[i3+2] = colorObj.b;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); geometry.userData = { basePositions: basePositions };
    const texture = createGlowingDot();
    const material = new THREE.PointsMaterial({ size: pConfig.size, map: texture, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, opacity: pConfig.opacity, depthWrite: false });
    firstParticleSystem = new THREE.Points(geometry, material); scene.add(firstParticleSystem);
}
function initFirstParticleEffects() {
    if (!firstParticleSystem) return;
    gsap.to(firstParticleSystem.scale, { x: 4, y: 4, z: 1, ease: "power1.in", scrollTrigger: { trigger: "body", start: "500px top", end: "1200px top", scrub: 0.1 }});
    gsap.to(firstParticleSystem.material, { opacity: 0, ease: "none", scrollTrigger: { trigger: "body", start: "1100px top", end: "1200px top", scrub: 0.1, onLeave: () => { runFirst = false; }, onEnterBack: () => { runFirst = true; }}});
}
function initSecondParticle() {
    const params = config.secondParticle; const geometry = new THREE.BufferGeometry(); const positions = new Float32Array(params.count * 3); const randomness = new Float32Array(params.count * 3);
    for (let i = 0; i < params.count; i++) { const i3 = i * 3; positions[i3] = (Math.random() - 0.5) * params.rangeXY * 2; positions[i3+1] = (Math.random() - 0.5) * params.rangeXY * 2; positions[i3+2] = (Math.random() - 0.5) * params.rangeZ * 2; randomness[i3] = Math.random(); randomness[i3+1] = Math.random(); randomness[i3+2] = Math.random(); }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3));
    secondParticleMaterial = new THREE.ShaderMaterial({ depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: false, transparent: true, uniforms: { uTime: { value: 0 }, uSpeed: { value: params.speed }, uRangeZ: { value: params.rangeZ }, uSize: { value: params.size }, uOpacity: { value: 0 }, uColor: { value: new THREE.Color(params.color) }}, vertexShader: `uniform float uTime; uniform float uSpeed; uniform float uRangeZ; uniform float uSize; attribute vec3 aRandomness; varying float vAlpha; void main() { vec3 pos = position; float zOffset = uTime * uSpeed * 5.0 + aRandomness.z * 200.0; pos.z = mod(pos.z + zOffset, uRangeZ * 2.0) - uRangeZ; vec4 modelPosition = modelMatrix * vec4(pos, 1.0); vec4 viewPosition = viewMatrix * modelPosition; gl_Position = projectionMatrix * viewPosition; gl_PointSize = uSize * (1.0 / -viewPosition.z); float dist = abs(pos.z); vAlpha = smoothstep(uRangeZ, uRangeZ * 0.2, dist); }`, fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vAlpha; void main() { vec2 coord = gl_PointCoord - vec2(0.5); float dist = length(coord); if (dist > 0.5) discard; float strength = pow(1.0 - (dist * 2.0), 1.5); gl_FragColor = vec4(uColor, strength * uOpacity * vAlpha); }`});
    secondParticleSystem = new THREE.Points(geometry, secondParticleMaterial); scene.add(secondParticleSystem);
}
function initSecondParticleEffects() { if (!secondParticleMaterial) return; gsap.fromTo(secondParticleMaterial.uniforms.uOpacity, { value: 0 }, { value: 1, ease: "none", scrollTrigger: { trigger: "body", start: "1000px top", end: "1800px top", scrub: 0.1, onEnter: () => { runSecond = true; }, onLeaveBack: () => { runSecond = false; }}}); }
function initThirdParticle() {
    const params = config.thirdParticle; const geometry = new THREE.BufferGeometry(); const vertexCount = params.count * 2; const positions = new Float32Array(vertexCount * 3); const randomness = new Float32Array(vertexCount * 3); const sides = new Float32Array(vertexCount);
    for (let i = 0; i < params.count; i++) { const x = (Math.random() - 0.5) * params.rangeXY * 2; const y = (Math.random() - 0.5) * params.rangeXY * 2; const z = (Math.random() - 0.5) * params.rangeZ * 2; const randX = Math.random(); const randY = Math.random(); const randZ = Math.random(); const iHead = i * 2; positions[iHead*3] = x; positions[iHead*3+1] = y; positions[iHead*3+2] = z; randomness[iHead*3] = randX; randomness[iHead*3+1] = randY; randomness[iHead*3+2] = randZ; sides[iHead] = 0.0; const iTail = i * 2 + 1; positions[iTail*3] = x; positions[iTail*3+1] = y; positions[iTail*3+2] = z; randomness[iTail*3] = randX; randomness[iTail*3+1] = randY; randomness[iTail*3+2] = randZ; sides[iTail] = 1.0; }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3)); geometry.setAttribute('aSide', new THREE.BufferAttribute(sides, 1));
    thirdParticleMaterial = new THREE.ShaderMaterial({ depthWrite: false, blending: THREE.AdditiveBlending, transparent: true, uniforms: { uTime: { value: 0 }, uSpeed: { value: params.speed }, uRangeZ: { value: params.rangeZ }, uStreakLength: { value: params.streakLength }, uOpacity: { value: 0 }, uColor: { value: new THREE.Color(params.color) }}, vertexShader: `uniform float uTime; uniform float uSpeed; uniform float uRangeZ; uniform float uStreakLength; attribute vec3 aRandomness; attribute float aSide; varying float vAlpha; void main() { vec3 pos = position; float zOffset = uTime * uSpeed * 20.0 + aRandomness.z * 2000.0; float currentZ = mod(pos.z + zOffset, uRangeZ * 2.0) - uRangeZ; if (aSide > 0.5) { float stretch = uStreakLength * (1.0 + aRandomness.x); currentZ -= stretch; vAlpha = 0.0; } else { vAlpha = 1.0; } pos.z = currentZ; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0); }`, fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vAlpha; void main() { gl_FragColor = vec4(uColor, uOpacity * vAlpha); }` });
    thirdParticleSystem = new THREE.LineSegments(geometry, thirdParticleMaterial); scene.add(thirdParticleSystem);
}
function initThirdParticleEffects() { if (!thirdParticleMaterial) return; gsap.fromTo(thirdParticleMaterial.uniforms.uOpacity, { value: 0 }, { value: 1, ease: "none", scrollTrigger: { trigger: "body", start: "800px top", end: "1800px top", scrub: 0.1, onEnter: () => { runThird = true; }, onLeaveBack: () => { runThird = false; }}}); }
function initFourthParticle() {
    const params = config.fourthParticle; const geometry = new THREE.BufferGeometry(); const positions = new Float32Array(params.count * 3); const randomness = new Float32Array(params.count * 3);
    for (let i = 0; i < params.count; i++) { const i3 = i * 3; positions[i3] = (Math.random() - 0.2) * params.rangeXY * 2; positions[i3+1] = (Math.random() - 0.1) * params.rangeXY * 2; positions[i3+2] = (Math.random() - 0.3) * params.rangeZ * 2; randomness[i3] = Math.random(); randomness[i3+1] = Math.random(); randomness[i3+2] = Math.random(); }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3));
    fourthParticleMaterial = new THREE.ShaderMaterial({ depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: false, transparent: true, uniforms: { uTime: { value: 0 }, uSpeed: { value: params.speed }, uRangeZ: { value: params.rangeZ }, uSize: { value: params.size }, uOpacity: { value: 1.0 }, uColor: { value: new THREE.Color(params.color) }, uDirection: { value: 1.0 }, uVisibleRatio: { value: 0.0 }, uBendFactor: { value: 0.0 } }, vertexShader: `uniform float uTime; uniform float uSpeed; uniform float uRangeZ; uniform float uSize; uniform float uDirection; uniform float uVisibleRatio; uniform float uBendFactor; attribute vec3 aRandomness; varying float vAlpha; void main() { vec3 pos = position; float zOffset = uTime * uSpeed * 5.0 * uDirection + aRandomness.z * 200.0; pos.z = mod(pos.z + zOffset, uRangeZ * 2.0) - uRangeZ; float progress = (pos.z + uRangeZ) / (uRangeZ * 2.0); float lift = pow(progress, 3.0) * 2000.0 * uBendFactor; pos.y += lift; pos.x += pos.x * (lift * 0.0001) * uBendFactor; vec4 modelPosition = modelMatrix * vec4(pos, 1.0); vec4 viewPosition = viewMatrix * modelPosition; gl_Position = projectionMatrix * viewPosition; float isVisible = step(aRandomness.x, uVisibleRatio); gl_PointSize = uSize * (1.0 / -viewPosition.z) * isVisible; float dist = abs(pos.z); vAlpha = smoothstep(uRangeZ, uRangeZ * 0.2, dist); }`, fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vAlpha; void main() { vec2 coord = gl_PointCoord - vec2(0.5); float dist = length(coord); if (dist > 0.5) discard; float strength = pow(1.0 - (dist * 2.0), 1.5); gl_FragColor = vec4(uColor, strength * uOpacity * vAlpha); }` });
    fourthParticleSystem = new THREE.Points(geometry, fourthParticleMaterial); scene.add(fourthParticleSystem);
}
function initFifthParticle() {
    const params = config.fifthParticle; const geometry = new THREE.BufferGeometry(); const vertexCount = params.count * 2; const positions = new Float32Array(vertexCount * 3); const randomness = new Float32Array(vertexCount * 3); const sides = new Float32Array(vertexCount);
    for (let i = 0; i < params.count; i++) { const x = (Math.random() - 0.5) * params.rangeXY * 2; const y = (Math.random() - 0.5) * params.rangeXY * 2; const z = (Math.random() - 0.5) * params.rangeZ * 2; const randX = Math.random(); const randY = Math.random(); const randZ = Math.random(); const iHead = i * 2; positions[iHead*3] = x; positions[iHead*3+1] = y; positions[iHead*3+2] = z; randomness[iHead*3] = randX; randomness[iHead*3+1] = randY; randomness[iHead*3+2] = randZ; sides[iHead] = 0.0; const iTail = i * 2 + 1; positions[iTail*3] = x; positions[iTail*3+1] = y; positions[iTail*3+2] = z; randomness[iTail*3] = randX; randomness[iTail*3+1] = randY; randomness[iTail*3+2] = randZ; sides[iTail] = 1.0; }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3)); geometry.setAttribute('aSide', new THREE.BufferAttribute(sides, 1));
    fifthParticleMaterial = new THREE.ShaderMaterial({ depthWrite: false, blending: THREE.AdditiveBlending, transparent: true, uniforms: { uTime: { value: 0 }, uSpeed: { value: params.speed }, uRangeZ: { value: params.rangeZ }, uStreakLength: { value: params.streakLength }, uOpacity: { value: 1.0 }, uColor: { value: new THREE.Color(params.color) }, uDirection: { value: 1.0 }, uVisibleRatio: { value: 0.0 }, uBendFactor: { value: 0.0 } }, vertexShader: `uniform float uTime; uniform float uSpeed; uniform float uRangeZ; uniform float uStreakLength; uniform float uDirection; uniform float uVisibleRatio; uniform float uBendFactor; attribute vec3 aRandomness; attribute float aSide; varying float vAlpha; void main() { vec3 pos = position; float zOffset = uTime * uSpeed * 20.0 * uDirection + aRandomness.z * 2000.0; float currentZ = mod(pos.z + zOffset, uRangeZ * 2.0) - uRangeZ; if (aSide > 0.5) { float stretch = uStreakLength * (1.0 + aRandomness.x) * uDirection; currentZ -= stretch; vAlpha = 0.0; } else { vAlpha = 1.0; } pos.z = currentZ; float progress = (pos.z + uRangeZ) / (uRangeZ * 2.0); float lift = pow(progress, 3.0) * 30000.0 * uBendFactor; pos.y += lift; pos.x += pos.x * (lift * 0.0001) * uBendFactor; if(aRandomness.x > uVisibleRatio) { pos = vec3(999999.0); } gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0); }`, fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vAlpha; void main() { gl_FragColor = vec4(uColor, uOpacity * vAlpha); }` });
    fifthParticleSystem = new THREE.LineSegments(geometry, fifthParticleMaterial); scene.add(fifthParticleSystem);
}
function initCompetenciesEffects() {
    const aboutWrapper = document.querySelector('.about-wrapper-outer'); const spacer1 = document.querySelector('.competencies-spacer-1'); const background2 = document.querySelector('.background-layer-2');
    if (!aboutWrapper || !spacer1) return; if (!fourthParticleMaterial || !fifthParticleMaterial) return;
    ScrollTrigger.create({ trigger: aboutWrapper, start: "top -25%", end: "top -145%", scrub: 0.1, onEnter: () => { runFourth = true; runFifth = true; }, onUpdate: (self) => { const p = self.progress; let ratio = THREE.MathUtils.clamp(p / 0.72, 0, 1); fourthParticleMaterial.uniforms.uVisibleRatio.value = ratio; fifthParticleMaterial.uniforms.uVisibleRatio.value = ratio; if (ratio < 0.375) { fourthParticleMaterial.uniforms.uSpeed.value = config.fourthParticle.speed; } else { let speedProgress = (ratio - 0.375) / (1.0 - 0.375); let newSpeed = config.fourthParticle.speed + speedProgress * (config.fourthParticle.maxSpeed - config.fourthParticle.speed); fourthParticleMaterial.uniforms.uSpeed.value = newSpeed; } if (ratio < 0.2) { fifthParticleMaterial.uniforms.uSpeed.value = config.fifthParticle.speed; } else { let speedProgress = (ratio - 0.2) / (1.0 - 0.2); let newSpeed = config.fifthParticle.speed + speedProgress * (config.fifthParticle.maxSpeed - config.fifthParticle.speed); fifthParticleMaterial.uniforms.uSpeed.value = newSpeed; } let fadeOut = 1.0 - p; if (secondParticleMaterial) secondParticleMaterial.uniforms.uOpacity.value = fadeOut; if (thirdParticleMaterial) thirdParticleMaterial.uniforms.uOpacity.value = fadeOut; }, onLeave: () => { runSecond = false; runThird = false; if (secondParticleMaterial) secondParticleMaterial.uniforms.uOpacity.value = 0; if (thirdParticleMaterial) thirdParticleMaterial.uniforms.uOpacity.value = 0; }, onEnterBack: () => { runSecond = true; runThird = true; }, onLeaveBack: () => { runFourth = false; runFifth = false; fourthParticleMaterial.uniforms.uVisibleRatio.value = 0; fifthParticleMaterial.uniforms.uVisibleRatio.value = 0; fourthParticleMaterial.uniforms.uBendFactor.value = 0; fifthParticleMaterial.uniforms.uBendFactor.value = 0; } });
    ScrollTrigger.create({ trigger: spacer1, start: "top -180px", end: "top -880px", scrub: 0.1, onUpdate: (self) => { const ratio = 1.0 - self.progress; fourthParticleMaterial.uniforms.uVisibleRatio.value = ratio; fifthParticleMaterial.uniforms.uVisibleRatio.value = ratio; fourthParticleMaterial.uniforms.uOpacity.value = 1.0; fifthParticleMaterial.uniforms.uOpacity.value = 1.0; } });
    ScrollTrigger.create({ trigger: spacer1, start: "top 97%", end: "top -160px", scrub: 0.1, onUpdate: (self) => { const p = self.progress; fourthParticleMaterial.uniforms.uBendFactor.value = p; fifthParticleMaterial.uniforms.uBendFactor.value = p; }, onLeaveBack: () => { fourthParticleMaterial.uniforms.uBendFactor.value = 0; fifthParticleMaterial.uniforms.uBendFactor.value = 0; } });
    if (background2) { gsap.to(background2, { opacity: 1, ease: "none", scrollTrigger: { trigger: spacer1, start: "top 370", end: "top -400px", scrub: 0.1 }}); }
}
function initTunnelEffects() { const walls = [{ el: '.wall-1', start: 700, out: 1400, end: 1500, x: 60, y: 10 }, { el: '.wall-2', start: 700, out: 1600, end: 1700, x: -60, y: 20 }, { el: '.wall-3', start: 700, out: 1800, end: 1900, x: 40, y: -20 }, { el: '.wall-4', start: 720, out: 2000, end: 2100, x: -20, y: -50 }, { el: '.wall-5', start: 720, out: 2000, end: 2150, x: 10, y: 50 },]; walls.forEach(w => { const element = document.querySelector(w.el); if (!element) return; let tl = gsap.timeline({ scrollTrigger: { trigger: "body", start: `${w.start}px top`, end: `${w.end}px top`, scrub: 0.5 }}); tl.to(element, { scale: 1, opacity: 1, x: `${w.x * 0.3}vw`, y: `${w.y * 0.3}vh`, duration: (w.out - w.start), ease: "power1.in" }).to(element, { scale: 3, opacity: 0, x: `${w.x}vw`, y: `${w.y}vh`, duration: (w.end - w.out), ease: "power1.in" }); }); }
function initAboutEffects() { const outerWrapper = document.querySelector('.about-wrapper-outer'); const innerContent = document.querySelector('.about-content-inner'); if (!outerWrapper || !innerContent) return; gsap.set(innerContent, { scale: 0.1, opacity: 0 }); let tl = gsap.timeline({ scrollTrigger: { trigger: outerWrapper, start: "top top", end: "+=1200", pin: true, scrub: 0.5, anticipatePin: 1 }}); tl.to(innerContent, { scale: 1, opacity: 1, ease: "power2.out" }); }
function initTextEffects() { const heroContainer = document.querySelector('.hero-container'); const heroSection = document.querySelector('.hero-section'); if (heroContainer) { gsap.set(heroContainer, { transformOrigin: "center center" }); gsap.to(heroContainer, { scale: 50, opacity: 0, ease: "power2.in", scrollTrigger: { trigger: "body", start: "680px top", end: "2400px top", scrub: 0.1 }}); } if (heroSection) { gsap.to(heroSection, { autoAlpha: 0, scrollTrigger: { trigger: "body", start: "1000px top", toggleActions: "play none none reverse" }}); } }

// ==========================================
// 9. 動畫渲染迴圈
// ==========================================
function animate() {
    requestAnimationFrame(animate);
    
    time += 0.015;
    
    // 更新舊粒子
    if (runFirst) updateFirstParticlePhysics();
    if (runSecond && secondParticleMaterial) secondParticleMaterial.uniforms.uTime.value = time;
    if (runThird && thirdParticleMaterial) thirdParticleMaterial.uniforms.uTime.value = time;
    if (runFourth && fourthParticleMaterial) fourthParticleMaterial.uniforms.uTime.value = time;
    if (runFifth && fifthParticleMaterial) fifthParticleMaterial.uniforms.uTime.value = time;

    // ★ 更新光束雙螺旋 (System B)
    if (beamArm1) updateSpiralArm(beamArm1, time);
    if (beamArm2) updateSpiralArm(beamArm2, time);

    // 渲染 System A (舊)
    renderer.render(scene, camera);
    
    // 渲染 System B (新)
    rendererLight.render(sceneLight, cameraLight);
}

function updateFirstParticlePhysics() {
    if (!firstParticleSystem) return;
    const isScrollUnbound = window.scrollY > 680;
    let targetPoint = (isIdle || isScrollUnbound) ? new THREE.Vector3(0, 0, 0) : mouse3DVec;
    if (!isScrollUnbound) { mousePath.unshift(targetPoint.clone()); if (mousePath.length > config.firstParticle.pathLength) mousePath.pop(); }
    const positions = firstParticleSystem.geometry.attributes.position.array; const basePositions = firstParticleSystem.geometry.userData.basePositions; const pConfig = config.firstParticle;
    for (let i = 0; i < pConfig.count; i++) {
        let i3 = i * 3; let pData = firstParticleData[i]; let cx = positions[i3]; let cy = positions[i3+1]; let tx, ty, s;
        if (isIdle || isScrollUnbound) { let bx = basePositions[i3]; let by = basePositions[i3+1]; let dist = Math.sqrt(bx * bx + by * by); let ripple = Math.sin(time * pConfig.rippleSpeed - dist * pConfig.rippleFrequency); let scale = (dist + ripple * pConfig.rippleIntensity) / dist; tx = bx * scale; ty = by * scale; s = pConfig.returnSpeed; } else { let targetIndex = Math.min(pData.pathIndex, mousePath.length - 1); let pathPos = mousePath[targetIndex] || mousePath[0]; let ox = Math.cos(pData.angle) * pData.scatterRadius; let oy = Math.sin(pData.angle) * pData.scatterRadius; tx = pathPos.x + ox; ty = pathPos.y + oy; s = pData.speed; }
        positions[i3] += (tx - cx) * s; positions[i3+1] += (ty - cy) * s; positions[i3+2] = 0;
    }
    firstParticleSystem.geometry.attributes.position.needsUpdate = true;
}

function onMouseMove(event) { event.preventDefault(); let x = (event.clientX / window.innerWidth) * 2 - 1; let y = -(event.clientY / window.innerHeight) * 2 + 1; let vector = new THREE.Vector3(x, y, 0.5); vector.unproject(camera); let dir = vector.sub(camera.position).normalize(); let distance = -camera.position.z / dir.z; let pos = camera.position.clone().add(dir.multiplyScalar(distance)); mouse3DVec.copy(pos); mouse3DVec.z = 0; isIdle = false; if (idleTimer) clearTimeout(idleTimer); idleTimer = setTimeout(() => { isIdle = true; }, config.firstParticle.idleTimeout); }

function createGlowingDot() { const size = 64; const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size; const context = canvas.getContext('2d'); const center = size / 2; const gradient = context.createRadialGradient(center, center, 0, center, center, center); gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); gradient.addColorStop(0.3, 'rgba(43, 152, 211, 0.5)'); gradient.addColorStop(1, 'rgba(28, 178, 153, .03)'); context.fillStyle = gradient; context.fillRect(0, 0, size, size); return new THREE.CanvasTexture(canvas); }