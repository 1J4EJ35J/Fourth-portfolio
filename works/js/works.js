document.addEventListener("DOMContentLoaded", () => {
    // 1. 選取所有包含 title-zone 的區塊
    const titleZones = document.querySelectorAll('.title-zone');

    // 建立 ResizeObserver 實例
    const observer = new ResizeObserver((entries) => {
        entries.forEach(entry => {
            // entry.target 是被監聽的 title-container
            const container = entry.target;
            // 找到它對應的父層 title-zone
            const zone = container.closest('.title-zone');

            if (zone) {
                // 2. 強制將 title-zone 的高度設為與 title-container 一模一樣
                // 使用 offsetHeight 確保包含 padding 與 border
                const newHeight = container.offsetHeight;

                // 直接寫入 inline style 覆蓋 CSS
                zone.style.height = `${newHeight}px`;
                zone.style.minHeight = `${newHeight}px`; // 防止被其他 CSS 撐開
                zone.style.maxHeight = `${newHeight}px`; // 防止被其他 CSS 撐開
            }
        });
    });

    // 3. 開始監聽每一個 title-container
    titleZones.forEach(zone => {
        const container = zone.querySelector('.title-container');
        if (container) {
            // 初始化：先執行一次對齊
            const initialHeight = container.offsetHeight;
            zone.style.height = `${initialHeight}px`;
            zone.style.minHeight = `${initialHeight}px`;
            zone.style.maxHeight = `${initialHeight}px`;

            // 開始持續監聽高度變化
            observer.observe(container);
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. Menu Toggle 開啟與關閉功能
    // ==========================================

    // 依照指令：帶入描述的父層元素 (.hud-nav .hud-nav-container) 進行定位
    const navContainer = document.querySelector('.hud-nav .hud-nav-container');

    // 確保父層存在後，再選取內部的按鈕
    if (navContainer) {
        const menuToggleBtn = navContainer.querySelector('.menu-toggle');

        if (menuToggleBtn) {
            menuToggleBtn.addEventListener('click', function () {
                // 切換按鈕的 active 狀態
                // 根據 CSS 規則：.hud-nav-container:has(.menu-toggle.active) .nav
                // 當按鈕具備 active 時，CSS 會自動顯示選單
                this.classList.toggle('active');
            });
        }
    }

});

document.addEventListener("DOMContentLoaded", () => {
    // 1. 使用 querySelectorAll 抓取「所有」的來源影片與目標影片
    const sourceVideos = document.querySelectorAll('.vd-outter-container:not(.-mobile) .yug-video');
    const targetVideos = document.querySelectorAll('.vd-outter-container.-mobile .yug-video');

    // 檢查是否有抓到影片，並且確保兩邊的數量是一致的才能完美配對
    if (sourceVideos.length > 0 && sourceVideos.length === targetVideos.length) {

        // 2. 針對每一組影片跑迴圈
        sourceVideos.forEach((sourceVideo, index) => {

            // 透過 index (索引值) 抓取對應順序的手機版影片
            const targetVideo = targetVideos[index];

            // --- 以下邏輯與之前相同，但現在是被封裝在迴圈內，每一組獨立運作 ---

            const syncHeight = () => {
                const sourceHeight = sourceVideo.offsetHeight;

                if (sourceHeight > 0) {
                    targetVideo.style.height = `${sourceHeight}px`;
                    targetVideo.style.objectFit = 'cover';
                }
            };

            // 當這一個來源影片的屬性載入完成時，執行同步
            sourceVideo.addEventListener('loadedmetadata', syncHeight);

            // 保險機制：如果這一個影片已經被快取
            if (sourceVideo.readyState >= 1) {
                syncHeight();
            }

            // 建立專屬於「這一組」影片的 ResizeObserver
            const observer = new ResizeObserver(() => {
                syncHeight();
            });

            // 開始監聽這一個來源影片
            observer.observe(sourceVideo);
        });

    } else if (sourceVideos.length !== targetVideos.length) {
        // 如果數量不一致，在開發者工具提示錯誤，方便除錯
        console.warn("警告：桌機版影片與手機版影片的數量不一致，無法正確配對高度。");
    }
});