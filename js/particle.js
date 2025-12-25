// js/particle.js

// 註冊 GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// ==========================================
// 全域變數
// ==========================================
let scene, camera, renderer;
let firstParticleSystem, secondParticleSystem, thirdParticleSystem;
let secondParticleMaterial, thirdParticleMaterial;
let container = document.getElementById('canvas-container');

// 效能優化開關
let runFirst = true;
let runSecond = false;
let runThird = false;

// 第一粒子專用變數
let firstParticleData = [];
let mouse = new THREE.Vector2(9999, 9999);
let mouse3DVec = new THREE.Vector3(0, 0, 0);
let isIdle = true;
let idleTimer = null;
let time = 0;
let mousePath = [];

// ==========================================
// 參數設定 (Config)
// ==========================================
const config = {
  firstParticle: {
      count: 150000, 
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
      rippleFrequency: 0.026
  },
  secondParticle: { // 背景圓點星空
      count: 8000,          
      rangeZ: 1000,         
      rangeXY: 2500,        
      speed: 20.0,          
      size: 1800.0 * window.devicePixelRatio, 
      color: '#008cff',     
  },
  thirdParticle: { // 流星光束
      count: 10,           
      rangeZ: 3000,         
      rangeXY: 2000,        
      speed: 40.0,          
      streakLength: 300.0,  
      color: '#008cff',     
  }
};

// ==========================================
// 程式入口
// ==========================================
try {
    initScene();                
    
    // 1. 粒子系統
    initFirstParticle();        
    initFirstParticleEffects(); 
    
    initSecondParticle();
    initSecondParticleEffects();

    initThirdParticle();
    initThirdParticleEffects();

    // 2. 隧道 SVG 特效
    initTunnelEffects();

    // 3. 頁面區塊特效 (修正：從中心生長)
    initAboutEffects();
    initTextEffects(); 
    
    animate();                  
    
    console.log("✅ 粒子系統啟動：晃動移除，About 改為中心生長");
} catch (e) {
    console.error("❌ 錯誤:", e);
}

// ==========================================
// 1. 場景初始化
// ==========================================
function initScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.z = 750;

    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '-2';
    
    if (container) container.appendChild(renderer.domElement);

    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('mouseout', () => { 
        if(idleTimer) clearTimeout(idleTimer); 
        idleTimer = setTimeout(() => { isIdle = true; }, 100); 
    }, false);
    window.addEventListener('resize', onWindowResize, false);

    for(let i=0; i<config.firstParticle.pathLength; i++) {
        mousePath.push(new THREE.Vector3(0,0,0));
    }
}

// ==========================================
// 2. 第一粒子 (First Particle)
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
        
        let bx = r * Math.cos(theta) * Math.sin(phi);
        let by = r * Math.sin(theta) * Math.sin(phi);
        
        basePositions[i3] = bx; basePositions[i3+1] = by; basePositions[i3+2] = 0; 
        positions[i3] = bx; positions[i3+1] = by; positions[i3+2] = 0; 

        firstParticleData.push({ 
            speed: speed, 
            scatterRadius: scatter * Math.random(), 
            angle: Math.random() * Math.PI * 2, 
            pathIndex: pathIndex 
        });

        let distFromCenter = r / pConfig.sphereRadius;
        let lightness = 0.3 + (distFromCenter * 0.4);
        colorObj.setHSL(0.6, 1.0, lightness);
        colors[i3] = colorObj.r; colors[i3+1] = colorObj.g; colors[i3+2] = colorObj.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.userData = { basePositions: basePositions };

    const texture = createGlowingDot();
    const material = new THREE.PointsMaterial({ 
        size: pConfig.size, 
        map: texture, 
        vertexColors: true, 
        blending: THREE.AdditiveBlending, 
        transparent: true, 
        opacity: pConfig.opacity, 
        depthWrite: false 
    });

    firstParticleSystem = new THREE.Points(geometry, material);
    scene.add(firstParticleSystem);
}

function initFirstParticleEffects() {
    if (!firstParticleSystem) return;
    
    gsap.to(firstParticleSystem.scale, {
        x: 4, y: 4, z: 1,  
        ease: "power1.in", 
        scrollTrigger: {
            trigger: "body",
            start: "500px top",  
            end: "1200px top",   
            scrub: 0.1,          
        }
    });

    gsap.to(firstParticleSystem.material, {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
            trigger: "body",
            start: "1100px top",   
            end: "1200px top",    
            scrub: 0.1,
            onLeave: () => { runFirst = false; },
            onEnterBack: () => { runFirst = true; }
        }
    });
}

