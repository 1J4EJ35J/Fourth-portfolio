responseRate();
demoGraphicDistribution()
filterChart();
sidebarChart();

//問卷有效比率
function responseRate() {
    var chartDomResponseRate = document.getElementById('response-rate-box');
    var myChart = echarts.init(chartDomResponseRate);
    var option;
    const gaugeData = [
        {
            value: 94.7,
            name: '有效問卷比率',
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
//受測者輪廓
function demoGraphicDistribution() {
    var demoGraphicDistribution = document.getElementById('demographic-distribution-box');
    var myChart = echarts.init(demoGraphicDistribution);
    var option;

    option = {
        color: ['#3e77a5', '#00498d', '#00ccff'],
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                // Use axis to trigger tooltip
                type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
            }
        },
        legend: {
            itemGap: 16,
            bottom: 0, // 可以微調圖例的位置，把它固定在最下方

            // 4. 控制文字顏色與尺寸
            textStyle: {
                color: '#c0d4eb',
                fontSize: 17.6,
                lineHeight: 16,

            },

            // 5. 控制色塊形狀與大小
            icon: 'circle', // 圓角矩形 (如果要全圓，可以改成 'circle')
            itemWidth: 16,     // 色塊的寬度
            itemHeight: 16     // 色塊的高度
        },
        xAxis: {
            type: 'value',
            axisLabel: {
                color: 'rgb(192, 212, 235)', // 數字的顏色
                fontSize: 12      // 數字的尺寸
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.2)', // 分隔線顏色 (建議用半透明白色，才不會太搶眼)
                    type: 'dashed' // (選擇性) 如果你想把實線改成虛線，可以加這行
                }
            }
        },
        yAxis: {
            type: 'category',
            data: ['人\n數'],
            axisLabel: {
                color: 'rgb(192, 212, 235)', // 數字的顏色
                fontSize: 12      // 數字的尺寸
            }
        },
        series: [
            {
                name: '物理治療師158人',
                type: 'bar',
                stack: 'total',
                label: {
                    show: true
                },
                emphasis: {
                    focus: 'series'
                },
                data: [158],
                label: {
                    show: true,
                    // 👇 1. 在這裡加入 fontSize 修改數字大小
                    fontSize: 20,
                    color: 'rgb(192, 212, 235)', // 文字色
                    fontWeight: 'bold'
                },
            },
            {
                name: '門市人員51人',
                type: 'bar',
                stack: 'total',
                label: {
                    show: true
                },
                emphasis: {
                    focus: 'series'
                },
                data: [51],
                label: {
                    show: true,
                    // 👇 1. 在這裡加入 fontSize 修改數字大小
                    fontSize: 20,
                    color: 'rgb(192, 212, 235)', // (選擇性) 也可以順便確保文字是純白色
                    fontWeight: 'bold'
                },
            },
            {
                name: '醫師6人',
                type: 'bar',
                stack: 'total',
                label: {
                    show: true
                },
                emphasis: {
                    focus: 'series'
                },
                data: [6],
                label: {
                    show: true,
                    // 👇 1. 在這裡加入 fontSize 修改數字大小
                    fontSize: 20,
                    color: 'rgb(0, 43, 93)', // (選擇性) 也可以順便確保文字是純白色
                    fontWeight: 'bold'
                },
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
// ==========================================
// 篩選功能圖表 (Filter Chart - F-02 數據)
// ==========================================
function filterChart() {
    var chartDom = document.getElementById('filter-chart-box');
    var myChart = echarts.init(chartDom);
    var option;

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
            itemGap: 16,
            bottom: 8, // 可以微調圖例的位置，把它固定在最下方

            // 4. 控制文字顏色與尺寸
            textStyle: {
                color: '#c0d4eb',
                fontSize: 17.6,
                lineHeight: 16,

            },
            // 控制色塊形狀與大小
            icon: 'circle', // 圓角矩形 (如果要全圓，可以改成 'circle')
            itemWidth: 16,     // 色塊的寬度
            itemHeight: 16     // 色塊的高度
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
            data: ['感\n受\n分\n數'], // Y軸文字
            axisLabel: { color: '#c0d4eb', fontSize: 14, lineHeight: 20 }
        },
        series: [
            {
                name: '經常找不到',
                type: 'bar',
                stack: 'total',
                data: [123], // 57%
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
                data: [21], // 10%
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

    const observer = new ResizeObserver(() => {
        myChart.resize();
    });
    if (chartDom) {
        observer.observe(chartDom);
    }
}

// ==========================================
// 側邊欄圖表 (Sidebar Chart - S-02 數據)
// ==========================================
function sidebarChart() {
    var chartDom = document.getElementById('sidebar-chart-box');
    var myChart = echarts.init(chartDom);
    var option;

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
            itemGap: 16,
            bottom: 8, // 可以微調圖例的位置，把它固定在最下方

            // 4. 控制文字顏色與尺寸
            textStyle: {
                color: '#c0d4eb',
                fontSize: 17.6,
                lineHeight: 16,

            },
            // 控制色塊形狀與大小
            icon: 'circle', // 圓角矩形 (如果要全圓，可以改成 'circle')
            itemWidth: 16,     // 色塊的寬度
            itemHeight: 16     // 色塊的高度
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
            data: ['感\n受\n分\n數'], // Y軸文字
            axisLabel: { color: '#c0d4eb', fontSize: 14, lineHeight: 20 }
        },
        series: [
            {
                name: '經常找不到',
                type: 'bar',
                stack: 'total',
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
                stack: 'total',
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
                stack: 'total',
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

    const observer = new ResizeObserver(() => {
        myChart.resize();
    });
    if (chartDom) {
        observer.observe(chartDom);
    }
}