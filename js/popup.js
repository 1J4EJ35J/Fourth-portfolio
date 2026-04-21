// 取得 DOM 元素
const popupOpenBtn = document.getElementById('popup-open-btn');
const popupCloseBtn = document.getElementById('popup-close-btn');
const popupTemplate = document.getElementById('popup-templete'); // 注意拼字是 templete

// 確保彈窗元素存在，再綁定事件
if (popupTemplate) {

    // 點擊「開啟」按鈕的事件
    if (popupOpenBtn) {
        popupOpenBtn.addEventListener('click', function () {
            // 先判斷：如果沒有 .active 才加上去
            if (!popupTemplate.classList.contains('active')) {
                popupTemplate.classList.add('active');

                // ✅ 終極解法：觸發全局的 resize 事件
                // 延遲 100 毫秒，確保彈窗的 CSS display: block 已經完全渲染完畢
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 90);
            }
        });
    }

    // 點擊「關閉」按鈕的事件
    if (popupCloseBtn) {
        popupCloseBtn.addEventListener('click', function () {
            // 先判斷：如果有 .active 才移除
            if (popupTemplate.classList.contains('active')) {
                popupTemplate.classList.remove('active');
            }
        });
    }

}

// 取得所有需要的 DOM 元素（已修正拼字為 survey）
const btnSurvey = document.querySelector('.tab-btn.survey');
const btnQuestionnaire = document.querySelector('.tab-btn.questionnaire');
const resultSurvey = document.querySelector('.survey-result');
const formQuestions = document.querySelector('.questions-form');

// 點擊「調查結果 (Survey)」的事件
if (btnSurvey) {
    btnSurvey.addEventListener('click', () => {
        if (btnSurvey.classList.contains('active')) return;

        // 1. 處理 Survey 相關：加上 active
        btnSurvey.classList.add('active');
        if (resultSurvey) resultSurvey.classList.add('active');

        // 2. 處理 Questionnaire 相關：移除 active
        if (btnQuestionnaire) btnQuestionnaire.classList.remove('active');
        if (formQuestions) formQuestions.classList.remove('active');

        // ✅ 同理：切換頁籤時，也觸發 resize 讓圖表自動適應新容器
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 90);
    });
}

// 點擊「問卷表單 (Questionnaire)」的事件
if (btnQuestionnaire) {
    btnQuestionnaire.addEventListener('click', () => {
        if (btnQuestionnaire.classList.contains('active')) return;

        // 1. 處理 Questionnaire 相關：加上 active
        btnQuestionnaire.classList.add('active');
        if (formQuestions) formQuestions.classList.add('active');

        // 2. 處理 Survey 相關：移除 active
        if (btnSurvey) btnSurvey.classList.remove('active');
        if (resultSurvey) resultSurvey.classList.remove('active');
    });
}