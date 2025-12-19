document.addEventListener('DOMContentLoaded', () => {
    
    // 獲取 DOM 元素
    const heroLeft = document.querySelector('.hero-left');
    const heroRight = document.querySelector('.hero-right');
    const tunnelEffect = document.getElementById('tunnel-effect');
    const aboutSection = document.getElementById('about');
    const wallLights = document.querySelectorAll('.wall-light');

    // 參數設定
    const triggerHeroExit = 120; // Hero文字開始滑出的距離
    const triggerTunnel = 300;   // 粒子開始變形/牆壁出現的距離
    const triggerAbout = 1000;   // About 開始淡入的距離 (轉場結束)

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // --- 1. Hero 文字滑出動畫 ---
        // 當滾動超過 120px
        if (scrollY > triggerHeroExit) {
            // 計算進度 (0 ~ 1)
            let progress = (scrollY - triggerHeroExit) / 400; 
            progress = Math.min(Math.max(progress, 0), 1);

            // 左邊文字：向左滑出 + 放大 + 淡出
            heroLeft.style.transform = `translateX(-${progress * 100}%) scale(${1 + progress * 0.5})`;
            heroLeft.style.opacity = 1 - progress;

            // 右邊文字：向右滑出 + 放大 + 淡出
            heroRight.style.transform = `translateX(${progress * 100}%) scale(${1 + progress * 0.5})`;
            heroRight.style.opacity = 1 - progress;
        } else {
            // 復原
            heroLeft.style.transform = 'none';
            heroLeft.style.opacity = 1;
            heroRight.style.transform = 'none';
            heroRight.style.opacity = 1;
        }

        // --- 2. 隧道特效控制 ---
        if (scrollY > triggerTunnel) {
            // 呼叫 particle.js 的全域函數開啟隧道模式
            if (window.setTunnelMode) window.setTunnelMode(true);
            
            // 顯示光壁
            tunnelEffect.style.opacity = 1;
            
            // 讓光壁隨滾動移動 (Parallax)
            let wallMove = (scrollY - triggerTunnel) * 0.2;
            wallLights.forEach((wall, index) => {
                // 每個牆壁移動速度不同，製造深淺感
                let speed = 1 + index * 0.5;
                wall.style.transform = `translateY(-${wallMove * speed}px) scale(${1 + wallMove * 0.001})`;
                wall.style.opacity = Math.min((scrollY - triggerTunnel) / 500, 0.8); // 漸漸變亮
            });

        } else {
            // 關閉隧道模式
            if (window.setTunnelMode) window.setTunnelMode(false);
            tunnelEffect.style.opacity = 0;
        }

        // --- 3. About Section 進場動畫 ---
        if (scrollY > triggerAbout) {
            // 計算 About 進場進度
            // 假設從 1000px 到 1500px 完成進場
            let aboutProgress = (scrollY - triggerAbout) / 500;
            aboutProgress = Math.min(Math.max(aboutProgress, 0), 1);

            // 淡入 (opacity 0 -> 1)
            aboutSection.style.opacity = aboutProgress;
            
            // 縮放 (scale 0.8 -> 1)
            // 從原本的縮小(0.8) 回到 正常(1)
            let currentScale = 0.8 + (aboutProgress * 0.2); 
            aboutSection.style.transform = `scale(${currentScale})`;

        } else {
            aboutSection.style.opacity = 0;
            aboutSection.style.transform = `scale(0.8)`;
        }
    });
});