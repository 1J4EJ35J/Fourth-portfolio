responseRate();
demoGraphicDistribution();
filterChart();
sidebarChart();
rwdChart();
productLayoutChart();
productSettingChart();

//問卷有效比率
function responseRate() {
    var chartDomResponseRate = document.getElementById('response-rate-box');
    var myChart = echarts.init(chartDomResponseRate);
    var option;
    const gaugeData = [
        {
            value: 94.7,
            name: '有效問卷占比',
            title: {
                offsetCenter: ['0%', '28%'],

            },
            detail: {
                valueAnimation: true,
                offsetCenter: ['0%', '0%']
            }
        }
    ];

    option = {
        color: ['#0066FF', 'rgba(0, 0, 0, 0)'],
        series: [
            {
                type: 'gauge',
                startAngle: 90,
                endAngle: -360,
                pointer: {
                    show: false
                },
                progress: {
                    show: true,
                    overlap: false,
                    roundCap: false,
                    clip: false,
                    itemStyle: {
                        borderWidth: 0,
                        borderColor: '#464646'
                    }
                },
                axisLine: {
                    lineStyle: {
                        width: 12,
                        // ECharts 儀表板的顏色設定是一個陣列，[1, '顏色'] 代表 100% 範圍的底色
                        color: [[1, 'transparent']]
                    }

                },
                splitLine: {
                    show: false,
                    distance: 0,
                    length: 10
                },
                axisTick: {
                    show: false
                },
                axisLabel: {
                    show: false,
                    distance: 50
                },
                data: gaugeData,
                title: {
                    fontSize: 18,
                    color: '#c0d4eb'
                },
                detail: {
                    width: 50,
                    height: 14,
                    fontSize: 60,
                    color: 'inherit',
                    borderColor: 'inherit',
                    borderRadius: 0,
                    borderWidth: 0,
                    formatter: '{value}%'
                }
            }
        ]
    };
    option && myChart.setOption(option);
    window.addEventListener('resize', function () {

        myChart.resize({ width: 0 });
        setTimeout(() => {
            myChart.resize({ width: 'auto' });
        }, 0);
    });
}

