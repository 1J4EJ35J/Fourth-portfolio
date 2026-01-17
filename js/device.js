const checkWindowsTablet = () => {
  const ua = navigator.userAgent;
  const isWindows = /Windows/i.test(ua);
  
  // 核心：判斷『主要輸入方式』是否為不精確的觸控 (coarse)
  // 這能有效區分「純觸控平板」與「接了滑鼠的觸控筆電」
  const isTouchPrimary = window.matchMedia('(pointer: coarse)').matches;
  
  // 輔助：確認裝置具備觸控點
  const hasTouchPoints = navigator.maxTouchPoints > 0;

  return isWindows && isTouchPrimary && hasTouchPoints;
};

// 監聽模式切換 (例如 Surface 拔掉鍵盤的瞬間)
window.matchMedia('(pointer: coarse)').addEventListener('change', (e) => {
  if (e.matches) {
    console.log("切換至：Windows 平板觸控模式");
  } else {
    console.log("切換至：滑鼠/鍵盤模式");
  }
});