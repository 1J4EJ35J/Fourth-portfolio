// js/particle-core.js

// ==========================================
// 0. 核心庫註冊與虛擬捲軸 (Lenis) 設定
// ==========================================

// 註冊 GSAP ScrollTrigger
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

// 初始化 Lenis
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

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);


// ==========================================
// 1. 全域變數宣告 (Global Variables)
// ==========================================

// --- System A: 舊背景粒子 ---
let scene;
let camera;
let renderer;
let container = document.getElementById("canvas-container");

let firstParticleSystem;
let secondParticleSystem;
let secondParticleMaterial;
let thirdParticleSystem;
let thirdParticleMaterial;
let fourthParticleSystem;
let fourthParticleMaterial;
let fifthParticleSystem;
let fifthParticleMaterial;

// --- System B: 光束粒子 ---
let sceneLight;
let cameraLight;
let rendererLight;
let containerLight = document.getElementById("canvas-container-light");

let beam1System;
let beam2System;
let beam3System;
let beam4System;
let beam5System;
let beam6System;

// ★ 大腦光粒7 (獨立控制)
let brainBeam7System;
let runBrainBeam7 = false;

// 路徑查表
let leftPathLUT = [];
let rightPathLUT = [];
let pathHeight = 0;

// 視窗邊界
let lightBounds = {
    top: 0,
    bottom: 0,
    floorY: 0,
    pixelScale: 1
};

// --- System C: 大腦粒子 ---
let brainSystem1;
let brainSystem2;
let brainSystem3;

let brainData1 = [];
let brainData2 = [];
let brainData3 = [];

let brainRatio1 = 0;
let brainRatio2 = 0;
let brainRatio3 = 0;

let runBrainLayer1 = false;
let runBrainLayer2 = false;
let runBrainLayer3 = false;

// --- System D: 沙粒系統 (The Spirit) ---
let sandSystem;
let sandUniforms;
let isSandActive = false;
let sandIdleTimer = null;
let sandCurrentProgress = 0; // 0=Brain, 1=Spirit
let sandCurrentOpacity = 0;

// --- 共用變數 ---
let time = 0;

let runFirst = true;
let runSecond = false;
let runThird = false;
let runFourth = false;
let runFifth = false;
let runBeams = false;

let beamScatterRatio = 0.0;

let firstParticleData = [];
let mouse = new THREE.Vector2(9999, 9999);
let mouse3DVec = new THREE.Vector3(0, 0, 0);
let isIdle = true;
let idleTimer = null;
let mousePath = [];


// ==========================================
// 2. 參數設定 (Config - 嚴格斷行)
// ==========================================

const config = {
    firstParticle: {
        count: 60000,
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
    brainLayer1: {
        count: 8000,
        color: "#008cff",
        size: 5.5,
        glow: 0,
        blur: 1,
        opacity: 1,
        zOffset: 0,
        scatterRange: 2500
    },
    brainLayer2: {
        count: 700,
        color: "#005aa4",
        size: 40.5,
        glow: 0,
        blur: .3,
        opacity: 0.6,
        zOffset: 0,
        scatterRange: 2000
    },
    brainLayer3: {
        count: 2000,
        color: "#008c9b",
        size: 8.0,
        glow: 0,
        blur: 0,
        flashSpeed: 7.0,
        opacity: .9,
        zOffset: 1,
        scatterRange: 3000
    },
    sandParticle: {
        count: 30000,
        color: "#7df2ff",
        size: 2.5,
        activeSize: 6.0,
        blur: 0.8,
        scatterRange: 3000
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

const configBeam = {
    cameraZ: 1000,
    floorOffset: 80,
    fadeRange: 300,
    pathRight: "M0.5 0.0078125C1.65413 61.898 17 410.008 17 431.008C17 452.008 14.8664 499.521 17 519.008C24.5 587.508 95.7826 581.99 149.5 587.508C500 623.508 397 758.008 164.5 774.508C119.235 777.72 50.5 807.508 50.5 864.008C50.5 904.408 50.5 912.841 50.5 923.508",
    pathLeft: "M119.986 0.0078125C119.155 44.5477 109.781 413.008 109.781 443.508C109.781 460.008 103.486 546.947 103.486 558.508C103.486 587.508 95.0459 613.147 59.7812 622.508C-21.2188 644.008 -14.9053 740.008 52.5947 763.008C82.7812 773.294 88.7812 783.008 88.7812 842.008C88.7812 882.408 88.7812 913.841 88.7812 924.508",
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
        rotationSpeed: 1
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
        rotationSpeed: -0.5
    },
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
        rotationSpeed: 0.0
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
        rotationSpeed: 0.0
    },
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
        rotationSpeed: 0.0
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
        rotationSpeed: 0.0
    },
    brainBeam7: {
        count: 2000,
        color: "#10acb7",
        size: 10.0,
        speed: .01,
        thickness: 200,
        noise: 105.0,
        opacity: 0.9,
        spread: 0,
        blur: 0.8,
        rotationSpeed: 0.0
    },
};


// ==========================================
// 3. 場景初始化與基礎設定 (Scene Init)
// ==========================================

function initSceneOld() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.z = 750;
    
    renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (container) container.appendChild(renderer.domElement);

    // 這裡預先加入監聽，具體 onMouseMove 函式將在 particle-main.js 定義
    // 只要確保 main.js 在 core.js 之後載入即可
    if (typeof onMouseMove !== 'undefined') {
        document.addEventListener("mousemove", onMouseMove, false);
    } else {
        // 若尚未定義，等 main.js 載入後再綁定 (在 main.js 入口處處理)
    }

    for (let i = 0; i < config.firstParticle.pathLength; i++) {
        mousePath.push(new THREE.Vector3(0, 0, 0));
    }

    updateBrainCamera();
}

function initSceneLight() {
    sceneLight = new THREE.Scene();
    cameraLight = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
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
    if (!cameraLight) return;
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
    if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
    if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    if (cameraLight) {
        cameraLight.aspect = window.innerWidth / window.innerHeight;
        cameraLight.updateProjectionMatrix();
    }
    if (rendererLight) {
        rendererLight.setSize(window.innerWidth, window.innerHeight);
    }

    updateLightLayout();
    
    // 確保 ScrollTrigger 重新計算位置
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
    }

    updateBrainCamera();
}

function updateBrainCamera() {
    if (!camera) return;

    const w = window.innerWidth;
    const baseWidth = 1920; 
    const baseZ = 800; 

    let effectiveWidth = w;

    if (w < 768) {
        camera.position.z = 1200;
        return;
    } else if (w >= 768 && w <= 1440) {
        effectiveWidth = 1440;
    } else if (w > 1660 && w <= 1920) {
        effectiveWidth = 1660;
    }

    const ratio = baseWidth / effectiveWidth;
    camera.position.z = Math.min(2500, baseZ * ratio);
}

// 綁定視窗縮放事件
window.addEventListener("resize", onWindowResize, false);