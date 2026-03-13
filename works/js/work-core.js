// js/works/works-core.js

// ==========================================
// 1. 全域變數宣告 (Works Page Exclusive)
// ==========================================

let scene, camera, renderer;
let container = document.getElementById("canvas-container");

// 粒子系統實例
let brainSystem1; // 底層 (輪廓)
let brainSystem2; // 網絡 (連結)
let brainSystem3; // 高亮 (節點)
let brainSystem4; // 閃爍 (核心)
let brainBeam7System; // 龍頭 (光束能量)

// 數據容器 (儲存原始大腦座標)
let brainData1 = [];
let brainData2 = [];
let brainData3 = [];
let brainData4 = [];

// 互動控制變數
let mouse = new THREE.Vector2(9999, 9999); // 2D 螢幕座標
let mouse3DVec = new THREE.Vector3(0, 0, 0); // 3D 世界座標
let isIdle = true; // 是否閒置 (預設 true，顯示大腦)
let idleTimer = null;
let time = 0;

// 龍形拖尾路徑 (儲存滑鼠歷史位置)
// 長度決定龍的長度
const TRAIL_LENGTH = 60;
let mousePath = [];

// ==========================================
// 2. 參數設定 (Config - 針對 Works 優化)
// ==========================================

const worksConfig = {
    // 共同物理參數
    lerpSpeed: 0.08,    // 追蹤速度 (越大越快)
    returnSpeed: 0.05,  // 歸位速度 (越小越柔和)
    dragonSpread: 120,  // 龍身寬度 (亂數擴散範圍)

    // 各層參數
    layer1: { count: 8000, color: "#005aa4", size: 4.5, blur: 0.8, zOffset: 0, trailIndex: 50 }, // 龍尾
    layer2: { count: 700, color: "#008cff", size: 30.0, blur: 0.4, zOffset: 0, trailIndex: 35 }, // 龍身後段
    layer3: { count: 2000, color: "#00dbd3", size: 7.0, blur: 0.2, zOffset: 10, trailIndex: 20 }, // 龍身前段
    layer4: { count: 2000, color: "#ffffff", size: 9.0, blur: 0.0, zOffset: 15, trailIndex: 10 }, // 龍頸
    beam7: { count: 150, color: "#7df2ff", size: 25.0, blur: 0.6, zOffset: 20, trailIndex: 0 }, // 龍頭 (最亮)
};

// ==========================================
// 3. 場景初始化 (Init Scene)
// ==========================================

function initWorksScene() {
    scene = new THREE.Scene();

    // 設定相機 (大腦預設視角)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.z = 800; // 固定距離，不需要 RWD 變焦太複雜

    renderer = new THREE.WebGLRenderer({
        antialias: false, // 效能優先
        alpha: true       // 透明背景
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (container) {
        container.appendChild(renderer.domElement);
    } else {
        console.error("❌ 找不到 #canvas-container，請檢查 HTML");
    }

    // 初始化滑鼠路徑陣列 (全填 0)
    for (let i = 0; i < TRAIL_LENGTH; i++) {
        mousePath.push(new THREE.Vector3(0, 0, 0));
    }

    // 綁定事件
    window.addEventListener("resize", onWindowResize, false);
    document.addEventListener("mousemove", onMouseMove, false);
}

// ==========================================
// 4. 互動事件處理 (Events)
// ==========================================

function onWindowResize() {
    if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
    if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function onMouseMove(event) {
    event.preventDefault();
    if (!camera) return;

    // 1. 計算滑鼠在 3D 世界的位置 (z=0 平面)
    let x = (event.clientX / window.innerWidth) * 2 - 1;
    let y = -(event.clientY / window.innerHeight) * 2 + 1;

    let vector = new THREE.Vector3(x, y, 0.5);
    vector.unproject(camera);
    let dir = vector.sub(camera.position).normalize();
    let distance = -camera.position.z / dir.z;
    let pos = camera.position.clone().add(dir.multiplyScalar(distance));

    mouse3DVec.copy(pos);

    // 2. 狀態切換：移動中 -> 混沌龍模式
    isIdle = false;

    // 3. 重置閒置計時器 (3秒後回到秩序大腦)
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        isIdle = true;
    }, 3000);
}