// ==========================================
// 3. 第二粒子 (Second Particle)
// ==========================================
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
        randomness[i3] = Math.random(); randomness[i3+1] = Math.random(); randomness[i3+2] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3));

    secondParticleMaterial = new THREE.ShaderMaterial({
        depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: false, transparent: true,
        uniforms: {
            uTime: { value: 0 }, uSpeed: { value: params.speed }, uRangeZ: { value: params.rangeZ }, 
            uSize: { value: params.size }, uOpacity: { value: 0 }, uColor: { value: new THREE.Color(params.color) }
        },
        vertexShader: `
            uniform float uTime; uniform float uSpeed; uniform float uRangeZ; uniform float uSize;
            attribute vec3 aRandomness; varying float vAlpha;
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
            uniform vec3 uColor; uniform float uOpacity; varying float vAlpha;
            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);
                if (dist > 0.5) discard;
                float strength = pow(1.0 - (dist * 2.0), 1.5); 
                gl_FragColor = vec4(uColor, strength * uOpacity * vAlpha);
            }
        `
    });

    secondParticleSystem = new THREE.Points(geometry, secondParticleMaterial);
    scene.add(secondParticleSystem);
}

function initSecondParticleEffects() {
    if (!secondParticleMaterial) return;

    gsap.fromTo(secondParticleMaterial.uniforms.uOpacity, 
        { value: 0 },
        {
            value: 1, 
            ease: "none",
            scrollTrigger: {
                trigger: "body",
                start: "1000px top",  
                end: "1800px top",    
                scrub: 0.1,
                onEnter: () => { runSecond = true; },
                onLeaveBack: () => { runSecond = false; }
            }
        }
    );
}

// ==========================================
// 4. 第三粒子 (Third Particle)
// ==========================================
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
        const randX = Math.random(); const randY = Math.random(); const randZ = Math.random();

        const iHead = i * 2;
        positions[iHead * 3] = x; positions[iHead * 3 + 1] = y; positions[iHead * 3 + 2] = z;
        randomness[iHead * 3] = randX; randomness[iHead * 3 + 1] = randY; randomness[iHead * 3 + 2] = randZ;
        sides[iHead] = 0.0;

        const iTail = i * 2 + 1;
        positions[iTail * 3] = x; positions[iTail * 3 + 1] = y; positions[iTail * 3 + 2] = z;
        randomness[iTail * 3] = randX; randomness[iTail * 3 + 1] = randY; randomness[iTail * 3 + 2] = randZ;
        sides[iTail] = 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3));
    geometry.setAttribute('aSide', new THREE.BufferAttribute(sides, 1));

    thirdParticleMaterial = new THREE.ShaderMaterial({
        depthWrite: false, blending: THREE.AdditiveBlending, transparent: true,
        uniforms: {
            uTime: { value: 0 }, uSpeed: { value: params.speed }, uRangeZ: { value: params.rangeZ }, 
            uStreakLength: { value: params.streakLength }, uOpacity: { value: 0 }, uColor: { value: new THREE.Color(params.color) }
        },
        vertexShader: `
            uniform float uTime; uniform float uSpeed; uniform float uRangeZ; uniform float uStreakLength;
            attribute vec3 aRandomness; attribute float aSide; varying float vAlpha;
            void main() {
                vec3 pos = position;
                float zOffset = uTime * uSpeed * 20.0 + aRandomness.z * 2000.0;
                float currentZ = mod(pos.z + zOffset, uRangeZ * 2.0) - uRangeZ;
                if (aSide > 0.5) {
                    float stretch = uStreakLength * (1.0 + aRandomness.x);
                    currentZ -= stretch;
                    vAlpha = 0.0; 
                } else { vAlpha = 1.0; }
                pos.z = currentZ;
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColor; uniform float uOpacity; varying float vAlpha;
            void main() { gl_FragColor = vec4(uColor, uOpacity * vAlpha); }
        `
    });

    thirdParticleSystem = new THREE.LineSegments(geometry, thirdParticleMaterial);
    scene.add(thirdParticleSystem);
}

function initThirdParticleEffects() {
    if (!thirdParticleMaterial) return;

    gsap.fromTo(thirdParticleMaterial.uniforms.uOpacity, 
        { value: 0 },
        {
            value: 1, 
            ease: "none",
            scrollTrigger: {
                trigger: "body",
                start: "1000px top",  
                end: "1800px top",    
                scrub: 0.1,
                onEnter: () => { runThird = true; },
                onLeaveBack: () => { runThird = false; }
            }
        }
    );
}

// ==========================================
// 5. 隧道光壁特效 (Tunnel Walls)
// ==========================================
function initTunnelEffects() {
    const walls = [
        { el: '.wall-1', start: 700, out: 1400, end: 1500, x: 60, y: 10 },
        { el: '.wall-2', start: 700, out: 1600, end: 1700, x: -60, y: 20 },
        { el: '.wall-3', start: 700, out: 1800, end: 1900, x: 40, y: -20 },
        { el: '.wall-4', start: 720, out: 2000, end: 2100, x: -20, y: -50 },
        { el: '.wall-5', start: 720, out: 2000, end: 2150, x: 10, y: 50 },
    ];

    walls.forEach(w => {
        const element = document.querySelector(w.el);
        if(!element) return;

        let tl = gsap.timeline({
            scrollTrigger: {
                trigger: "body",
                start: `${w.start}px top`,
                end: `${w.end}px top`,
                scrub: 0.5, 
            }
        });

        tl.to(element, {
            scale: 1, opacity: 1,
            x: `${w.x * 0.3}vw`, y: `${w.y * 0.3}vh`,
            duration: (w.out - w.start), ease: "power1.in"
        })
        .to(element, {
            scale: 3, opacity: 0,
            x: `${w.x}vw`, y: `${w.y}vh`,
            duration: (w.end - w.out), ease: "power1.in"
        });
    });
}