// 受測者輪廓 (動態切換：>480px 半環形圖 / <=480px 長條圖)
function demoGraphicDistribution() {
    var chartDom = document.getElementById('demographic-distribution-box');
    var myChart = echarts.init(chartDom);

    // 💡 1. 建立一個產出 Option 的工廠函式，改為接收「當前螢幕寬度」
    function getChartOption(currentWidth) {
        let isMobile = currentWidth <= 480;
        let isTablet = currentWidth <= 600; // 用來判斷是否 <= 600px

        if (isMobile) {
            // 📱 寬度 <= 480px：回傳「橫式長條圖」的設定
            return {
                color: ['#3e77a5', '#00498d', '#00ccff'],
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' }
                },
                legend: {
                    itemGap: 8,
                    bottom: 4,
                    textStyle: { color: '#c0d4eb', fontSize: 13.3, lineHeight: 16 },
                    icon: 'circle',
                    itemWidth: 13,
                    itemHeight: 13
                },
                xAxis: {
                    type: 'value',
                    axisLabel: { color: '#8b949e', fontSize: 12 },
                    splitLine: {
                        lineStyle: { color: 'rgba(255, 255, 255, 0.1)', type: 'dashed' }
                    }
                },
                yAxis: {
                    type: 'category',
                    data: ['人\n數'],
                    axisLabel: { color: '#c0d4eb', fontSize: 14 }
                },
                grid: {
                    // 確保長條圖在小螢幕時不會被切斷
                    left: '5%', right: '10%', bottom: 60, containLabel: true
                },
                series: [
                    {
                        name: '物理治療師', type: 'bar', stack: 'total', emphasis: { focus: 'series' },
                        data: [158], label: { show: true, fontSize: 16, color: '#ffffff', fontWeight: 'bold' }
                    },
                    {
                        name: '門市人員', type: 'bar', stack: 'total', emphasis: { focus: 'series' },
                        data: [51], label: { show: true, fontSize: 16, color: '#ffffff', fontWeight: 'bold' }
                    },
                    {
                        name: '醫師', type: 'bar', stack: 'total', emphasis: { focus: 'series' },
                        data: [6], label: { show: true, fontSize: 16, color: '#002b5d', fontWeight: 'bold' }
                    }
                ]
            };
        } else {
            // 💻 寬度 > 480px：回傳「半環形圖」的設定
            const total = 158 + 51 + 6;
            return {
                color: ['#3e77a5', '#00498d', '#00ccff'],
                tooltip: {
                    trigger: 'item',
                    formatter: function (params) {
                        if (params.name === '') return '';
                        let percent = ((params.value / total) * 100).toFixed(1);
                        return `${params.marker} ${params.name}: <br/> ${params.value} 人 (${percent}%)`;
                    }
                },
                legend: {
                    data: ['物理治療師', '門市人員', '醫師'],
                    // ✅ 關鍵：在 481~600 時，套用您設定的小字體 RWD
                    itemGap: isTablet ? 8 : 16,
                    bottom: isTablet ? 20 : 60, // 481~600時圖例也往下退一點爭取空間
                    textStyle: { color: '#c0d4eb', fontSize: isTablet ? 13.3 : 17.6, lineHeight: 16 },
                    icon: 'circle',
                    itemWidth: isTablet ? 13 : 16,
                    itemHeight: isTablet ? 13 : 16
                },
                // 把 grid 清空以免干擾圓餅圖
                grid: { top: 0, bottom: 0, left: 0, right: 0 },
                series: [
                    {
                        name: '受測者輪廓', type: 'pie',
                        // ✅ 順便讓半環形圖的半徑與文字也跟著螢幕微調 RWD
                        radius: isTablet ? ['50%', '80%'] : ['40%', '70%'],
                        center: ['50%', '75%'],
                        startAngle: 180,
                        label: {
                            show: true, color: '#c0d4eb',
                            fontSize: isTablet ? 12 : 14,
                            formatter: function (params) {
                                if (params.name === '') return '';
                                return `${params.name}\n{value|${params.value}} 人`;
                            },
                            rich: {
                                value: { fontSize: isTablet ? 16 : 20, fontWeight: 'bold', color: '#ffffff', lineHeight: 24 }
                            }
                        },
                        labelLine: { show: true, length: 10, length2: 15 },
                        data: [
                            { value: 158, name: '物理治療師' },
                            { value: 51, name: '門市人員' },
                            { value: 6, name: '醫師' },
                            { value: total, name: '', itemStyle: { color: 'none' }, label: { show: false }, labelLine: { show: false }, tooltip: { show: false } }
                        ]
                    }
                ]
            };
        }
    }

    // 💡 2. 初始載入時，先取得當下寬度並畫圖
    let currentWidth = window.innerWidth;
    let isMobile = currentWidth <= 480;
    // 第二個參數 true 表示「覆蓋掉舊設定，不合併」
    myChart.setOption(getChartOption(currentWidth), true);

    // 💡 3. RWD 監聽事件
    window.addEventListener('resize', function () {
        let newWidth = window.innerWidth;
        let currentIsMobile = newWidth <= 480;

        // 【狀況 A】跨越 480px 斷點瞬間，清空畫布並重繪圖表類型 (Bar <-> Pie)
        if (isMobile !== currentIsMobile) {
            isMobile = currentIsMobile;
            myChart.clear();
            myChart.setOption(getChartOption(newWidth), true);
        }
        // 【狀況 B】在 > 480px 的半環形圖狀態下縮放，要動態處理 Legend 在 600px 的變化
        else if (!isMobile) {
            let isTablet = newWidth <= 600;
            myChart.setOption({
                legend: {
                    itemGap: isTablet ? 8 : 16,
                    bottom: isTablet ? 20 : 60,
                    itemWidth: isTablet ? 13 : 16,
                    itemHeight: isTablet ? 13 : 16,
                    textStyle: {
                        fontSize: isTablet ? 13.3 : 17.6
                    }
                },
                series: [
                    {
                        radius: isTablet ? ['50%', '80%'] : ['40%', '70%'],
                        label: {
                            fontSize: isTablet ? 12 : 14,
                            rich: {
                                value: { fontSize: isTablet ? 16 : 20 }
                            }
                        }
                    }
                ]
            });
        }

        // 執行外層容器寬度釋放與自適應
        myChart.resize({ width: 0 });
        setTimeout(() => {
            myChart.resize({ width: 'auto' });
        }, 0);
    });
}


