// js/particle.js

// ==========================================
// 0. 核心庫註冊與虛擬捲軸 (Lenis) 設定
// ==========================================

// 註冊 GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// ★ 初始化 Lenis 虛擬捲軸
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
});

// 將 Lenis 的滾動事件同步給 GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);

// 將 Lenis 的更新掛載到 GSAP 的計時器上
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});

// 關閉 GSAP 的落後平滑化，避免衝突
gsap.ticker.lagSmoothing(0);


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
let beam1System;
let beam2System;
let beam3System;
let beam4System;
let beam5System;
let beam6System;

// 路徑查表 (Look-Up Tables)
let leftPathLUT = [];
let rightPathLUT = [];
let pathHeight = 0;

// 視窗邊界計算
let lightBounds = {
    top: 0,
    bottom: 0,
    floorY: 0,
    pixelScale: 1
};

// --- 共用變數 ---
let time = 0;

// 舊粒子開關
let runFirst = true;
let runSecond = false;
let runThird = false;
let runFourth = false;
let runFifth = false;

// 光束總開關
let runBeams = false;

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
    // 舊背景粒子
    firstParticle: {
        count: 60000,//原本16W
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
        rangeZ: 600,
        rangeXY: 2500,
        speed: 20.0,
        size: 2400.0 * window.devicePixelRatio,
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
        count: 10000,
        rangeZ: 2800,
        rangeXY: 2500,
        speed: 60.0,
        maxSpeed: 100.0,
        size: 4800.0 * window.devicePixelRatio,
        color: "#5db6ff",
    },
    fifthParticle: {
        count: 9,
        rangeZ: 2800,
        rangeXY: 2000,
        speed: 80.0,
        maxSpeed: 120.0,
        streakLength: 200.0,
        color: "#008cff",
    },
};

// ★ 光束粒子控制台
const configBeam = {
    cameraZ: 1000,
    floorOffset: 80,

    // ★ 漸層柔邊範圍 (300px 的隨機過渡區)
    fadeRange: 300,

    // SVG 路徑數據
    pathRight: "M0.5 0.0078125C1.65413 61.898 17 410.008 17 431.008C17 452.008 14.8664 499.521 17 519.008C24.5 587.508 95.7826 581.99 149.5 587.508C500 623.508 397 758.008 164.5 774.508C119.235 777.72 50.5 807.508 50.5 864.008C50.5 904.408 50.5 912.841 50.5 923.508",
    pathLeft: "M119.986 0.0078125C119.155 44.5477 109.781 413.008 109.781 443.508C109.781 460.008 103.486 546.947 103.486 558.508C103.486 587.508 95.0459 613.147 59.7812 622.508C-21.2188 644.008 -14.9053 740.008 52.5947 763.008C82.7812 773.294 88.7812 783.008 88.7812 842.008C88.7812 882.408 88.7812 913.841 88.7812 924.508",

    // --- 垂直下墜組 ---
    beam1: {
        count: 110,
        color: "#7df2ff",
        size: 10.0,
        speed: 0.9,
        thickness: 10.0,
        noise: 3.0,
        opacity: 0.8,
        spread: 360,
        blur: 0.8,
        rotationSpeed: 1,
    },
    beam2: {
        count: 0,
        color: "#008cff",
        size: 12.0,
        speed: 1.0,
        thickness: 30.0,
        noise: 10.0,
        opacity: 0.7,
        spread: 0,
        blur: 0.5,
        rotationSpeed: -0.5,
    },

    // --- 左弧線組 ---
    beam3: {
        count: 1900,
        color: "#008cff",
        size: 8.0,
        speed: 0.6,
        thickness: 25.0,
        noise: 0.0,
        opacity: 0.8,
        spread: 600,
        blur: 0.6,
        rotationSpeed: 0.0,
    },
    beam4: {
        count: 4000,
        color: "#008cff",
        size: 8.0,
        speed: 1.2,
        thickness: 25.0,
        noise: 0.0,
        opacity: 0.9,
        spread: 800,
        blur: 1,
        rotationSpeed: 0.0,
    },

    // --- 右弧線組 ---
    beam5: {
        count: 1900,
        color: "#004aea",
        size: 9.4,
        speed: 0.9,
        thickness: 90.0,
        noise: 0.0,
        opacity: 0.6,
        spread: 1800,
        blur: .4,
        rotationSpeed: 0.0,
    },
    beam6: {
        count: 100,
        color: "#379ef3",
        size: 14.0,
        speed: 0.01,
        thickness: 835.0,
        noise: 75.0,
        opacity: 0.6,
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

    // 新光束粒子
    initBeamSystem();

    // 特效
    initTunnelEffects();
    initAboutEffects();
    initTextEffects();
    initCompetenciesEffects();

    // 初始化光束的距離觸發器
    initBeamScrollTriggers();

    animate();

    console.log("✅ V39 啟動：全域粒子優化 | 確保隱藏時停止運算 | 完美運行");

} catch (e) {
    console.error("❌ 錯誤:", e);
}


// ==========================================
// 4. 場景初始化函數
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
    renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (container) container.appendChild(renderer.domElement);

    document.addEventListener("mousemove", onMouseMove, false);
    document.addEventListener("mouseout", () => {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            isIdle = true;
        }, 100);
    }, false);

    for (let i = 0; i < config.firstParticle.pathLength; i++) {
        mousePath.push(new THREE.Vector3(0, 0, 0));
    }
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

    rendererLight = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
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
// 5. 新：路徑與粒子系統
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
        points.push({
            x: p.x,
            y: p.y
        });
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

    return {
        lut,
        height
    };
}

