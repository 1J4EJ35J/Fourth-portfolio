document.addEventListener("DOMContentLoaded", () => {
    const swimlaneImg = document.getElementById('swimlane');

    if (swimlaneImg && swimlaneImg.parentElement) {
        const parentElement = swimlaneImg.parentElement;

        // 定義同步高度的函式
        const syncHeight = () => {
            // 抓取父層的 clientHeight (包含 padding，不含 border)
            const parentHeight = parentElement.clientHeight;
            
            // 強制設定圖片高度
            swimlaneImg.style.height = `${parentHeight}px`;
            
            // 建議：加上這行確保圖片不會因為被強制拉高而變形
            swimlaneImg.style.objectFit = "contain"; 
        };

        // 1. 初始化執行一次
        syncHeight();

        // 2. 建立 ResizeObserver 來持續監聽父層高度變化
        // (這比 window.onresize 更強大，能偵測任何原因導致的父層變動)
        const observer = new ResizeObserver(() => {
            syncHeight();
        });

        // 開始監聽父層
        observer.observe(parentElement);
        
        // 額外保險：圖片載入完成後再算一次 (避免圖片還沒載入時高度計算錯誤)
        swimlaneImg.onload = syncHeight;
    }
});