// 篩選功能圖表 (Filter Chart - F-02 數據)
function filterChart() {
    var chartDom = document.getElementById('filter-chart-box');
    var myChart = echarts.init(chartDom);
    var option;

    // ✅ 加入初始的螢幕寬度判斷
    let isMobile = window.innerWidth <= 600;

    option = {
        // 顏色依序對應：經常找不到(紅)、勉強可以(橘)、很快就能找到(藍)
        color: ['#870d0d', '#b07d58', '#004f8f'],
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            // 讓 tooltip 顯示更清楚的數值與佔比
            formatter: function (params) {
                let result = params[0].axisValue + '<br/>';
                params.forEach(item => {
                    result += `${item.marker} ${item.seriesName}: ${item.value} 人<br/>`;
                });
                return result;
            }
        },
        legend: {
            // ✅ 套用三元運算子動態給值
            itemGap: isMobile ? 8 : 16,
            bottom: isMobile ? 4 : 8, // 可以微調圖例的位置，把它固定在最下方

            // 4. 控制文字顏色與尺寸
            textStyle: {
                color: '#c0d4eb',
                fontSize: isMobile ? 13.3 : 17.6,
                lineHeight: 16,

            },
            // 控制色塊形狀與大小
            icon: 'circle', // 圓角矩形 (如果要全圓，可以改成 'circle')
            itemWidth: isMobile ? 13 : 16,     // 色塊的寬度
            itemHeight: isMobile ? 13 : 16     // 色塊的高度
        },
        xAxis: {
            type: 'value',
            axisLabel: { color: '#8b949e', fontSize: 12 },
            splitLine: {
                lineStyle: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        },
        yAxis: {
            type: 'category',
            data: ['人\n數'], // Y軸文字
            axisLabel: { color: '#c0d4eb', fontSize: 14, lineHeight: 20 }
        },
        series: [
            {
                name: '經常找不到',
                type: 'bar',
                stack: 'total',
                emphasis: { focus: 'series' },
                data: [98], // 57%
                label: {
                    show: true,
                    fontSize: 20,
                    color: '#ffffff',
                    fontWeight: 'bold',

                }
            },
            {
                name: '勉強可以',
                type: 'bar',
                stack: 'total',
                emphasis: { focus: 'series' },
                data: [71], // 33%
                label: {
                    show: true,
                    fontSize: 20,
                    color: '#ffffff',
                    fontWeight: 'bold',
                }
            },
            {
                name: '很快就能找到',
                type: 'bar',
                stack: 'total',
                emphasis: { focus: 'series' },
                data: [46], // 10%
                label: {
                    show: true,
                    fontSize: 20,
                    color: '#ffffff',
                    fontWeight: 'bold',
                }
            }
        ]
    };

    option && myChart.setOption(option);

    // ✅ 改寫為完整的 RWD 監聽
    window.addEventListener('resize', function () {

        // 1. 螢幕縮放時，重新判斷一次寬度是否小於 600px
        let currentIsMobile = window.innerWidth <= 600;

        // 2. 將新的 RWD 樣式設定動態更新給圖表 (控制圖例文字大小與間距)
        myChart.setOption({
            legend: {
                itemGap: currentIsMobile ? 8 : 16,
                bottom: currentIsMobile ? 4 : 8,
                itemWidth: currentIsMobile ? 13 : 16,
                itemHeight: currentIsMobile ? 13 : 16,
                textStyle: {
                    fontSize: currentIsMobile ? 13.3 : 17.6
                }
            }
        });

        // 3. 執行外層容器寬度釋放與自適應 (歸零重置法)
        myChart.resize({ width: 0 });
        setTimeout(() => {
            myChart.resize({ width: 'auto' });
        }, 0);
    });
}

