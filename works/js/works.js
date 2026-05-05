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

    const navContainer = document.querySelector('.hud-nav .hud-nav-container');

    if (navContainer) {
        const menuToggleBtn = navContainer.querySelector('.menu-toggle');

        if (menuToggleBtn) {
            // [原有功能] 點擊 Menu 按鈕本身切換開關
            menuToggleBtn.addEventListener('click', function () {
                this.classList.toggle('active');
            });

            // [新增功能] 點擊任何一個導覽連結 (.nav-btn) 後自動收合選單
            const navBtns = navContainer.querySelectorAll('.nav-btn');

            navBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    // 判斷當前視窗寬度是否小於等於 640px
                    if (window.innerWidth <= 640) {
                        // 移除 active 狀態，CSS 會自動把選單收起，並把圖示切換回漢堡排
                        menuToggleBtn.classList.remove('active');
                    }
                });
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

document.addEventListener('DOMContentLoaded', function () {
    // 取得所有的觸發按鈕與圖片容器
    const openBtns = document.querySelectorAll('.dev-flow-img-open-btn');
    const flowImages = document.querySelectorAll('.dev-flow-img');

    // 替每個按鈕綁定點擊事件
    openBtns.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            // 避免 a 標籤或 button 的預設行為
            e.preventDefault();

            // 針對目標圖片進行明確的 class 判斷與操作
            flowImages.forEach(function (img) {
                // 先判斷有沒有 .active
                if (img.classList.contains('active')) {
                    // 如果有，則移除
                    img.classList.remove('active');
                } else {
                    // 如果沒有，則加上
                    img.classList.add('active');
                }
            });
        });
    });
});