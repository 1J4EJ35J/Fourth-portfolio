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
            menuToggleBtn.addEventListener('click', function() {
                // 切換按鈕的 active 狀態
                // 根據 CSS 規則：.hud-nav-container:has(.menu-toggle.active) .nav
                // 當按鈕具備 active 時，CSS 會自動顯示選單
                this.classList.toggle('active');
            });
        }
    }

});