// 側邊欄圖表 (Sidebar Chart - S-02 數據)
function sidebarChart() {
    var chartDom = document.getElementById('sidebar-chart-box');
    var myChart = echarts.init(chartDom);
    var option;

    // ✅ 加入初始的螢幕寬度判斷
    let isMobile = window.innerWidth <= 600;

    option = {
        // 顏色依序對應：經常找不到(紅)、勉強可以(橘)、很快就能找到(藍)
        color: ['#870d0d', '#b07d58', '#004f8f'],
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: function (params) {
                let result = params[0].axisValue + '<br/>';
                params.forEach(item => {
                    result += `${item.marker} ${item.seriesName}: ${item.value} 人<br/>`;
                });
                return result;
            }
        },
        legend: {
            // ✅ 套用三元運算子動態給值
            itemGap: isMobile ? 8 : 16,
            bottom: isMobile ? 4 : 8, // 可以微調圖例的位置，把它固定在最下方

            // 4. 控制文字顏色與尺寸
            textStyle: {
                color: '#c0d4eb',
                fontSize: isMobile ? 13.3 : 17.6,
                lineHeight: 16,

            },
            // 控制色塊形狀與大小
            icon: 'circle', // 圓角矩形 (如果要全圓，可以改成 'circle')
            itemWidth: isMobile ? 13 : 16,     // 色塊的寬度
            itemHeight: isMobile ? 13 : 16     // 色塊的高度
        },
        xAxis: {
            type: 'value',
            axisLabel: { color: '#8b949e', fontSize: 12 },
            splitLine: {
                lineStyle: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        },
        yAxis: {
            type: 'category',
            data: ['人\n數'], // Y軸文字
            axisLabel: { color: '#c0d4eb', fontSize: 14, lineHeight: 20 }
        },
        series: [
            {
                name: '經常找不到',
                type: 'bar',
                stack: 'total', emphasis: { focus: 'series' },
                data: [125], // 58%
                label: {
                    show: true,
                    fontSize: 20,
                    color: '#ffffff',
                    fontWeight: 'bold',
                }
            },
            {
                name: '勉強可以',
                type: 'bar',
                stack: 'total', emphasis: { focus: 'series' },
                data: [64], // 30%
                label: {
                    show: true,
                    fontSize: 20,
                    color: '#ffffff',
                    fontWeight: 'bold',
                }
            },
            {
                name: '很快就能找到',
                type: 'bar',
                stack: 'total', emphasis: { focus: 'series' },
                data: [26], // 12%
                label: {
                    show: true,
                    fontSize: 20,
                    color: '#ffffff',
                    fontWeight: 'bold',
                }
            }
        ]
    };

    option && myChart.setOption(option);

    // ✅ 改寫為完整的 RWD 監聽
    window.addEventListener('resize', function () {

        // 1. 螢幕縮放時，重新判斷一次寬度是否小於 600px
        let currentIsMobile = window.innerWidth <= 600;

        // 2. 將新的 RWD 樣式設定動態更新給圖表 (控制圖例文字大小與間距)
        myChart.setOption({
            legend: {
                itemGap: currentIsMobile ? 8 : 16,
                bottom: currentIsMobile ? 4 : 8,
                itemWidth: currentIsMobile ? 13 : 16,
                itemHeight: currentIsMobile ? 13 : 16,
                textStyle: {
                    fontSize: currentIsMobile ? 13.3 : 17.6
                }
            }
        });

        // 3. 執行外層容器寬度釋放與自適應 (歸零重置法)
        myChart.resize({ width: 0 });
        setTimeout(() => {
            myChart.resize({ width: 'auto' });
        }, 0);
    });
}

