// js/particle-brain.js

// ==========================================
// 大腦粒子系統 (Brain System)
// & 未來的沙粒系統 (Sand System)
// ==========================================

// ----------------------------------------------------------------
// 1. 初始化與資源載入 (Initialization)
// ----------------------------------------------------------------

async function initThreeLayerBrain() {
    console.log("🧠 開始初始化三層大腦粒子 (Golden Ratio Sampling & Custom Blur)...");

    try {
        // 並行載入三張圖片 (依賴 particle-utils.js 的 sampleImage)
        // 這些變數 (brainData1等) 已在 particle-core.js 宣告為全域
        const [data1, data2, data3] = await Promise.all([
            sampleImage('./asset/img/brain01.png', config.brainLayer1.count, config.brainLayer1.scatterRange, config.brainLayer1.zOffset),
            sampleImage('./asset/img/brain02.png', config.brainLayer2.count, config.brainLayer2.scatterRange, config.brainLayer2.zOffset),
            sampleImage('./asset/img/brain03.png', config.brainLayer3.count, config.brainLayer3.scatterRange, config.brainLayer3.zOffset)
        ]);

        brainData1 = data1;
        brainData2 = data2;
        brainData3 = data3;

        // 建立粒子系統
        createBrainSystem1();
        createBrainSystem2();
        createBrainSystem3();

        // 啟動 ScrollTriggers
        initBrainScrollTriggers();

        console.log(`✅ 大腦粒子載入完成: L1(${data1.length}), L2(${data2.length}), L3(${data3.length})`);

    } catch (err) {
        console.error("❌ 大腦圖片載入失敗:", err);
    }
}


// ----------------------------------------------------------------
// 2. 建立各層級系統 (Layer Factories)
// ----------------------------------------------------------------

