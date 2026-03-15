// js/particle-brain.js

// ==========================================
// 大腦粒子系統 (Brain System)
// & 未來的沙粒系統 (Sand System)
// ==========================================

// ----------------------------------------------------------------
// 1. 初始化與資源載入 (Initialization)
// ----------------------------------------------------------------

async function initThreeLayerBrain() {
    console.log("🧠 開始初始化四層大腦粒子 (Golden Ratio Sampling & Custom Blur)...");

    try {
        // 並行載入四張圖片 (依賴 particle-utils.js 的 sampleImage)
        // 這些變數 (brainData1等) 已在 particle-core.js 宣告為全域
        const [data1, data2, data3, data4] = await Promise.all([
            sampleImage('./asset/img/brain01.png', config.brainLayer1.count, config.brainLayer1.scatterRange, config.brainLayer1.zOffset),
            sampleImage('./asset/img/brain02.png', config.brainLayer2.count, config.brainLayer2.scatterRange, config.brainLayer2.zOffset),
            sampleImage('./asset/img/brain03.png', config.brainLayer3.count, config.brainLayer3.scatterRange, config.brainLayer3.zOffset),
            // ★ 新增 Layer 4 圖片載入
            sampleImage('./asset/img/brain04.png', config.brainLayer4.count, config.brainLayer4.scatterRange, config.brainLayer4.zOffset)
        ]);

        brainData1 = data1;
        brainData2 = data2;
        brainData3 = data3;
        brainData4 = data4; // ★ 儲存 Layer 4 數據

        // 建立粒子系統
        createBrainSystem1();
        createBrainSystem2();
        createBrainSystem3();
        createBrainSystem4(); // ★ 建立 Layer 4 系統

        // 啟動 ScrollTriggers
        initBrainScrollTriggers();

        console.log(`✅ 大腦粒子載入完成: L1(${data1.length}), L2(${data2.length}), L3(${data3.length}), L4(${data4.length})`);

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
        positions[i * 3] = p.initialX;
        positions[i * 3 + 1] = p.initialY;
        positions[i * 3 + 2] = p.initialZ;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const texture = createBrainTexture(config.brainLayer1.blur);

    const material = new THREE.PointsMaterial({
        size: config.brainLayer1.size,
        color: new THREE.Color(config.brainLayer1.color),
        map: texture,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0,
        depthWrite: false
    });

    brainSystem1 = new THREE.Points(geometry, material);
    scene.add(brainSystem1);
}

// Layer 2: Network (Blue) - 連結網路
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
    const randomness = new Float32Array(brainData3.length);

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
                float flash = (sin(uTime * uFlashSpeed + vRandom * 10.0) + 1.0) * 0.5;
                flash = 0.5 + flash * 0.5;
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

// ★ 新增 Layer 4: Extra Highlight (複製 Layer 3 邏輯)
function createBrainSystem4() {
    if (!brainData4.length) return;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(brainData4.length * 3);
    const randomness = new Float32Array(brainData4.length);

    for (let i = 0; i < brainData4.length; i++) {
        const p = brainData4[i];
        positions[i * 3] = p.initialX;
        positions[i * 3 + 1] = p.initialY;
        positions[i * 3 + 2] = p.initialZ;
        randomness[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 1));

    // 使用 config.brainLayer4
    const texture = createBrainTexture(config.brainLayer4.blur);

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(config.brainLayer4.color) },
            uTexture: { value: texture },
            uOpacity: { value: 0 },
            uFlashSpeed: { value: config.brainLayer4.flashSpeed },
            uSize: { value: config.brainLayer4.size }
        },
        // Vertex Shader 與 Layer 3 相同
        vertexShader: `
            attribute float aRandomness;
            varying float vRandom;
            uniform float uSize;
            void main() {
                vRandom = aRandomness;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = uSize * (1.0 / -mvPosition.z) * 500.0; 
            }
        `,
        // Fragment Shader 與 Layer 3 相同 (含閃爍)
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
                float flash = (sin(uTime * uFlashSpeed + vRandom * 10.0) + 1.0) * 0.5;
                flash = 0.5 + flash * 0.5;
                gl_FragColor = vec4(uColor, tex.a * uOpacity * flash);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    brainSystem4 = new THREE.Points(geometry, material);
    scene.add(brainSystem4);
}