function initPathLUTs() {
    const rightData = parsePathToLUT(configBeam.pathRight);
    rightPathLUT = rightData.lut;
    const leftData = parsePathToLUT(configBeam.pathLeft);
    leftPathLUT = leftData.lut;
    pathHeight = Math.max(rightData.height, leftData.height);
}

function createBlurryTexture(bluriness = 0.5) {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const center = size / 2;
    const radius = size / 2;

    const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);

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

        const angleRandom = (Math.random() - 0.5) * ((cfg.spread * Math.PI) / 180);
        const thicknessRandom = Math.random() - 0.5;
        
        // 隨機值：用於柔邊計算
        const fadeRandom = Math.random();

        initialData.push({
            y: y,
            speed: cfg.speed * (0.8 + Math.random() * 0.4),
            noiseOffset: Math.random() * 100,
            angleRandom: angleRandom,
            thicknessRandom: thicknessRandom,
            fadeRandom: fadeRandom 
        });
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const texture = createBlurryTexture(cfg.blur);

    const material = new THREE.PointsMaterial({
        color: new THREE.Color(cfg.color),
        size: cfg.size,
        map: texture,
        transparent: true,
        opacity: 0,
        sizeAttenuation: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        depthTest: false,
    });

    const system = new THREE.Points(geometry, material);

    system.userData = {
        config: cfg,
        initialData: initialData,
        type: type,
        densityRatio: 0,
        flowRatio: 0
    };
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

