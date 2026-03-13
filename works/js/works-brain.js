// js/works/works-brain.js

// ==========================================
// 分頁大腦粒子系統 (Works Brain System)
// 邏輯：秩序大腦 <-> 混沌長龍
// ==========================================

// ----------------------------------------------------------------
// 1. 初始化入口 (Entry)
// ----------------------------------------------------------------

async function initWorksBrain() {
    console.log("🐲 初始化 Works 大腦龍系統...");

    try {
        // 載入 4 層大腦圖片 (Brain 1-4)
        // 注意：這裡假設 particle-utils.js 已經引入 HTML
        const [data1, data2, data3, data4] = await Promise.all([
            sampleImage('../../asset/img/brain01.png', worksConfig.layer1.count, 2000, 0),
            sampleImage('../../asset/img/brain02.png', worksConfig.layer2.count, 2000, 0),
            sampleImage('../../asset/img/brain03.png', worksConfig.layer3.count, 2000, 0),
            sampleImage('../../asset/img/brain04.png', worksConfig.layer4.count, 2000, 0)
        ]);

        brainData1 = data1;
        brainData2 = data2;
        brainData3 = data3;
        brainData4 = data4;

        // 建立各層系統
        brainSystem1 = createBrainLayer(brainData1, worksConfig.layer1);
        brainSystem2 = createBrainLayer(brainData2, worksConfig.layer2);
        brainSystem3 = createBrainLayer(brainData3, worksConfig.layer3);
        brainSystem4 = createBrainLayer(brainData4, worksConfig.layer4);

        // 建立龍頭光束 (Beam 7) - 這是程式生成的，沒有圖片
        brainBeam7System = createDragonHead(worksConfig.beam7);

        // 啟動動畫迴圈
        animateWorks();

        console.log("✅ Works 大腦系統就緒：等待滑鼠喚醒");

    } catch (err) {
        console.error("❌ 圖片載入失敗:", err);
    }
}

// ----------------------------------------------------------------
// 2. 系統工廠 (Factory)
// ----------------------------------------------------------------

// 通用大腦層生成器
function createBrainLayer(data, cfg) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(data.length * 3);
    const randomness = new Float32Array(data.length * 3); // 用於龍型態的擴散

    for (let i = 0; i < data.length; i++) {
        // 初始位置 = 圖片原始位置 (直接定格，不做 Scroll 入場)
        positions[i * 3] = data[i].targetX;
        positions[i * 3 + 1] = data[i].targetY;
        positions[i * 3 + 2] = data[i].targetZ;

        // 隨機擴散向量 (讓龍看起來有體積，不是一條線)
        randomness[i * 3] = (Math.random() - 0.5) * worksConfig.dragonSpread;
        randomness[i * 3 + 1] = (Math.random() - 0.5) * worksConfig.dragonSpread;
        randomness[i * 3 + 2] = (Math.random() - 0.5) * worksConfig.dragonSpread;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    // 儲存原始數據與亂數供 Update 使用
    geometry.userData = { original: data, random: randomness };

    const texture = createBrainTexture(cfg.blur); // 使用 utils 裡的材質生成

    const material = new THREE.PointsMaterial({
        size: cfg.size,
        color: new THREE.Color(cfg.color),
        map: texture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 1.0 // ★ 重點：直接顯示，不需 ScrollTrigger
    });

    const system = new THREE.Points(geometry, material);
    scene.add(system);
    return system;
}

