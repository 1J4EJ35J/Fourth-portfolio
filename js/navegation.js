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
        btn.addEventListener('click', function (e) {
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

    // ==========================================
    // 3. 首頁導航按鈕 (.nav-btn.home) - 回到頂部
    // ==========================================

    const homeBtn = document.querySelector(".nav-btn.home");

    if (homeBtn) {
        homeBtn.addEventListener("click", (e) => {
            e.preventDefault(); // 阻止 a 標籤的預設行為

            // 使用 Lenis 提供的 scrollTo 滾動到頂部 (座標 0)
            lenis.scrollTo(0, {
                duration: 1.2, // 滑動時間(秒)，與 Lenis 初始化設定保持一致
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });
        });
    }

});


document.addEventListener('DOMContentLoaded', () => {
    const goToTopBtn = document.querySelector('.go-to-top-workspage');

    // 【關鍵修正】：將選取目標改為真正產生捲軸的 .case-content-zone
    const caseContentZone = document.querySelector('.case-content-zone');

    if (goToTopBtn && caseContentZone) {
        goToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // 針對 .case-content-zone 的 scrollTop 進行平滑動畫
            gsap.to(caseContentZone, {
                duration: 0.4,
                scrollTop: 0,          // 強制將捲軸位置動畫至 0
                ease: "power3.inOut"
            });
        });
    }
});

// 監聽視窗縮放事件 (Resize)
window.addEventListener('resize', () => {
    // 當螢幕寬度大於 640px 時，進行防呆重置
    if (window.innerWidth > 640) {
        const menuToggleBtn = document.querySelector('.menu-toggle');

        // 如果按鈕存在，而且目前帶有 active 狀態，就強制移除它
        if (menuToggleBtn && menuToggleBtn.classList.contains('active')) {
            menuToggleBtn.classList.remove('active');
        }
    }
});

// ==========================================
// Main Nav (主要導覽列) 開關與防呆控制
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. 選取主要導覽列的相關元素 (使用專屬變數名稱避免衝突)
    const mainNavToggle = document.querySelector('.main-nav-toggle');
    const mainNav = document.querySelector('.main-nav');

    // 確保這兩個元素都存在，才執行後續綁定，避免報錯
    if (mainNavToggle && mainNav) {

        // 2. 點擊 Toggle 按鈕時的開關邏輯
        mainNavToggle.addEventListener('click', () => {
            // 先判斷 toggle 身上有沒有 .active
            const isActive = mainNavToggle.classList.contains('active');

            if (!isActive) {
                // 如果沒有，對兩者都加上 .active
                mainNavToggle.classList.add('active');
                mainNav.classList.add('active');
            } else {
                // 如果有，對兩者都移除 .active
                mainNavToggle.classList.remove('active');
                mainNav.classList.remove('active');
            }
        });

        // 3. 點擊子元素 (.nav-btn) 時的收合邏輯
        const mainNavBtns = mainNav.querySelectorAll('.nav-btn');
        mainNavBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // 當任何一個選項被點擊，強制移除兩者的 .active
                mainNavToggle.classList.remove('active');
                mainNav.classList.remove('active');
            });
        });
    }
});

// 4. 視窗縮放的防呆重置邏輯 (Resize Reset)
// 注意：這個監聽器會與原本的 resize 監聽器疊加執行，不會互相覆蓋
window.addEventListener('resize', () => {
    // 當螢幕寬度大於 640px 時，進行強制重置
    if (window.innerWidth > 640) {
        const mainNavToggle = document.querySelector('.main-nav-toggle');
        const mainNav = document.querySelector('.main-nav');

        // 如果 mainNavToggle 存在且有 active，則移除
        if (mainNavToggle && mainNavToggle.classList.contains('active')) {
            mainNavToggle.classList.remove('active');
        }

        // 如果 mainNav 存在且有 active，則移除
        if (mainNav && mainNav.classList.contains('active')) {
            mainNav.classList.remove('active');
        }
    }
});