// ----------------------------------------------------------------
// 3. 更新迴圈 (Update Loop)
// ----------------------------------------------------------------
// 新增一個變數來控制解除綁定的比例 (0 = 完全綁定, 1 = 完全散開)
let brainUnbindRatio = 0;

function updateBrainParticles() {
    // Layer 1 (不再參與 unbind，固定在 target)
    if (runBrainLayer1 && brainSystem1) {
        const pos = brainSystem1.geometry.attributes.position.array;
        for (let i = 0; i < brainData1.length; i++) {
            const i3 = i * 3;
            const p = brainData1[i];
            pos[i3] = p.targetX;
            pos[i3 + 1] = p.targetY;
            pos[i3 + 2] = p.targetZ;
        }
        brainSystem1.geometry.attributes.position.needsUpdate = true;
    }

    // Layer 2 (維持原本的進場動畫比例控制)
    if (runBrainLayer2 && brainSystem2) {
        const pos = brainSystem2.geometry.attributes.position.array;
        for (let i = 0; i < brainData2.length; i++) {
            const i3 = i * 3;
            const p = brainData2[i];
            pos[i3] = p.initialX + (p.targetX - p.initialX) * brainRatio2;
            pos[i3 + 1] = p.initialY + (p.targetY - p.initialY) * brainRatio2;
            pos[i3 + 2] = p.initialZ + (p.targetZ - p.initialZ) * brainRatio2;
        }
        brainSystem2.geometry.attributes.position.needsUpdate = true;
    }

    // Layer 3 (唯一保留 unbind 消散效果的層級)
    if (runBrainLayer3 && brainSystem3) {
        const pos = brainSystem3.geometry.attributes.position.array;
        for (let i = 0; i < brainData3.length; i++) {
            const i3 = i * 3;
            const p = brainData3[i];
            pos[i3] = p.targetX + (p.initialX - p.targetX) * brainUnbindRatio;
            pos[i3 + 1] = p.targetY + (p.initialY - p.targetY) * brainUnbindRatio;
            pos[i3 + 2] = p.targetZ + (p.initialZ - p.targetZ) * brainUnbindRatio;
        }
        brainSystem3.geometry.attributes.position.needsUpdate = true;
        brainSystem3.material.uniforms.uTime.value = time;
    }

    // Layer 4 (不再參與 unbind，固定在 target)
    if (runBrainLayer4 && brainSystem4) {
        const pos = brainSystem4.geometry.attributes.position.array;
        for (let i = 0; i < brainData4.length; i++) {
            const i3 = i * 3;
            const p = brainData4[i];
            pos[i3] = p.targetX;
            pos[i3 + 1] = p.targetY;
            pos[i3 + 2] = p.targetZ;
        }
        brainSystem4.geometry.attributes.position.needsUpdate = true;
        brainSystem4.material.uniforms.uTime.value = time;
    }
}

// ----------------------------------------------------------------
// 4. 觸發控制 (ScrollTriggers)
// ----------------------------------------------------------------

