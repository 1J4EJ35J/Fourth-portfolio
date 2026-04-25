/**
 * 彈窗邏輯優化：支援多組彈窗並存
 * 邏輯：點擊 .popup-open-btn 時，尋找該按鈕對應的 .popup.style-1 並加上 .active
 */

// 1. 處理「開啟」按鈕
const openButtons = document.querySelectorAll('.popup-open-btn');

openButtons.forEach(btn => {
    btn.addEventListener('click', function () {
        // 取得按鈕上定義的 target 或是根據 DOM 結構尋找
        // 假設彈窗緊跟在按鈕附近，或是在全局中尋找對應的 popup
        // 這裡建議在 HTML 按鈕加上 data-target 屬性，例如 data-target=".popup-A"
        const targetSelector = this.getAttribute('data-target') || '.popup.style-1';
        const popup = document.querySelector(targetSelector);

        if (popup && !popup.classList.contains('active')) {
            popup.classList.add('active');

            // ✅ 觸發全局 resize 事件，確保彈窗內的內容（如圖表）能重新計算寬度
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 0);
        }
    });
});

// 2. 處理「關閉」按鈕 (建議在 popup 內部使用 class 標記)
// 使用事件委託處理所有關閉動作，避免複數彈窗重複綁定
document.addEventListener('click', function (e) {
    // 如果點擊的是關閉按鈕 (.popup-close-btn)
    if (e.target.closest('.popup-close-btn')) {
        const popup = e.target.closest('.popup');
        if (popup) {
            popup.classList.remove('active');
        }
    }

    // (選配) 點擊彈窗背景遮罩處也可關閉
    if (e.target.classList.contains('popup')) {
        e.target.classList.remove('active');
    }
});


// 3. 頁籤切換邏輯 (保留並優化)
const setupTabs = () => {
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            if (this.classList.contains('active')) return;

            // 取得父容器，確保只切換當前彈窗內的頁籤
            const container = this.closest('.popup') || document.body;

            // 移除同層所有按鈕與內容的 active
            container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            container.querySelectorAll('.survey-result, .questions-form').forEach(c => c.classList.remove('active'));

            // 加上當前點擊的 active
            this.classList.add('active');

            // 根據 class 切換對應內容
            if (this.classList.contains('survey')) {
                const target = container.querySelector('.survey-result');
                if (target) target.classList.add('active');

                // 觸發 resize 讓圖表自動適應
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 0);
            } else if (this.classList.contains('questionnaire')) {
                const target = container.querySelector('.questions-form');
                if (target) target.classList.add('active');
            }
        });
    });
};

setupTabs();