// ★ 動畫更新：加入 Soft Edge 邏輯
function updateBeam(system) {
    if (!system) return;
    const positions = system.geometry.attributes.position.array;
    const data = system.userData.initialData;
    const type = system.userData.type;
    const cfg = system.userData.config;

    // 取得控制參數
    const densityRatio = system.userData.densityRatio;
    const flowRatio = system.userData.flowRatio;

    // 取得設定檔中的漸層範圍 (預設 300)
    const fadeRange = configBeam.fadeRange || 300;

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

    // 1. 裁切線 (Cutoff Line)
    const totalHeight = lightBounds.top - lightBounds.floorY;
    const drawLimitY = lightBounds.top - (totalHeight * flowRatio);

    // 2. 可見數量 (Visible Count)
    const visibleCount = Math.floor(cfg.count * densityRatio);

    for (let i = 0; i < cfg.count; i++) {
        const i3 = i * 3;
        const p = data[i];

        // 運動運算
        p.y -= p.speed;
        if (p.y < lightBounds.floorY) {
            p.y = lightBounds.top + Math.random() * 100;
        }

        // 3. 柔邊過濾邏輯 (Soft Edge)
        // 計算該粒子的「有效閥值」= 基準線 + (隨機偏移 * 範圍)
        const effectiveLimit = drawLimitY + (p.fadeRandom * fadeRange);

        // 綜合過濾：數量 OR 高度(含柔邊)
        if (i >= visibleCount || p.y < effectiveLimit) {
            positions[i3] = 99999;
            positions[i3 + 1] = 99999;
            positions[i3 + 2] = 99999;
            continue;
        }

        // 查表半徑
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

        // 厚度
        radius += p.thicknessRandom * (cfg.thickness || 0);

        // 角度
        const finalAngle = baseAngle + p.angleRandom + timeRotation;

        // 座標轉換
        let finalX = radius * Math.cos(finalAngle);
        let finalZ = radius * Math.sin(finalAngle);

        // 噪點
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
// 6. 光束的 ScrollTriggers
// ==========================================

function initBeamScrollTriggers() {
    // 1. 全域總開關
    ScrollTrigger.create({
        trigger: ".competencies-spacer-1",
        start: "bottom 100px",
        end: "max",
        onEnter: () => {
            runBeams = true;
        },
        onLeaveBack: () => {
            runBeams = false;
        }
    });

    // Helper Functions
    const updateSystem = (sys1, sys2, prop, val) => {
        if (sys1) sys1.userData[prop] = val;
        if (sys2) sys2.userData[prop] = val;
    };
    const updateOpacity = (sys1, sys2, val) => {
        if (sys1) sys1.material.opacity = val * (sys1.userData.config.opacity || 1);
        if (sys2) sys2.material.opacity = val * (sys2.userData.config.opacity || 1);
    };

    // 2. 光粒 1 & 2 (垂直)
    ScrollTrigger.create({
        trigger: ".competencies-spacer-2",
        start: "top 100px",
        end: "top -200px",
        scrub: 0,
        onUpdate: (self) => {
            const p = self.progress;
            updateSystem(beam1System, beam2System, 'densityRatio', p);
            updateOpacity(beam1System, beam2System, p);
        }
    });
    ScrollTrigger.create({
        trigger: ".competencies-spacer-2",
        start: "top 100px",
        end: "bottom top",
        scrub: 0,
        onUpdate: (self) => {
            updateSystem(beam1System, beam2System, 'flowRatio', self.progress);
        }
    });

    // 3. 光粒 3 & 4 (左弧)
    ScrollTrigger.create({
        trigger: ".competencies-spacer-2",
        start: "top 0px",
        end: "top -340px",
        scrub: 0,
        onUpdate: (self) => {
            const p = self.progress;
            updateSystem(beam3System, beam4System, 'densityRatio', p);
            updateOpacity(beam3System, beam4System, p);
        }
    });
    ScrollTrigger.create({
        trigger: ".competencies-spacer-2",
        start: "top -100px",
        end: "bottom top",
        scrub: 0,
        onUpdate: (self) => {
            updateSystem(beam3System, beam4System, 'flowRatio', self.progress);
        }
    });

    // 4. 光粒 5 & 6 (右弧)
    ScrollTrigger.create({
        trigger: ".competencies-spacer-2",
        start: "top -200px",
        end: "top -400px",
        scrub: 0,
        onUpdate: (self) => {
            const p = self.progress;
            updateSystem(beam5System, beam6System, 'densityRatio', p);
            updateOpacity(beam5System, beam6System, p);
        }
    });
    ScrollTrigger.create({
        trigger: ".competencies-spacer-2",
        start: "top -200px",
        end: "bottom top",
        scrub: 0,
        onUpdate: (self) => {
            updateSystem(beam5System, beam6System, 'flowRatio', self.progress);
        }
    });
}


// ==========================================
// 7. 舊粒子系統
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
    geometry.userData = {
        basePositions: basePositions
    };

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
    geometry.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 3));

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
        vertexShader: `
            uniform float uTime; 
            uniform float uSpeed; 
            uniform float uRangeZ; 
            uniform float uSize; 
            attribute vec3 aRandomness; 
            varying float vAlpha; 
            void main() { 
                vec3 pos = position; 
                float zOffset = uTime * uSpeed * 5.0 + aRandomness.z * 200.0; 
                pos.z = mod(pos.z + zOffset, uRangeZ * 2.0) - uRangeZ; 
                vec4 modelPosition = modelMatrix * vec4(pos, 1.0); 
                vec4 viewPosition = viewMatrix * modelPosition; 
                gl_Position = projectionMatrix * viewPosition; 
                gl_PointSize = uSize * (1.0 / -viewPosition.z); 
                float dist = abs(pos.z); 
                vAlpha = smoothstep(uRangeZ, uRangeZ * 0.2, dist); 
            }
        `,
        fragmentShader: `
            uniform vec3 uColor; 
            uniform float uOpacity; 
            varying float vAlpha; 
            void main() { 
                vec2 coord = gl_PointCoord - vec2(0.5); 
                float dist = length(coord); 
                if (dist > 0.5) discard; 
                float strength = pow(1.0 - (dist * 2.0), 1.5); 
                gl_FragColor = vec4(uColor, strength * uOpacity * vAlpha); 
            }
        `,
    });

    secondParticleSystem = new THREE.Points(geometry, secondParticleMaterial);
    scene.add(secondParticleSystem);
}