// ==========================================
// 6. About 區塊特效 (修正：從中心生長 + Pinning)
// ==========================================
function initAboutEffects() {
    const outerWrapper = document.querySelector('.about-wrapper-outer');
    const innerContent = document.querySelector('.about-content-inner');

    if (!outerWrapper || !innerContent) return;

    // 1. 設定初始狀態：縮小且透明
    gsap.set(innerContent, { scale: 0.1, opacity: 0 });

    // 2. 建立 ScrollTrigger 動畫
    // 我們使用 "pin" (釘選) 效果，讓區塊在畫面中心停留，
    // 使用者的滾動行為會轉化為 "放大" 動畫，而不是網頁滑動。
    let tl = gsap.timeline({
        scrollTrigger: {
            trigger: outerWrapper,
            start: "top top",     // 當區塊頂部碰到視窗頂部時 (佔滿全螢幕)
            end: "+=1200",        // 釘選 1200px 的滾動距離來播放生長動畫
            pin: true,            // 【關鍵】鎖住畫面
            scrub: 0.5,           // 綁定滾動條進度，帶點平滑
            anticipatePin: 1      // 優化釘選效能
        }
    });

    // 3. 定義動畫過程
    tl.to(innerContent, {
        scale: 1,      // 放大至原尺寸
        opacity: 1,    // 變為不透明
        ease: "power2.out"
    });
}

// ==========================================
// 7. 文字特效
// ==========================================
function initTextEffects() {
    const heroContainer = document.querySelector('.hero-container');
    const heroSection = document.querySelector('.hero-section');

    if (heroContainer) {
        gsap.set(heroContainer, { transformOrigin: "center center" });
        gsap.to(heroContainer, {
            scale: 50,      
            opacity: 0,     
            ease: "power2.in",
            scrollTrigger: {
                trigger: "body",
                start: "680px top", 
                end: "2400px top",  
                scrub: 0.1
            }
        });
    }
    
    if (heroSection) {
        gsap.to(heroSection, {
            autoAlpha: 0,
            scrollTrigger: {
                trigger: "body",
                start: "1000px top",
                toggleActions: "play none none reverse"
            }
        });
    }
}

// ==========================================
// 8. 動畫渲染迴圈
// ==========================================
function animate() {
    requestAnimationFrame(animate);
    time += 0.015;

    if (runFirst) updateFirstParticlePhysics();

    if (runSecond && secondParticleMaterial) {
        secondParticleMaterial.uniforms.uTime.value = time;
    }

    if (runThird && thirdParticleMaterial) {
        thirdParticleMaterial.uniforms.uTime.value = time;
    }

    renderer.render(scene, camera);
}

function updateFirstParticlePhysics() {
    if (!firstParticleSystem) return;

    const isScrollUnbound = window.scrollY > 680;
    
    let targetPoint = (isIdle || isScrollUnbound) ? new THREE.Vector3(0,0,0) : mouse3DVec;
    
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
        let cx = positions[i3]; let cy = positions[i3+1]; 
        let tx, ty, s;

        if (isIdle || isScrollUnbound) {
            let bx = basePositions[i3]; let by = basePositions[i3+1];
            let dist = Math.sqrt(bx*bx + by*by);
            let ripple = Math.sin(time * pConfig.rippleSpeed - dist * pConfig.rippleFrequency);
            let scale = (dist + ripple * pConfig.rippleIntensity) / dist;
            tx = bx * scale; ty = by * scale;
            s = pConfig.returnSpeed;
        } else {
            let targetIndex = Math.min(pData.pathIndex, mousePath.length - 1);
            let pathPos = mousePath[targetIndex] || mousePath[0];
            let ox = Math.cos(pData.angle) * pData.scatterRadius;
            let oy = Math.sin(pData.angle) * pData.scatterRadius;
            tx = pathPos.x + ox; ty = pathPos.y + oy;
            s = pData.speed;
        }

        positions[i3] += (tx - cx) * s;
        positions[i3+1] += (ty - cy) * s;
        positions[i3+2] = 0; 
    }

    firstParticleSystem.geometry.attributes.position.needsUpdate = true;
}

// ==========================================
// 輔助函式
// ==========================================
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
    idleTimer = setTimeout(() => { isIdle = true; }, config.firstParticle.idleTimeout);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    ScrollTrigger.refresh();
}

function createGlowingDot() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const context = canvas.getContext('2d');
    const center = size / 2;
    const gradient = context.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(43, 152, 211, 0.5)'); 
    gradient.addColorStop(1, 'rgba(28, 178, 153, .03)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
}