// Layer 1: Base (Navy Blue) - 基礎輪廓
function createBrainSystem1() {
    if (!brainData1.length) return;
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(brainData1.length * 3);

    for (let i = 0; i < brainData1.length; i++) {
        const p = brainData1[i];
        // 初始位置設定為散開狀態 (p.initial)
        positions[i * 3] = p.initialX;
        positions[i * 3 + 1] = p.initialY;
        positions[i * 3 + 2] = p.initialZ;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // 使用 particle-utils.js 的 createBrainTexture
    const texture = createBrainTexture(config.brainLayer1.blur);
    
    const material = new THREE.PointsMaterial({
        size: config.brainLayer1.size,
        color: new THREE.Color(config.brainLayer1.color),
        map: texture,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0, // 初始隱藏
        depthWrite: false
    });

    brainSystem1 = new THREE.Points(geometry, material);
    scene.add(brainSystem1);
}

// Layer 2: Network (Blue) - 連結網路，負責主要的變形動畫
function createBrainSystem2() {
    if (!brainData2.length) return;
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(brainData2.length * 3);

    for (let i = 0; i < brainData2.length; i++) {
        const p = brainData2[i];
        positions[i * 3] = p.initialX;
        positions[i * 3 + 1] = p.initialY;
        positions[i * 3 + 2] = p.initialZ;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const texture = createBrainTexture(config.brainLayer2.blur);
    
    const material = new THREE.PointsMaterial({
        size: config.brainLayer2.size,
        color: new THREE.Color(config.brainLayer2.color),
        map: texture,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0,
        depthWrite: false
    });

    brainSystem2 = new THREE.Points(geometry, material);
    scene.add(brainSystem2);
}

// Layer 3: Highlight (Cyan) - 高亮閃爍節點
function createBrainSystem3() {
    if (!brainData3.length) return;
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(brainData3.length * 3);
    const randomness = new Float32Array(brainData3.length); // 用於閃爍相位

    for (let i = 0; i < brainData3.length; i++) {
        const p = brainData3[i];
        positions[i * 3] = p.initialX;
        positions[i * 3 + 1] = p.initialY;
        positions[i * 3 + 2] = p.initialZ;
        randomness[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 1));

    const texture = createBrainTexture(config.brainLayer3.blur);
    
    // 使用 ShaderMaterial 實現獨立閃爍效果
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(config.brainLayer3.color) },
            uTexture: { value: texture },
            uOpacity: { value: 0 },
            uFlashSpeed: { value: config.brainLayer3.flashSpeed },
            uSize: { value: config.brainLayer3.size }
        },
        vertexShader: `
            attribute float aRandomness;
            varying float vRandom;
            uniform float uSize;
            void main() {
                vRandom = aRandomness;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                // 基礎大小校正，隨距離縮放
                gl_PointSize = uSize * (1.0 / -mvPosition.z) * 500.0; 
            }
        `,
        fragmentShader: `
            uniform sampler2D uTexture;
            uniform vec3 uColor;
            uniform float uOpacity;
            uniform float uTime;
            uniform float uFlashSpeed;
            varying float vRandom;
            void main() {
                vec4 tex = texture2D(uTexture, gl_PointCoord);
                if(tex.a < 0.1) discard;
                
                // 閃爍邏輯 (Sin wave + Random offset)
                float flash = (sin(uTime * uFlashSpeed + vRandom * 10.0) + 1.0) * 0.5;
                flash = 0.5 + flash * 0.5; // 限制最低亮度，避免全黑
                
                gl_FragColor = vec4(uColor, tex.a * uOpacity * flash);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    brainSystem3 = new THREE.Points(geometry, material);
    scene.add(brainSystem3);
}


// ----------------------------------------------------------------
// 3. 更新迴圈 (Update Loop)
// ----------------------------------------------------------------

function updateBrainParticles() {
    // Layer 1 (Base) - 直接鎖定在 Target，不進行插值運算以保持穩定
    if (runBrainLayer1 && brainSystem1) {
        const pos = brainSystem1.geometry.attributes.position.array;
        for (let i = 0; i < brainData1.length; i++) {
            const i3 = i * 3;
            const p = brainData1[i];
            pos[i3]     = p.targetX;
            pos[i3 + 1] = p.targetY;
            pos[i3 + 2] = p.targetZ;
        }
        brainSystem1.geometry.attributes.position.needsUpdate = true;
    }

    // Layer 2 (Network) - 維持原本的插值運動 (Lerp)，製造聚合效果
    if (runBrainLayer2 && brainSystem2) {
        const pos = brainSystem2.geometry.attributes.position.array;
        for (let i = 0; i < brainData2.length; i++) {
            const i3 = i * 3;
            const p = brainData2[i];
            // 根據 brainRatio2 (ScrollTrigger進度) 進行插值
            pos[i3] = p.initialX + (p.targetX - p.initialX) * brainRatio2;
            pos[i3 + 1] = p.initialY + (p.targetY - p.initialY) * brainRatio2;
            pos[i3 + 2] = p.initialZ + (p.targetZ - p.initialZ) * brainRatio2;
        }
        brainSystem2.geometry.attributes.position.needsUpdate = true;
    }

    // Layer 3 (Highlight) - 鎖定位置，但更新 Time 以驅動閃爍
    if (runBrainLayer3 && brainSystem3) {
        const pos = brainSystem3.geometry.attributes.position.array;
        for (let i = 0; i < brainData3.length; i++) {
            const i3 = i * 3;
            const p = brainData3[i];
            pos[i3]     = p.targetX;
            pos[i3 + 1] = p.targetY;
            pos[i3 + 2] = p.targetZ;
        }
        brainSystem3.geometry.attributes.position.needsUpdate = true;
        // 更新 Shader 時間參數
        brainSystem3.material.uniforms.uTime.value = time;
    }
}


// ----------------------------------------------------------------
// 4. 觸發控制 (ScrollTriggers)
// ----------------------------------------------------------------

function initBrainScrollTriggers() {
    const triggerEl = ".portfolio-spacer-1";

    // Layer 1 Control (Base)
    ScrollTrigger.create({
        trigger: triggerEl,
        start: "top -320px",
        end: "top -440px",
        scrub: 0.1,
        onUpdate: (self) => {
            brainRatio1 = self.progress;
            if (brainSystem1) {
                brainSystem1.material.opacity = self.progress * config.brainLayer1.opacity;
            }
        },
        onEnter: () => {
            runBrainLayer1 = true;
        },
        onLeaveBack: () => {
            runBrainLayer1 = false;
            if (brainSystem1) {
                brainSystem1.material.opacity = 0;
            }
        }
    });

    // Layer 2 Control (Network - 主要動態層)
    ScrollTrigger.create({
        trigger: triggerEl,
        start: "top 100px",
        end: "top -300px",
        scrub: 0.1,
        onUpdate: (self) => {
            brainRatio2 = self.progress;
            if (brainSystem2) {
                brainSystem2.material.opacity = self.progress * config.brainLayer2.opacity;
            }
        },
        onEnter: () => {
            runBrainLayer2 = true;
        },
        onLeaveBack: () => {
            runBrainLayer2 = false;
            if (brainSystem2) {
                brainSystem2.material.opacity = 0;
            }
        }
    });

    // Layer 3 Control (Highlight)
    ScrollTrigger.create({
        trigger: triggerEl,
        start: "top -400px",
        end: "top -480px",
        scrub: 0.1,
        onUpdate: (self) => {
            brainRatio3 = self.progress;
            if (brainSystem3) {
                brainSystem3.material.uniforms.uOpacity.value = self.progress * config.brainLayer3.opacity;
            }
        },
        onEnter: () => {
            runBrainLayer3 = true;
        },
        onLeaveBack: () => {
            runBrainLayer3 = false;
            if (brainSystem3) {
                brainSystem3.material.uniforms.uOpacity.value = 0;
            }
        }
    });
}


// ==========================================
// ★ 未來擴充區域：沙粒系統 (Sand System) ★
// ==========================================
// 下一步：我們將在此處新增 initSandParticleSystem() 與 updateSandParticles()
// 以實現 "The Spirit" 變形特效。