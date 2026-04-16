// 取得所有需要的 DOM 元素（已修正拼字為 survey）
const btnSurvey = document.querySelector('.tab-btn.survey');
const btnQuestionnaire = document.querySelector('.tab-btn.questionnaire');
const resultSurvey = document.querySelector('.survey-result');
const formQuestions = document.querySelector('.questions-form');

// 點擊「調查結果 (Survey)」的事件
btnSurvey.addEventListener('click', () => {
    // 如果已經是 active，則不做任何動作
    if (btnSurvey.classList.contains('active')) return;

    // 1. 處理 Survey 相關：加上 active
    btnSurvey.classList.add('active');
    resultSurvey.classList.add('active');

    // 2. 處理 Questionnaire 相關：移除 active
    btnQuestionnaire.classList.remove('active');
    formQuestions.classList.remove('active');
});

// 點擊「問卷表單 (Questionnaire)」的事件
btnQuestionnaire.addEventListener('click', () => {
    // 如果已經是 active，則不做任何動作
    if (btnQuestionnaire.classList.contains('active')) return;

    // 1. 處理 Questionnaire 相關：加上 active
    btnQuestionnaire.classList.add('active');
    formQuestions.classList.add('active');

    // 2. 處理 Survey 相關：移除 active
    btnSurvey.classList.remove('active');
    resultSurvey.classList.remove('active');
});