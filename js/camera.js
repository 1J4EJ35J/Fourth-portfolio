// 在 configBeam 物件中
const configBeam = {
    cameraZ: 600, // ★ 修改這裡：加大數值(如 1000)會拉遠，減小(如 300)會拉近
    // ...
};


function initSceneLight() {
    // ...
    // ★ 修改這裡的 '60'
    // 60 = 標準視角
    // 15~30 = 長焦 (光束會變得很直，像柱子)
    // 90+ = 超廣角 (光束底部會變得很寬，頂部很尖)
    cameraLight = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
    // ...
}


function initSceneLight() {
    // ...
    // ★ 1. 設定相機高度 (第二個參數)
    // 0 = 正視前方 (目前設定)
    // -200 = 從下往上仰視 (由下巴看人)
    // 200 = 從上往下俯視 (上帝視角)
    cameraLight.position.set(0, 0, configBeam.cameraZ); 

    // ★ 2. 設定視線落點 (第二個參數)
    // 0 = 看著螢幕中心
    // 200 = 抬頭看上面
    cameraLight.lookAt(0, 0, 0);
    // ...
}