// RWD 特效圖表 (RWD Chart)
function rwdChart() {
    var chartDom = document.getElementById('RWD-chart-box');
    var myChart = echarts.init(chartDom);
    var option;

    // ✅ 加入初始的螢幕寬度判斷
    let isMobile = window.innerWidth <= 600;

    option = {
        // 顏色依序對應：很難操作(紅)、勉強可以(橘)、很容易操作(藍)
        color: ['#870d0d', '#b07d58', '#004f8f'],
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: function (params) {
                let result = params[0].axisValue + '<br/>';
                params.forEach(item => {
                    result += `${item.marker} ${item.seriesName}: ${item.value} 人<br/>`;
                });
                return result;
            }
        },
        legend: {
            // ✅ 套用三元運算子動態給值
            itemGap: isMobile ? 8 : 16,
            bottom: isMobile ? 4 : 8,
            textStyle: {
                color: '#c0d4eb',
                fontSize: isMobile ? 13.3 : 17.6,
                lineHeight: 16,
            },
            icon: 'circle',
            itemWidth: isMobile ? 13 : 16,
            itemHeight: isMobile ? 13 : 16
        },
        xAxis: {
            type: 'value',
            axisLabel: { color: '#8b949e', fontSize: 12 },
            splitLine: {
                lineStyle: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        },
        yAxis: {
            type: 'category',
            data: ['人\n數'], // Y軸文字
            axisLabel: { color: '#c0d4eb', fontSize: 14, lineHeight: 20 }
        },
        series: [
            {
                name: '很難操作',
                type: 'bar',
                stack: 'total', emphasis: { focus: 'series' },
                data: [176],
                label: {
                    show: true,
                    fontSize: 20,
                    color: '#ffffff',
                    fontWeight: 'bold',
                }
            },
            {
                name: '勉強可以',
                type: 'bar',
                stack: 'total', emphasis: { focus: 'series' },
                data: [32],
                label: {
                    show: true,
                    fontSize: 20,
                    color: '#ffffff',
                    fontWeight: 'bold',
                }
            },
            {
                name: '很容易操作',
                type: 'bar',
                stack: 'total', emphasis: { focus: 'series' },
                data: [7],
                label: {
                    show: true,
                    fontSize: 20,
                    color: '#ffffff',
                    fontWeight: 'bold',
                }
            }
        ]
    };

    option && myChart.setOption(option);

    // ✅ 改寫為完整的 RWD 監聽 (包含字體動態縮放)
    window.addEventListener('resize', function () {

        // 1. 螢幕縮放時，重新判斷一次寬度是否小於 600px
        let currentIsMobile = window.innerWidth <= 600;

        // 2. 將新的 RWD 樣式設定動態更新給圖表
        myChart.setOption({
            legend: {
                itemGap: currentIsMobile ? 8 : 16,
                bottom: currentIsMobile ? 4 : 8,
                itemWidth: currentIsMobile ? 13 : 16,
                itemHeight: currentIsMobile ? 13 : 16,
                textStyle: {
                    fontSize: currentIsMobile ? 13.3 : 17.6
                }
            }
        });

        // 3. 執行外層容器寬度釋放與自適應 (歸零重置法)
        myChart.resize({ width: 0 });
        setTimeout(() => {
            myChart.resize({ width: 'auto' });
        }, 0);
    });
}

// 產品設定 - 挫敗人數比率圖表 (融合 Gauge 視覺的細環圓餅圖)
function productLayoutChart() {
    var chartDom = document.getElementById('product-layout-chart-box');
    var myChart = echarts.init(chartDom);
    var option;

    let isMobile = window.innerWidth <= 600;

    option = {
        // ✅ 1. 中央巨大的 89% 與標題字
        title: [
            {
                text: '89%',
                left: 'center',
                top: isMobile ? '40%' : '37.5%', // 獨立調整 89% 的高度
                textStyle: {
                    fontSize: isMobile ? 48 : 82,
                    color: '#e07070',
                    fontWeight: 'bold'
                }
            },
            {
                text: '尋找功能與資訊的過程中\n感到挫敗的人數佔比',
                left: 'center',
                top: isMobile ? '55%' : '60.5%', // 單獨調整「挫敗比率」的高度，不受 89% 影響
                textStyle: {
                    fontSize: 16,
                    color: '#c0d4eb',
                    fontWeight: 'normal',
                    lineHeight: 20
                }
            }
        ],

        // 顏色依序：紅、橘、透明
        color: ['#953030', '#e07070', 'transparent'],
        tooltip: {
            trigger: 'item',
            formatter: function (params) {
                if (params.name === '') return '';
                return `${params.marker} ${params.name}: <br/>${params.value} 人 (${params.percent}%)`;
            }
        },


        series: [
            {
                name: '產品設定感受',
                type: 'pie',
                // ✅ 2. 修正：捨棄 calc()，改用純百分比設定，強制畫出完美細環
                radius: isMobile ? ['67.5%', '75%'] : ['80.5%', '88%'],
                center: ['50%', '50%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 0,
                    borderColor: '#0b1320',
                    borderWidth: 0
                },
                label: {
                    show: false
                },
                emphasis: {
                    scale: true,
                    label: {
                        show: false
                    }
                },
                labelLine: {
                    show: false
                },
                // 帶入真實數據
                data: [
                    { value: 82, name: '很難理解' },
                    { value: 110, name: '勉強可以' },
                    { value: 23, name: '', tooltip: { show: false } } // 透明區塊隱藏 tooltip
                ]
            }
        ]
    };

    option && myChart.setOption(option);

    // RWD 監聽
    window.addEventListener('resize', function () {
        let currentIsMobile = window.innerWidth <= 600;

        myChart.setOption({
            title: {
                textStyle: {
                    fontSize: currentIsMobile ? 48 : 60
                }
            },
            series: [
                {
                    // RWD 動態調整半徑 (保持 10% 的差值維持細環視覺)
                    radius: currentIsMobile ? ['67%', '75%'] : ['80%', '88%']
                }
            ]
        });

        // 執行外層容器寬度釋放與自適應
        myChart.resize({ width: 0 });
        setTimeout(() => {
            myChart.resize({ width: 'auto' });
        }, 0);
    });
}

