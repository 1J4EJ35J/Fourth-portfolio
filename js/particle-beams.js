// js/particle-beams.js

// ==========================================
// 光束粒子系統 (Beam System 1-7)
// ==========================================

// ----------------------------------------------------------------
// 1. 路徑初始化 (Path Initialization)
// ----------------------------------------------------------------

function initPathLUTs() {
    // 依賴 particle-utils.js 中的 parsePathToLUT
    const rightData = parsePathToLUT(configBeam.pathRight);
    rightPathLUT = rightData.lut;
    
    const leftData = parsePathToLUT(configBeam.pathLeft);
    leftPathLUT = leftData.lut;
    
    pathHeight = Math.max(rightData.height, leftData.height);
}


// ----------------------------------------------------------------
// 2. 光束工廠函式 (Beam Factory)
// ----------------------------------------------------------------

function createBeamSystem(cfg, type) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(cfg.count * 3);
    const initialData = [];

    for (let i = 0; i < cfg.count; i++) {
        // 隨機分佈在光束的高度範圍內
        const y = THREE.MathUtils.randFloat(
            lightBounds.floorY,
            lightBounds.top + 200
        );

        positions[i * 3] = 0;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = 0;

        // 計算個別粒子的隨機屬性
        const angleRandom = (Math.random() - 0.5) * ((cfg.spread * Math.PI) / 180);
        const thicknessRandom = Math.random() - 0.5;
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

    // 依賴 particle-utils.js 中的 createBlurryTexture
    const texture = createBlurryTexture(cfg.blur);

    const material = new THREE.PointsMaterial({
        color: new THREE.Color(cfg.color),
        size: cfg.size,
        map: texture,
        transparent: true,
        opacity: 0, // 初始隱藏
        sizeAttenuation: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        depthTest: false,
    });

    const system = new THREE.Points(geometry, material);

    // 綁定系統資料到 userData，方便 updateBeam 存取
    system.userData = {
        config: cfg,
        initialData: initialData,
        type: type,
        densityRatio: 0, // 控制顯示數量
        flowRatio: 0,    // 控制流動高度限制
        dead: false,
        originalCount: cfg.count
    };
    return system;
}

function initBeamSystem() {
    // 初始化 1-6 號光束
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

    // ★ 初始化大腦光粒 7 (V62新增)
    brainBeam7System = createBeamSystem(configBeam.brainBeam7, "right");
    brainBeam7System.userData.densityRatio = 0;
    brainBeam7System.material.opacity = 0;
    sceneLight.add(brainBeam7System);
}


// ----------------------------------------------------------------
// 3. 光束更新邏輯 (Beam Update Loop)
// ----------------------------------------------------------------

function updateBeam(system) {
    if (!system) return;
    if (system.userData.dead) return;

    const positions = system.geometry.attributes.position.array;
    const data = system.userData.initialData;
    const type = system.userData.type;
    const cfg = system.userData.config;

    const densityRatio = system.userData.densityRatio;
    const flowRatio = system.userData.flowRatio;
    const fadeRange = configBeam.fadeRange || 300;

    // 決定使用哪條路徑 LUT
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
    const totalHeight = lightBounds.top - lightBounds.floorY;
    
    // 計算繪製邊界 (由下往上流動)
    const drawLimitY = lightBounds.top - (totalHeight * flowRatio);
    const visibleCount = Math.floor(cfg.count * densityRatio);

    for (let i = 0; i < cfg.count; i++) {
        const i3 = i * 3;
        const p = data[i];

        // 向上移動
        p.y -= p.speed;
        
        // 循環機制
        if (p.y < lightBounds.floorY) {
            p.y = lightBounds.top + Math.random() * 100;
        }

        // 計算淡出邊界
        const effectiveLimit = drawLimitY + (p.fadeRandom * fadeRange);

        // 如果超出數量限制或高度限制，則隱藏 (移到無限遠)
        if (i >= visibleCount || p.y < effectiveLimit) {
            positions[i3] = 99999;
            positions[i3 + 1] = 99999;
            positions[i3 + 2] = 99999;
            continue;
        }

        // 計算 X/Z 座標
        let pathX = 0;
        let pathZ = 0;
        let radius = 0;
        const distFromFloor3D = p.y - lightBounds.floorY;
        const distFromFloorPx = Math.max(0, distFromFloor3D / lightBounds.pixelScale);

        // 直線或曲線邏輯
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

        radius += p.thicknessRandom * (cfg.thickness || 0);

        const finalAngle = baseAngle + p.angleRandom + timeRotation;

        pathX = radius * Math.cos(finalAngle);
        pathZ = radius * Math.sin(finalAngle);

        // 加入 Noise 擾動
        const noise = Math.sin(time * 2 + p.noiseOffset) * cfg.noise;
        pathX += noise;
        pathZ += noise * 0.5;

        // 加入散開特效 (Scatter) - 用於轉場
        let scatterX = 0;
        let scatterZ = 0;
        const scatterScale = 2500;
        const driftSpeed = 0.3;

        scatterX = Math.sin(i * 12.9898 + p.noiseOffset) * scatterScale + Math.sin(time * driftSpeed + i * 0.1) * 200;
        scatterZ = Math.cos(i * 78.233 + p.noiseOffset) * scatterScale + Math.cos(time * driftSpeed + i * 0.1) * 200;

        // 最終位置混合
        positions[i3] = pathX + (scatterX - pathX) * beamScatterRatio;
        positions[i3 + 1] = p.y;
        positions[i3 + 2] = pathZ + (scatterZ - pathZ) * beamScatterRatio;
    }

    system.geometry.attributes.position.needsUpdate = true;
}