function initSecondParticleEffects() {
    if (!secondParticleMaterial) return;
    gsap.fromTo(
        secondParticleMaterial.uniforms.uOpacity, {
            value: 0
        }, {
            value: 1,
            ease: "none",
            scrollTrigger: {
                trigger: "body",
                start: "1000px top",
                end: "1300px top",
                scrub: 0.1,
                onEnter: () => {
                    runSecond = true;
                },
                onLeaveBack: () => {
                    runSecond = false;
                    // ★ 優化：回到上方時，強制將透明度歸零
                    if (secondParticleMaterial) secondParticleMaterial.uniforms.uOpacity.value = 0.0;
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
    geometry.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 3));
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
        vertexShader: `
            uniform float uTime; 
            uniform float uSpeed; 
            uniform float uRangeZ; 
            uniform float uStreakLength; 
            attribute vec3 aRandomness; 
            attribute float aSide; 
            varying float vAlpha; 
            void main() { 
                vec3 pos = position; 
                float zOffset = uTime * uSpeed * 20.0 + aRandomness.z * 2000.0; 
                float currentZ = mod(pos.z + zOffset, uRangeZ * 2.0) - uRangeZ; 
                if (aSide > 0.5) { 
                    float stretch = uStreakLength * (1.0 + aRandomness.x); 
                    currentZ -= stretch; 
                    vAlpha = 0.0; 
                } else { 
                    vAlpha = 1.0; 
                } 
                pos.z = currentZ; 
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0); 
            }
        `,
        fragmentShader: `
            uniform vec3 uColor; 
            uniform float uOpacity; 
            varying float vAlpha; 
            void main() { 
                gl_FragColor = vec4(uColor, uOpacity * vAlpha); 
            }
        `,
    });

    thirdParticleSystem = new THREE.LineSegments(geometry, thirdParticleMaterial);
    scene.add(thirdParticleSystem);
}

