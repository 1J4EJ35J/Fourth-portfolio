// js/particle-main.js

// ==========================================
// 主程式：動畫迴圈、特效與入口 (Main & Entry)
// ==========================================

// ----------------------------------------------------------------
// 1. 動畫迴圈 (Animation Loop)
// ----------------------------------------------------------------

function animate() {
    requestAnimationFrame(animate);
    time += 0.015;

    // --- A. 更新舊粒子系統 ---
    if (runFirst) updateFirstParticlePhysics();
    
    if (runSecond && secondParticleMaterial && secondParticleMaterial.uniforms) {
        secondParticleMaterial.uniforms.uTime.value = time;
    }
    
    if (runThird && thirdParticleMaterial && thirdParticleMaterial.uniforms) {
        thirdParticleMaterial.uniforms.uTime.value = time;
    }
    
    if (runFourth && fourthParticleMaterial && fourthParticleMaterial.uniforms) {
        fourthParticleMaterial.uniforms.uTime.value = time;
    }
    
    if (runFifth && fifthParticleMaterial && fifthParticleMaterial.uniforms) {
        fifthParticleMaterial.uniforms.uTime.value = time;
    }

    // --- B. 更新大腦粒子 (Brain) ---
    // ★ 修改：加入 runBrainLayer4 判斷
    if (runBrainLayer1 || runBrainLayer2 || runBrainLayer3 || runBrainLayer4) {
        updateBrainParticles();
    }

    // --- C. 更新光束 (Beams) ---
    if (runBeams) {
        if (beam1System) updateBeam(beam1System);
        if (beam2System) updateBeam(beam2System);
        if (beam3System) updateBeam(beam3System);
        if (beam4System) updateBeam(beam4System);
        if (beam5System) updateBeam(beam5System);
        if (beam6System) updateBeam(beam6System);
        
        // 大腦光粒 7
        if (brainBeam7System) updateBeam(brainBeam7System);
    }

    // --- D. 渲染畫面 ---
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
    
    if (rendererLight && sceneLight && cameraLight) {
        rendererLight.render(sceneLight, cameraLight);
    }
}


// ----------------------------------------------------------------
// 2. 頁面 DOM 特效 (DOM Effects)
// ----------------------------------------------------------------

function initTunnelEffects() {
    const walls = [
        { el: ".wall-1", start: 700, out: 1400, end: 1500, x: 60, y: 10 },
        { el: ".wall-2", start: 700, out: 1600, end: 1700, x: -60, y: 20 },
        { el: ".wall-3", start: 700, out: 1800, end: 1900, x: 40, y: -20 },
        { el: ".wall-4", start: 720, out: 2000, end: 2100, x: -20, y: -50 },
        { el: ".wall-5", start: 720, out: 2000, end: 2150, x: 10, y: 50 },
    ];

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

function initCompetenciesEffects() {
    const aboutWrapper = document.querySelector(".about-wrapper-outer");
    const spacer1 = document.querySelector(".competencies-spacer-1");
    const background2 = document.querySelector(".background-layer-2");

    if (!aboutWrapper || !spacer1) return;
    
    // Trigger 1: 進場
    ScrollTrigger.create({
        trigger: aboutWrapper,
        start: "top -25%",
        end: "top -145%",
        scrub: 0.1,
        onEnter: () => {
            runFourth = true;
            runFifth = true;
            if (fourthParticleMaterial) fourthParticleMaterial.uniforms.uOpacity.value = 1.0;
            if (fifthParticleMaterial) fifthParticleMaterial.uniforms.uOpacity.value = 1.0;
        },
        onUpdate: (self) => {
            const p = self.progress;

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
            if (secondParticleMaterial) secondParticleMaterial.uniforms.uOpacity.value = 0;
            if (thirdParticleMaterial) thirdParticleMaterial.uniforms.uOpacity.value = 0;
        },
        onEnterBack: () => {
            runSecond = true;
            runThird = true;
        },
        onLeaveBack: () => {
            runFourth = false;
            runFifth = false;
            if (fourthParticleMaterial) {
                fourthParticleMaterial.uniforms.uVisibleRatio.value = 0;
                fourthParticleMaterial.uniforms.uBendFactor.value = 0;
                fourthParticleMaterial.uniforms.uOpacity.value = 0.0;
            }
            if (fifthParticleMaterial) {
                fifthParticleMaterial.uniforms.uVisibleRatio.value = 0;
                fifthParticleMaterial.uniforms.uBendFactor.value = 0;
                fifthParticleMaterial.uniforms.uOpacity.value = 0.0;
            }
        },
    });

    // Trigger 2: 離場遞減
    ScrollTrigger.create({
        trigger: spacer1,
        start: "top -80px",
        end: "top -680px",
        scrub: 0.1,
        onUpdate: (self) => {
            const ratio = 1.0 - self.progress; 
            if (fourthParticleMaterial && fourthParticleMaterial.uniforms) {
                fourthParticleMaterial.uniforms.uVisibleRatio.value = ratio;
                fourthParticleMaterial.uniforms.uOpacity.value = 1.0;
            }
            if (fifthParticleMaterial && fifthParticleMaterial.uniforms) {
                fifthParticleMaterial.uniforms.uVisibleRatio.value = ratio;
                fifthParticleMaterial.uniforms.uOpacity.value = 1.0;
            }
        },
    });

    // Trigger 3: 彎曲特效
    ScrollTrigger.create({
        trigger: spacer1,
        start: "top 97%",
        end: "top -120px",
        scrub: 0.1,
        onUpdate: (self) => {
            const p = self.progress;
            if (fourthParticleMaterial) fourthParticleMaterial.uniforms.uBendFactor.value = p;
            if (fifthParticleMaterial) fifthParticleMaterial.uniforms.uBendFactor.value = p;
        },
        onLeaveBack: () => {
            if (fourthParticleMaterial) fourthParticleMaterial.uniforms.uBendFactor.value = 0;
            if (fifthParticleMaterial) fifthParticleMaterial.uniforms.uBendFactor.value = 0;
        },
    });

    // Trigger 4: 背景層淡入
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


// ----------------------------------------------------------------
// 3. 互動事件監聽 (Interactions)
// ----------------------------------------------------------------

function onMouseMove(event) {
    event.preventDefault();
    if (!camera) return;

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


// ==========================================
// 4. 主程式執行入口 (Execution Entry)
// ==========================================

try {
    console.log("🚀 V64+ 啟動：Brain Layer 4 新增完成");

    // 1. 基礎建設 (Core)
    initSceneOld();
    initSceneLight();
    
    // 2. 光束路徑準備 (Beams)
    initPathLUTs();

    // 3. 舊粒子系統 (Legacy)
    initFirstParticle();
    initFirstParticleEffects();
    initSecondParticle();
    initSecondParticleEffects();
    initThirdParticle();
    initThirdParticleEffects();
    initFourthParticle();
    initFifthParticle();

    // 4. 頁面特效 (Main)
    initTunnelEffects();
    initAboutEffects();
    initTextEffects();
    initCompetenciesEffects();

    // 5. 光束系統 (Beams)
    initBeamSystem();
    initBeamScrollTriggers();

    // 6. 大腦系統 (Brain) - 現在會載入 4 層
    initThreeLayerBrain();

    // 7. 啟動引擎
    animate();

    console.log("✅ 系統初始化完成：所有模組運作中");

} catch (e) {
    console.error("❌ 系統啟動失敗:", e);
}