// 龍頭光束生成器 (Beam 7)
function createDragonHead(cfg) {
    const geometry = new THREE.BufferGeometry();
    const count = cfg.count;
    const positions = new Float32Array(count * 3);
    const randomness = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        // 初始聚集在中心
        positions[i * 3] = 0; positions[i * 3 + 1] = 0; positions[i * 3 + 2] = 0;

        // 龍頭比較密集，擴散小一點
        randomness[i * 3] = (Math.random() - 0.5) * 50;
        randomness[i * 3 + 1] = (Math.random() - 0.5) * 50;
        randomness[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.userData = { random: randomness };

    const material = new THREE.PointsMaterial({
        size: cfg.size,
        color: new THREE.Color(cfg.color),
        map: createGlowingDot(), // 使用 utils 裡的發光材質
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 1.0
    });

    const system = new THREE.Points(geometry, material);
    scene.add(system);
    return system;
}

// ----------------------------------------------------------------
// 3. 物理運算核心 (Physics Engine)
// ----------------------------------------------------------------

function updatePhysics(system, cfg, isHead = false) {
    if (!system) return;

    const positions = system.geometry.attributes.position.array;
    const randoms = system.geometry.userData.random;
    const originals = system.geometry.userData.original; // Beam7 沒有這個

    // 取得該層級應該追隨的路徑節點索引 (依序跟隨)
    // 確保索引不超出範圍
    let trailIdx = Math.min(cfg.trailIndex, mousePath.length - 1);
    let targetBase = mousePath[trailIdx]; // 這是龍脊椎的位置

    // 決定移動速度
    const speed = isIdle ? worksConfig.returnSpeed : worksConfig.lerpSpeed;

    for (let i = 0; i < system.geometry.attributes.position.count; i++) {
        const i3 = i * 3;

        // 當前粒子位置
        let cx = positions[i3];
        let cy = positions[i3 + 1];
        let cz = positions[i3 + 2];

        let tx, ty, tz;

        if (isIdle) {
            // --- 模式 A: 秩序歸位 (回到大腦) ---
            if (isHead) {
                // Beam 7 歸位時隱藏到大腦中心 (或散佈在特定的高亮點，這裡簡化為回到中心)
                tx = 0; ty = 0; tz = 0;
            } else {
                // 其他層回到圖片原始座標
                tx = originals[i].targetX;
                ty = originals[i].targetY;
                tz = originals[i].targetZ;
            }
        } else {
            // --- 模式 B: 混沌長龍 (跟隨滑鼠) ---
            // 目標 = 龍脊椎位置 + 該粒子的隨機擴散 (形成體積)
            tx = targetBase.x + randoms[i3];
            ty = targetBase.y + randoms[i3 + 1];
            tz = randoms[i3 + 2]; // Z軸也隨機，增加立體感
        }

        // 執行 Lerp 插值移動
        positions[i3] += (tx - cx) * speed;
        positions[i3 + 1] += (ty - cy) * speed;
        positions[i3 + 2] += (tz - cz) * speed;
    }

    system.geometry.attributes.position.needsUpdate = true;
}

// ----------------------------------------------------------------
// 4. 動畫迴圈 (Loop)
// ----------------------------------------------------------------

function animateWorks() {
    requestAnimationFrame(animateWorks);
    time += 0.02;

    // A. 更新滑鼠路徑 (龍的脊椎)
    // 無論是否 Idle 都要更新，這樣滑鼠一動，龍頭可以直接抓到最新位置
    // 如果 Idle，mouse3DVec 會停在最後位置，不影響歸位邏輯
    if (!isIdle) {
        // 將最新滑鼠位置推入陣列頭部
        mousePath.unshift(mouse3DVec.clone());
        // 移除尾部，保持陣列長度固定
        if (mousePath.length > TRAIL_LENGTH) {
            mousePath.pop();
        }
    }

    // B. 更新各層粒子物理
    // 順序：Beam7(頭) -> L4 -> L3 -> L2 -> L1(尾)
    updatePhysics(brainBeam7System, worksConfig.beam7, true);
    updatePhysics(brainSystem4, worksConfig.layer4);
    updatePhysics(brainSystem3, worksConfig.layer3);
    updatePhysics(brainSystem2, worksConfig.layer2);
    updatePhysics(brainSystem1, worksConfig.layer1);

    // C. 渲染
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// 啟動入口
initWorksScene(); // 先建立場景
initWorksBrain(); // 再建立大腦與啟動迴圈