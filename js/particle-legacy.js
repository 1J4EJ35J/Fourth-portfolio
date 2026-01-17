// js/particle-legacy.js

// ==========================================
// 舊粒子系統 (Legacy Particles 1-5)
// ==========================================

// ----------------------------------------------------------------
// 1. 第一組粒子 (First Particle - 核心呼吸光點)
// ----------------------------------------------------------------

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
        
        // 隨機分配路徑索引
        let pathIndex = Math.floor(distribution * (pConfig.pathLength - 1));
        let speed = pConfig.speedFast * (1 - distribution) + pConfig.speedSlow * distribution;
        let scatter = pConfig.scatterHead * (1 - distribution) + pConfig.scatterTail * distribution;
        
        // 球形分布計算
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

        // 儲存個別粒子物理屬性
        firstParticleData.push({
            speed: speed,
            scatterRadius: scatter * Math.random(),
            angle: Math.random() * Math.PI * 2,
            pathIndex: pathIndex,
        });

        // 顏色計算 (中心亮，邊緣暗)
        let distFromCenter = r / pConfig.sphereRadius;
        let lightness = 0.3 + distFromCenter * 0.4;
        colorObj.setHSL(0.6, 1.0, lightness);
        colors[i3] = colorObj.r;
        colors[i3 + 1] = colorObj.g;
        colors[i3 + 2] = colorObj.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    // 將基礎位置存入 userData 供物理運算使用
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
    
    // 捲動縮放特效
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
    
    // 捲動淡出特效
    gsap.to(firstParticleSystem.material, {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
            trigger: "body",
            start: "1100px top",
            end: "1200px top",
            scrub: 0.1,
            onLeave: () => {
                runFirst = false; // 離開視窗後停止運算以節省效能
            },
            onEnterBack: () => {
                runFirst = true;
            },
        },
    });
}

function updateFirstParticlePhysics() {
    if (!firstParticleSystem) return;
    
    const isScrollUnbound = window.scrollY > 680;
    
    // 計算滑鼠目標點 (若卷軸超過一定位置則歸零，避免干擾)
    let targetPoint = isIdle || isScrollUnbound ? new THREE.Vector3(0, 0, 0) : mouse3DVec;

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
            // 待機模式：呼吸律動
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
            // 跟隨模式：追蹤滑鼠路徑
            let targetIndex = Math.min(pData.pathIndex, mousePath.length - 1);
            let pathPos = mousePath[targetIndex] || mousePath[0];
            let ox = Math.cos(pData.angle) * pData.scatterRadius;
            let oy = Math.sin(pData.angle) * pData.scatterRadius;
            tx = pathPos.x + ox;
            ty = pathPos.y + oy;
            s = pData.speed;
        }
        
        // 簡易 Lerp 插值更新位置
        positions[i3] += (tx - cx) * s;
        positions[i3 + 1] += (ty - cy) * s;
        positions[i3 + 2] = 0;
    }
    firstParticleSystem.geometry.attributes.position.needsUpdate = true;
}


// ----------------------------------------------------------------
// 2. 第二組粒子 (Second Particle - 背景漂浮大光點)
// ----------------------------------------------------------------

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
                // Z軸無限循環運動
                float zOffset = uTime * uSpeed * 5.0 + aRandomness.z * 200.0; 
                pos.z = mod(pos.z + zOffset, uRangeZ * 2.0) - uRangeZ; 
                
                vec4 modelPosition = modelMatrix * vec4(pos, 1.0); 
                vec4 viewPosition = viewMatrix * modelPosition; 
                gl_Position = projectionMatrix * viewPosition; 
                
                gl_PointSize = uSize * (1.0 / -viewPosition.z); 
                
                // 距離邊緣淡出
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
                    if (secondParticleMaterial) secondParticleMaterial.uniforms.uOpacity.value = 0.0;
                },
            },
        }
    );
}


// ----------------------------------------------------------------
// 3. 第三組粒子 (Third Particle - 速度線條)
// ----------------------------------------------------------------

function initThirdParticle() {
    const params = config.thirdParticle;
    const geometry = new THREE.BufferGeometry();
    const vertexCount = params.count * 2; // 線段需要 2 個點
    const positions = new Float32Array(vertexCount * 3);
    const randomness = new Float32Array(vertexCount * 3);
    const sides = new Float32Array(vertexCount); // 標記是線頭還是線尾

    for (let i = 0; i < params.count; i++) {
        const x = (Math.random() - 0.5) * params.rangeXY * 2;
        const y = (Math.random() - 0.5) * params.rangeXY * 2;
        const z = (Math.random() - 0.5) * params.rangeZ * 2;
        
        const randX = Math.random();
        const randY = Math.random();
        const randZ = Math.random();

        // 線頭
        const iHead = i * 2;
        positions[iHead * 3] = x;
        positions[iHead * 3 + 1] = y;
        positions[iHead * 3 + 2] = z;
        randomness[iHead * 3] = randX;
        randomness[iHead * 3 + 1] = randY;
        randomness[iHead * 3 + 2] = randZ;
        sides[iHead] = 0.0;

        // 線尾
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
                
                // 拉伸線尾
                if (aSide > 0.5) { 
                    float stretch = uStreakLength * (1.0 + aRandomness.x); 
                    currentZ -= stretch; 
                    vAlpha = 0.0; // 尾端透明
                } else { 
                    vAlpha = 1.0; // 頭端不透明
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
                    if (thirdParticleMaterial) thirdParticleMaterial.uniforms.uOpacity.value = 0.0;
                },
            },
        }
    );
}


// ----------------------------------------------------------------
// 4. 第四組粒子 (Fourth Particle - 核心能力區塊背景)
// ----------------------------------------------------------------

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
            uOpacity: { value: 0.0 },
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
                
                // 彎曲特效 (Bend)
                float progress = (pos.z + uRangeZ) / (uRangeZ * 2.0); 
                float lift = pow(progress, 3.0) * 3600.0 * uBendFactor; 
                pos.y += lift; 
                pos.x += pos.x * (lift * 0.0001) * uBendFactor; 
                
                vec4 modelPosition = modelMatrix * vec4(pos, 1.0); 
                vec4 viewPosition = viewMatrix * modelPosition; 
                gl_Position = projectionMatrix * viewPosition; 
                
                // 根據 ScrollTrigger 控制可見數量
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


// ----------------------------------------------------------------
// 5. 第五組粒子 (Fifth Particle - 核心能力區塊線條)
// ----------------------------------------------------------------

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
            uOpacity: { value: 0.0 }, 
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
                
                // 彎曲特效 (Bend)
                float progress = (pos.z + uRangeZ) / (uRangeZ * 2.0); 
                float lift = pow(progress, 3.0) * 30000.0 * uBendFactor; 
                pos.y += lift; 
                pos.x += pos.x * (lift * 0.0001) * uBendFactor; 
                
                if(aRandomness.x > uVisibleRatio) { 
                    pos = vec3(999999.0); // 隱藏粒子
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