function initThirdParticleEffects() {
    if (!thirdParticleMaterial) return;
    gsap.fromTo(
        thirdParticleMaterial.uniforms.uOpacity, {
            value: 0
        }, {
            value: 1,
            ease: "none",
            scrollTrigger: {
                trigger: "body",
                start: "800px top",
                end: "1700px top",
                scrub: 0.1,
                onEnter: () => {
                    runThird = true;
                },
                onLeaveBack: () => {
                    runThird = false;
                    // ★ 優化：回到上方時，強制將透明度歸零
                    if (thirdParticleMaterial) thirdParticleMaterial.uniforms.uOpacity.value = 0.0;
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
    geometry.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 3));

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
            uOpacity: { value: 0.0 }, // ★ 修復：初始為隱藏
            uColor: { value: new THREE.Color(params.color) },
            uDirection: { value: 1.0 },
            uVisibleRatio: { value: 0.0 },
            uBendFactor: { value: 0.0 },
        },
        vertexShader: `
            uniform float uTime; 
            uniform float uSpeed; 
            uniform float uRangeZ; 
            uniform float uSize; 
            uniform float uDirection; 
            uniform float uVisibleRatio; 
            uniform float uBendFactor; 
            attribute vec3 aRandomness; 
            varying float vAlpha; 
            void main() { 
                vec3 pos = position; 
                float zOffset = uTime * uSpeed * 5.0 * uDirection + aRandomness.z * 200.0; 
                pos.z = mod(pos.z + zOffset, uRangeZ * 2.0) - uRangeZ; 
                float progress = (pos.z + uRangeZ) / (uRangeZ * 2.0); 
                float lift = pow(progress, 3.0) * 3600.0 * uBendFactor; 
                pos.y += lift; 
                pos.x += pos.x * (lift * 0.0001) * uBendFactor; 
                vec4 modelPosition = modelMatrix * vec4(pos, 1.0); 
                vec4 viewPosition = viewMatrix * modelPosition; 
                gl_Position = projectionMatrix * viewPosition; 
                float isVisible = step(aRandomness.x, uVisibleRatio); 
                gl_PointSize = uSize * (1.0 / -viewPosition.z) * isVisible; 
                float dist = abs(pos.z); 
                vAlpha = smoothstep(uRangeZ, uRangeZ * 0.2, dist); 
            }
        `,
        fragmentShader: `
            uniform vec3 uColor; 
            uniform float uOpacity; 
            varying float vAlpha; 
            void main() { 
                vec2 coord = gl_PointCoord - vec2(0.5); 
                float dist = length(coord); 
                if (dist > 0.5) discard; 
                float strength = pow(1.0 - (dist * 2.0), 1.5); 
                gl_FragColor = vec4(uColor, strength * uOpacity * vAlpha); 
            }
        `,
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
    geometry.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 3));
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
            uOpacity: { value: 0.0 }, // ★ 修復：初始為隱藏
            uColor: { value: new THREE.Color(params.color) },
            uDirection: { value: 1.0 },
            uVisibleRatio: { value: 0.0 },
            uBendFactor: { value: 0.0 },
        },
        vertexShader: `
            uniform float uTime; 
            uniform float uSpeed; 
            uniform float uRangeZ; 
            uniform float uStreakLength; 
            uniform float uDirection; 
            uniform float uVisibleRatio; 
            uniform float uBendFactor; 
            attribute vec3 aRandomness; 
            attribute float aSide; 
            varying float vAlpha; 
            void main() { 
                vec3 pos = position; 
                float zOffset = uTime * uSpeed * 20.0 * uDirection + aRandomness.z * 2000.0; 
                float currentZ = mod(pos.z + zOffset, uRangeZ * 2.0) - uRangeZ; 
                if (aSide > 0.5) { 
                    float stretch = uStreakLength * (1.0 + aRandomness.x) * uDirection; 
                    currentZ -= stretch; 
                    vAlpha = 0.0; 
                } else { 
                    vAlpha = 1.0; 
                } 
                pos.z = currentZ; 
                float progress = (pos.z + uRangeZ) / (uRangeZ * 2.0); 
                float lift = pow(progress, 3.0) * 30000.0 * uBendFactor; 
                pos.y += lift; 
                pos.x += pos.x * (lift * 0.0001) * uBendFactor; 
                if(aRandomness.x > uVisibleRatio) { 
                    pos = vec3(999999.0); 
                } 
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0); 
            }
        `,
        fragmentShader: `
            uniform vec3 uColor; 
            uniform float uOpacity; 
            varying float vAlpha; 
            void main() { 
                gl_FragColor = vec4(uColor, uOpacity * vAlpha); 
            }
        `,
    });

    fifthParticleSystem = new THREE.LineSegments(geometry, fifthParticleMaterial);
    scene.add(fifthParticleSystem);
}

