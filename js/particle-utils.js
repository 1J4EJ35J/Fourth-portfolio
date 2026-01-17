// js/particle-utils.js

// ==========================================
// 輔助工具函式庫 (Utilities)
// ==========================================

/**
 * 1. 黃金比例確定性取樣 (Golden Ratio Deterministic Sampling)
 * 用途：取代 Math.random() 進行陣列取樣，確保每次重新整理網頁時，
 * 粒子選取的像素位置都是固定的，不會閃爍或隨機跳動。
 */
function getDeterministicSamples(allPoints, maxCount) {
    // 如果點數不足，直接全部回傳
    if (allPoints.length <= maxCount) {
        return allPoints;
    }

    const result = [];
    const total = allPoints.length;
    
    // 黃金比例常數 (Golden Ratio)
    const phi = 1.618033988749895; 
    
    for (let i = 0; i < maxCount; i++) {
        // 利用黃金比例計算確定性索引 (Deterministic Index)
        // 這會產生均勻分布但位置固定的序列
        const index = Math.floor((i * phi * total) % total);
        
        result.push(allPoints[index]);
    }
    return result;
}

/**
 * 2. 建立大腦專屬材質 (Brain Texture)
 * 用途：產生帶有核心實心、邊緣柔和模糊的圓點貼圖。
 * @param {number} blur - 模糊程度 (0~1)
 */
function createBrainTexture(blur = 0.5) {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const center = size / 2;
    
    // 徑向漸層
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    
    // 根據 blur 計算核心大小：blur 越大，核心越小，邊緣越軟
    const coreSize = Math.max(0, 0.5 * (1 - blur));
    
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(coreSize, "rgba(255, 255, 255, 1)"); // 實心核心
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");       // 邊緣淡出
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    return new THREE.CanvasTexture(canvas);
}

/**
 * 3. 圖片採樣器 (Image Sampler)
 * 用途：讀取圖片像素，轉換為 3D 空間中的點座標 (Brain Data)。
 * 包含 Promise 處理，確保圖片載入後才執行。
 */
function sampleImage(url, maxCount, scatterRange, zOffset) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.crossOrigin = "Anonymous"; // 處理跨域問題

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const width = img.width;
            const height = img.height;
            canvas.width = width;
            canvas.height = height;
            
            // 將圖片繪製到 Canvas 上以讀取像素數據
            ctx.drawImage(img, 0, 0, width, height);
            const imgData = ctx.getImageData(0, 0, width, height).data;
            
            const points = [];
            // step = 1 表示逐像素掃描，確保高解析度細節
            const step = 1;

            for (let y = 0; y < height; y += step) {
                for (let x = 0; x < width; x += step) {
                    const index = (y * width + x) * 4;
                    const a = imgData[index + 3]; // Alpha 通道

                    // 只取非透明像素 (Alpha > 10)
                    if (a > 10) {
                        points.push({
                            // 將 2D 像素座標轉換為 3D 世界座標中心點
                            targetX: (x - width / 2),
                            targetY: -(y - height / 2),
                            targetZ: zOffset, // 層次深度 (Z軸)
                            
                            // 初始隨機散開位置 (爆炸效果用)
                            initialX: (Math.random() - 0.5) * scatterRange,
                            initialY: (Math.random() - 0.5) * scatterRange,
                            initialZ: (Math.random() - 0.5) * 800
                        });
                    }
                }
            }

            // 使用黃金比例進行降採樣，控制粒子總數
            const finalPoints = getDeterministicSamples(points, maxCount);

            resolve(finalPoints);
        };

        img.onerror = () => reject(`Failed to load image: ${url}`);
    });
}

/**
 * 4. SVG 路徑解析器 (Path Parser)
 * 用途：將 SVG Path 字串 (d="M...") 解析為 Look-Up Table (LUT)。
 * 這是「光束沿著曲線流動」的核心數學。
 */
function parsePathToLUT(dString, steps = 1000) {
    // 建立虛擬 SVG Path 元素來利用瀏覽器的幾何運算能力
    const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathEl.setAttribute("d", dString);
    
    const len = pathEl.getTotalLength();
    const points = [];
    let maxY = -99999;
    let minY = 99999;

    // 沿著路徑取樣
    for (let i = 0; i <= steps; i++) {
        const p = pathEl.getPointAtLength((i / steps) * len);
        points.push({ x: p.x, y: p.y });
        
        if (p.y > maxY) maxY = p.y;
        if (p.y < minY) minY = p.y;
    }

    const startP = pathEl.getPointAtLength(0);
    const centerX = startP.x;
    
    const height = maxY - minY;
    // 建立查找表 (Look-Up Table)
    // 陣列索引 = Y軸高度，值 = X軸偏移量
    const resolution = Math.ceil(height);
    const lut = new Array(resolution + 1).fill(0);

    points.forEach((p) => {
        // 將 SVG 座標系轉換為 LUT 索引 (從底部算起)
        const distFromBottom = Math.floor(maxY - p.y);
        if (distFromBottom >= 0 && distFromBottom <= resolution) {
            lut[distFromBottom] = p.x - centerX;
        }
    });

    // 填補空隙 (簡單的線性插補，避免斷裂)
    for (let i = 1; i < lut.length; i++) {
        if (lut[i] === 0 && lut[i - 1] !== 0) {
            lut[i] = lut[i - 1];
        }
    }

    return { lut, height };
}

/**
 * 5. 建立模糊光點材質 (Blurry Dot)
 * 用途：光束粒子專用，邊緣極度柔和。
 */
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

/**
 * 6. 建立發光核心材質 (Glowing Core)
 * 用途：舊背景粒子專用，帶有藍色光暈。
 */
function createGlowingDot() {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    const center = size / 2;
    
    const gradient = context.createRadialGradient(center, center, 0, center, center, center);
    
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");        // 核心白
    gradient.addColorStop(0.3, "rgba(43, 152, 211, 0.5)");    // 中層藍
    gradient.addColorStop(1, "rgba(28, 178, 153, .03)");      // 外層青 (極淡)
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    
    return new THREE.CanvasTexture(canvas);
}