function initBrainScrollTriggers() {
    const triggerEl = ".portfolio-spacer-1";

    // Layer 1
    ScrollTrigger.create({
        trigger: triggerEl,
        start: "top -620px",
        end: "top -840px",
        scrub: 0.1,
        onUpdate: (self) => {
            brainRatio1 = self.progress;
            if (brainSystem1) brainSystem1.material.opacity = self.progress * config.brainLayer1.opacity;
        },
        onEnter: () => runBrainLayer1 = true,
        onLeaveBack: () => {
            runBrainLayer1 = false;
            if (brainSystem1) brainSystem1.material.opacity = 0;
        }
    });

    // Layer 2
    ScrollTrigger.create({
        trigger: triggerEl,
        start: "top 100px",
        end: "top -330px",
        scrub: 0.1,
        onUpdate: (self) => {
            brainRatio2 = self.progress;
            if (brainSystem2) brainSystem2.material.opacity = self.progress * config.brainLayer2.opacity;
        },
        onEnter: () => runBrainLayer2 = true,
        onLeaveBack: () => {
            runBrainLayer2 = false;
            if (brainSystem2) brainSystem2.material.opacity = 0;
        }
    });

    // Layer 3
    ScrollTrigger.create({
        trigger: triggerEl,
        start: "top -500px",
        end: "top -780px",
        scrub: 0.1,
        onUpdate: (self) => {
            brainRatio3 = self.progress;
            if (brainSystem3) brainSystem3.material.uniforms.uOpacity.value = self.progress * config.brainLayer3.opacity;
        },
        onEnter: () => runBrainLayer3 = true,
        onLeaveBack: () => {
            runBrainLayer3 = false;
            if (brainSystem3) brainSystem3.material.uniforms.uOpacity.value = 0;
        }
    });

    // ★ 新增 Layer 4 (觸發參數完全複製 Layer 3)
    ScrollTrigger.create({
        trigger: triggerEl,
        start: "top -500px",
        end: "top -780px",
        scrub: 0.1,
        onUpdate: (self) => {
            brainRatio4 = self.progress;
            if (brainSystem4) {
                brainSystem4.material.uniforms.uOpacity.value = self.progress * config.brainLayer4.opacity;
            }
        },
        onEnter: () => {
            runBrainLayer4 = true;
        },
        onLeaveBack: () => {
            runBrainLayer4 = false;
            if (brainSystem4) {
                brainSystem4.material.uniforms.uOpacity.value = 0;
            }
        }
    });

    // ==========================================
    // ★ 退場階段 1：Layer 1, 2, 4 提早淡出並關閉
    // ==========================================
    ScrollTrigger.create({
        trigger: ".hireme-spacer-1",
        start: "top 390px",
        end: "top 200px",
        scrub: 0.1,
        onUpdate: (self) => {
            const fadeRatio = 1.0 - self.progress;

            if (brainSystem1) brainSystem1.material.opacity = fadeRatio * config.brainLayer1.opacity;
            if (brainSystem2) brainSystem2.material.opacity = fadeRatio * config.brainLayer2.opacity;
            if (brainSystem4) brainSystem4.material.uniforms.uOpacity.value = fadeRatio * config.brainLayer4.opacity;
        },
        onLeave: () => {
            runBrainLayer1 = false;
            runBrainLayer2 = false;
            runBrainLayer4 = false;

            if (brainSystem1) brainSystem1.material.opacity = 0;
            if (brainSystem2) brainSystem2.material.opacity = 0;
            if (brainSystem4) brainSystem4.material.uniforms.uOpacity.value = 0;
        },
        onEnterBack: () => {
            runBrainLayer1 = true;
            runBrainLayer2 = true;
            runBrainLayer4 = true;
        }
    });

    // ==========================================
    // ★ 退場階段 2：Layer 3 單獨解除座標綁定 (開始消散)
    // ==========================================
    ScrollTrigger.create({
        trigger: ".hireme-spacer-1",
        start: "top 220px",
        end: "top -240px",
        scrub: 0.1,
        onUpdate: (self) => {
            // progress 從 0 -> 1，代表粒子從目標點漸漸退回四散的初始點
            brainUnbindRatio = self.progress;
        }
    });

    // ==========================================
    // ★ 退場階段 3：Layer 3 單獨淡出並關閉運算
    // ==========================================
    ScrollTrigger.create({
        trigger: ".hireme-spacer-1",
        start: "top 40px",
        end: "top -200px",
        scrub: 0.1,
        onUpdate: (self) => {
            const fadeRatio = 1.0 - self.progress;
            if (brainSystem3) brainSystem3.material.uniforms.uOpacity.value = fadeRatio * config.brainLayer3.opacity;
        },
        onLeave: () => {
            runBrainLayer3 = false;
            if (brainSystem3) brainSystem3.material.uniforms.uOpacity.value = 0;
        },
        onEnterBack: () => {
            runBrainLayer3 = true;
        }
    });
}