// 產品設定 - 任務成功的存活占比 (Funnel Chart 漏斗圖)
function productSettingChart() {
    var chartDom = document.getElementById('product-setting-chart-box');
    var myChart = echarts.init(chartDom);
    var option;

    let isMobile = window.innerWidth <= 600;

    option = {
        tooltip: {
            trigger: 'item',
            formatter: function (params) {
                return `${params.marker} ${params.name} : ${params.value} 人 (${params.percent}%)`;
            }
        },
        // 💡 已經將 legend 隱藏 (刪除 legend 區塊)

        series: [
            {
                name: '任務成功的存活占比',
                type: 'funnel',
                left: '10%',
                top: '5%',
                // 因為移除了底部的 legend，這裡可以把 bottom 的空間釋放出來，讓漏斗更大
                bottom: '5%',
                width: '80%',
                max: 135,
                minSize: '0%',
                maxSize: '100%',
                sort: 'descending', // 維持由大到小排序，呈現傳統漏斗形狀
                gap: 2,
                label: {
                    show: true,
                    position: 'inside',
                    // 💡 關鍵修改：因為沒有圖例，我們讓漏斗直接顯示「分類名稱 (換行) 人數」
                    formatter: '{c} ',
                    color: '#fff',
                    fontSize: isMobile ? 16 : 24,
                    fontWeight: 'bold',
                    lineHeight: 22
                },
                labelLine: {
                    length: 10,
                    lineStyle: {
                        width: 1,
                        type: 'solid'
                    }
                },
                itemStyle: {
                    borderColor: '#0b1320',
                    borderWidth: 2
                },
                emphasis: {
                    label: {
                        fontSize: isMobile ? 16 : 20
                    }
                },
                // 💡 關鍵修改：直接在 data 裡面指定獨立顏色，綁定項目
                data: [
                    {
                        value: 67,
                        name: '很難完成',
                        itemStyle: { color: '#953030', fontSize: isMobile ? 14 : 16 } // 暗紅色
                    },
                    {
                        value: 133,
                        name: '勉強可以',
                        itemStyle: { color: '#e07070', fontSize: isMobile ? 14 : 16 } // 橘棕色
                    },
                    {
                        value: 15,
                        name: '很容易完成',
                        itemStyle: { color: '#004f8f', fontSize: isMobile ? 14 : 16 } // 藍色 (存活者)
                    }
                ]
            }
        ]
    };

    option && myChart.setOption(option);

    // RWD 監聽
    window.addEventListener('resize', function () {
        let currentIsMobile = window.innerWidth <= 600;

        myChart.setOption({
            series: [
                {
                    label: {
                        fontSize: currentIsMobile ? 14 : 16
                    },
                    emphasis: {
                        label: {
                            fontSize: currentIsMobile ? 16 : 20
                        }
                    }
                }
            ]
        });

        // 執行外層容器寬度釋放與自適應
        myChart.resize({ width: 0 });
        setTimeout(() => {
            myChart.resize({ width: 'auto' });
        }, 0);
    });
}