function initCompetenciesEffects() {
    const aboutWrapper = document.querySelector(".about-wrapper-outer");
    const spacer1 = document.querySelector(".competencies-spacer-1");
    const background2 = document.querySelector(".background-layer-2");

    if (!aboutWrapper || !spacer1) return;
    
    // ★ 安全檢查：如果材質尚未初始化，退出以防止報錯
    if (!fourthParticleMaterial || !fifthParticleMaterial) return;

    ScrollTrigger.create({
        trigger: aboutWrapper,
        start: "top -25%",
        end: "top -145%",
        scrub: 0.1,
        onEnter: () => {
            runFourth = true;
            runFifth = true;
            // ★ 修復：進入時，確保粒子透明度開啟
            if (fourthParticleMaterial) fourthParticleMaterial.uniforms.uOpacity.value = 1.0;
            if (fifthParticleMaterial) fifthParticleMaterial.uniforms.uOpacity.value = 1.0;
        },
        onUpdate: (self) => {
            const p = self.progress;
            
            // ★ 安全檢查：確保 uniforms 存在才更新
            if (fourthParticleMaterial && fourthParticleMaterial.uniforms) {
                let ratio = THREE.MathUtils.clamp(p / 0.72, 0, 1);
                fourthParticleMaterial.uniforms.uVisibleRatio.value = ratio;
                
                if (ratio < 0.375) {
                    fourthParticleMaterial.uniforms.uSpeed.value = config.fourthParticle.speed;
                } else {
                    let speedProgress = (ratio - 0.375) / (1.0 - 0.375);
                    let newSpeed = config.fourthParticle.speed + speedProgress * (config.fourthParticle.maxSpeed - config.fourthParticle.speed);
                    fourthParticleMaterial.uniforms.uSpeed.value = newSpeed;
                }
            }

            if (fifthParticleMaterial && fifthParticleMaterial.uniforms) {
                let ratio = THREE.MathUtils.clamp(p / 0.72, 0, 1);
                fifthParticleMaterial.uniforms.uVisibleRatio.value = ratio;

                if (ratio < 0.2) {
                    fifthParticleMaterial.uniforms.uSpeed.value = config.fifthParticle.speed;
                } else {
                    let speedProgress = (ratio - 0.2) / (1.0 - 0.2);
                    let newSpeed = config.fifthParticle.speed + speedProgress * (config.fifthParticle.maxSpeed - config.fifthParticle.speed);
                    fifthParticleMaterial.uniforms.uSpeed.value = newSpeed;
                }
            }

            let fadeOut = 1.0 - p;
            if (secondParticleMaterial && secondParticleMaterial.uniforms) secondParticleMaterial.uniforms.uOpacity.value = fadeOut;
            if (thirdParticleMaterial && thirdParticleMaterial.uniforms) thirdParticleMaterial.uniforms.uOpacity.value = fadeOut;
        },
        onLeave: () => {
            runSecond = false;
            runThird = false;
            if (secondParticleMaterial && secondParticleMaterial.uniforms) secondParticleMaterial.uniforms.uOpacity.value = 0;
            if (thirdParticleMaterial && thirdParticleMaterial.uniforms) thirdParticleMaterial.uniforms.uOpacity.value = 0;
        },
        onEnterBack: () => {
            runSecond = true;
            runThird = true;
        },
        onLeaveBack: () => {
            runFourth = false;
            runFifth = false;
            
            if (fourthParticleMaterial && fourthParticleMaterial.uniforms) {
                fourthParticleMaterial.uniforms.uVisibleRatio.value = 0;
                fourthParticleMaterial.uniforms.uBendFactor.value = 0;
                // ★ 修復：回到上方時，強制關閉透明度
                fourthParticleMaterial.uniforms.uOpacity.value = 0.0;
            }
            if (fifthParticleMaterial && fifthParticleMaterial.uniforms) {
                fifthParticleMaterial.uniforms.uVisibleRatio.value = 0;
                fifthParticleMaterial.uniforms.uBendFactor.value = 0;
                // ★ 修復：回到上方時，強制關閉透明度
                fifthParticleMaterial.uniforms.uOpacity.value = 0.0;
            }
        },
    });

    ScrollTrigger.create({
        trigger: spacer1,
        start: "top -80px",
        end: "top -680px",
        scrub: 0.1,
        onUpdate: (self) => {
            const ratio = 1.0 - self.progress;
            if (fourthParticleMaterial && fourthParticleMaterial.uniforms) fourthParticleMaterial.uniforms.uVisibleRatio.value = ratio;
            if (fifthParticleMaterial && fifthParticleMaterial.uniforms) fifthParticleMaterial.uniforms.uVisibleRatio.value = ratio;
            if (fourthParticleMaterial && fourthParticleMaterial.uniforms) fourthParticleMaterial.uniforms.uOpacity.value = 1.0;
            if (fifthParticleMaterial && fifthParticleMaterial.uniforms) fifthParticleMaterial.uniforms.uOpacity.value = 1.0;
        },
    });

    ScrollTrigger.create({
        trigger: spacer1,
        start: "top 97%",
        end: "top -120px",
        scrub: 0.1,
        onUpdate: (self) => {
            const p = self.progress;
            if (fourthParticleMaterial && fourthParticleMaterial.uniforms) fourthParticleMaterial.uniforms.uBendFactor.value = p;
            if (fifthParticleMaterial && fifthParticleMaterial.uniforms) fifthParticleMaterial.uniforms.uBendFactor.value = p;
        },
        onLeaveBack: () => {
            if (fourthParticleMaterial && fourthParticleMaterial.uniforms) fourthParticleMaterial.uniforms.uBendFactor.value = 0;
            if (fifthParticleMaterial && fifthParticleMaterial.uniforms) fifthParticleMaterial.uniforms.uBendFactor.value = 0;
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
    const walls = [{
        el: ".wall-1",
        start: 700,
        out: 1400,
        end: 1500,
        x: 60,
        y: 10
    }, {
        el: ".wall-2",
        start: 700,
        out: 1600,
        end: 1700,
        x: -60,
        y: 20
    }, {
        el: ".wall-3",
        start: 700,
        out: 1800,
        end: 1900,
        x: 40,
        y: -20
    }, {
        el: ".wall-4",
        start: 720,
        out: 2000,
        end: 2100,
        x: -20,
        y: -50
    }, {
        el: ".wall-5",
        start: 720,
        out: 2000,
        end: 2150,
        x: 10,
        y: 50
    }, ];

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

    gsap.set(innerContent, {
        scale: 0.1,
        opacity: 0
    });

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
    tl.to(innerContent, {
        scale: 1,
        opacity: 1,
        ease: "power2.out"
    });
}

function initTextEffects() {
    const heroContainer = document.querySelector(".hero-container");
    const heroSection = document.querySelector(".hero-section");

    if (heroContainer) {
        gsap.set(heroContainer, {
            transformOrigin: "center center"
        });
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
    // ★ 安全檢查
    if (runSecond && secondParticleMaterial && secondParticleMaterial.uniforms) secondParticleMaterial.uniforms.uTime.value = time;
    if (runThird && thirdParticleMaterial && thirdParticleMaterial.uniforms) thirdParticleMaterial.uniforms.uTime.value = time;
    if (runFourth && fourthParticleMaterial && fourthParticleMaterial.uniforms) fourthParticleMaterial.uniforms.uTime.value = time;
    if (runFifth && fifthParticleMaterial && fifthParticleMaterial.uniforms) fifthParticleMaterial.uniforms.uTime.value = time;

    // ★ 更新光束 (6組獨立更新) - 僅在 runBeams = true 時更新
    if (runBeams) {
        if (beam1System) updateBeam(beam1System);
        if (beam2System) updateBeam(beam2System);
        if (beam3System) updateBeam(beam3System);
        if (beam4System) updateBeam(beam4System);
        if (beam5System) updateBeam(beam5System);
        if (beam6System) updateBeam(beam6System);
    }

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