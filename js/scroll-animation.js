document.addEventListener('DOMContentLoaded', () => {
    // 抓取元素
    const heroLeft = document.querySelector('.hero-left');
    const heroRight = document.querySelector('.hero-right');
    const tunnelEffect = document.getElementById('tunnel-effect'); // 必須確認 index.html 有加這個 ID
    const aboutSection = document.getElementById('about');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // 1. Hero 文字滑出 (>120px)
        if (scrollY > 120) {
            let p = (scrollY - 120) / 400;
            p = Math.min(Math.max(p, 0), 1);
            
            // 加入安全檢查，避免報錯
            if(heroLeft) {
                heroLeft.style.transform = `translateX(-${p*50}%) scale(${1+p*0.5})`;
                heroLeft.style.opacity = 1 - p;
            }
            if(heroRight) {
                heroRight.style.transform = `translateX(${p*50}%) scale(${1+p*0.5})`;
                heroRight.style.opacity = 1 - p;
            }
        } else {
            // 復原
            if(heroLeft) { heroLeft.style.transform = 'none'; heroLeft.style.opacity = 1; }
            if(heroRight) { heroRight.style.transform = 'none'; heroRight.style.opacity = 1; }
        }

        // 2. 隧道特效 (>300px)
        if (scrollY > 300) {
            // 開啟粒子散射 (呼叫 particle.js)
            if (window.setTunnelMode) window.setTunnelMode(true);
            // 顯示光壁 HTML
            if (tunnelEffect) tunnelEffect.style.opacity = 1;
        } else {
            if (window.setTunnelMode) window.setTunnelMode(false);
            if (tunnelEffect) tunnelEffect.style.opacity = 0;
        }

        // 3. About Section 淡入 (>1000px)
        if (scrollY > 1000) {
            let p = (scrollY - 1000) / 400;
            p = Math.min(Math.max(p, 0), 1);
            
            if(aboutSection) {
                aboutSection.style.opacity = p;
                aboutSection.style.transform = `scale(${0.8 + p*0.2})`;
            }
        } else {
            if(aboutSection) {
                aboutSection.style.opacity = 0;
                aboutSection.style.transform = `scale(0.8)`;
            }
        }
    });
});
console.log("Scroll animation script loaded.");