// ----------------------------------------------------------------
// 4. 光束觸發控制 (ScrollTriggers)
// ----------------------------------------------------------------

function initBeamScrollTriggers() {
    // 開關控制
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

    // 散開與透明度控制 (連接到 Portfolio)
    ScrollTrigger.create({
        trigger: ".portfolio-spacer-1",
        start: "top 320px",
        end: "top 100px",
        scrub: 0.1,
        onUpdate: (self) => {
            const p = self.progress;
            beamScatterRatio = p;

            // 連動控制 Brain Beam 7
            if (brainBeam7System) {
                brainBeam7System.userData.densityRatio = p;
                brainBeam7System.material.opacity = p * (brainBeam7System.userData.config.opacity || 1);
            }
        },
        onEnter: () => {
            runBrainBeam7 = true;
        },
        onLeaveBack: () => {
            runBrainBeam7 = false;
            if (brainBeam7System) {
                brainBeam7System.userData.densityRatio = 0;
                brainBeam7System.material.opacity = 0;
            }
        }
    });

    // 死亡與淡出控制
    ScrollTrigger.create({
        trigger: ".portfolio-spacer-1",
        start: "top -20px",
        end: "top -320px",
        scrub: 0.1,
        onUpdate: (self) => {
            const opacity = 1.0 - self.progress;
            
            // Beam 6 加入淡出名單
            const fadingBeams = [beam1System, beam3System, beam5System, beam6System];
            fadingBeams.forEach(sys => {
                if(sys) {
                    sys.material.opacity = opacity * (sys.userData.config.opacity || 1);
                    if(opacity > 0) sys.userData.dead = false;
                }
            });

            // Beam 4 (Unbound) 也要淡出
            const unboundBeams = [beam4System];
            unboundBeams.forEach(sys => {
                if(sys) {
                    sys.material.opacity = opacity * (sys.userData.config.opacity || 1);
                    if(opacity > 0) sys.userData.dead = false;
                }
            });
        },
        onLeave: () => {
            // 完全離開後標記為 dead 以停止運算
            const allTargets = [beam1System, beam3System, beam5System, beam4System, beam6System];
            allTargets.forEach(sys => {
                if(sys) {
                    sys.userData.dead = true;
                    sys.geometry.setDrawRange(0, 0);
                }
            });
        },
        onEnterBack: () => {
            // 返回時復活
            const allTargets = [beam1System, beam3System, beam5System, beam4System, beam6System];
            allTargets.forEach(sys => {
                if(sys) {
                    sys.userData.dead = false;
                    sys.geometry.setDrawRange(0, sys.userData.originalCount);
                }
            });
        }
    });

    // 輔助函式：批量更新
    const updateSystem = (sys1, sys2, prop, val) => {
        if (sys1) sys1.userData[prop] = val;
        if (sys2) sys2.userData[prop] = val;
    };
    const updateOpacity = (sys1, sys2, val) => {
        if (sys1) sys1.material.opacity = val * (sys1.userData.config.opacity || 1);
        if (sys2) sys2.material.opacity = val * (sys2.userData.config.opacity || 1);
    };

    // --- 詳細的 Beam 1-6 進場流程控制 ---
    
    // Beam 1 & 2
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

    // Beam 3 & 4
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

    // Beam 5 & 6 & BrainBeam 7 Flow
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
            
            // BrainBeam 7 也要跟著流動
            if(brainBeam7System) {
                brainBeam7System.userData.flowRatio = self.progress;
            }
        }
    });
}