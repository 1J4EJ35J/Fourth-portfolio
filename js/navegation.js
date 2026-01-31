// js/nav.js

document.addEventListener("DOMContentLoaded", () => {
    
    // 檢查 Lenis 是否已由 particle-core.js 初始化
    // 注意：務必確保在 HTML 中，particle-core.js 排在 nav.js 之前引入
    if (typeof lenis === 'undefined') {
        console.warn("⚠️ Lenis instance not found. Please ensure particle-core.js is loaded before nav.js");
        return;
    }

    // ==========================================
    // 1. 通用導航按鈕 (.nav-btn) - 錨點捲動
    // ==========================================
    
    // 選取所有帶有 href="#..." 的 .nav-btn
    const navButtons = document.querySelectorAll('.nav-btn[href^="#"]');

    navButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault(); // 阻止瀏覽器預設的瞬間跳轉

            const targetId = this.getAttribute('href');

            // 防止空連結報錯
            if (targetId === '#' || targetId === '') return;

            // 尋找對應 ID 的區塊
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                // 使用 Lenis 進行平滑捲動
                lenis.scrollTo(targetSection, {
                    offset: 0,      // 如果您的導覽列會遮擋內容，請設為負值 (例如 -80)
                    duration: 1.5,  // 捲動時間 (秒)
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // 與您的 Core 設定一致
                    immediate: false
                });
            } else {
                console.warn(`❌ Target section not found: ${targetId}`);
            }
        });
    });


    // ==========================================
    // 2. 回到頂部按鈕 (.go-to-top.btn)
    // ==========================================
    
    const toTopBtn = document.querySelector('.go-to-top.btn');

    if (toTopBtn) {
        toTopBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // 捲動到頁面最頂端 (0)
            lenis.scrollTo(0, {
                duration: 2.0, // 回到頂部距離較長，可以設慢一點更有質感
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });
        });
    }
    
});