import { Time } from '@/utils/timerEvent'

export function getDayOptions(yAxis: number[], secondArr: number[]) {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(253, 245, 247,0.6)',

        },
      },
      formatter(params: any) {
        const second = secondArr[params[0].dataIndex]
        return (
        ` <span style="color:red;width:10px;height:10px;border-radius:50%;background-color:#e11d48;display:inline-block;margin-right:5px;vertical-align:middle"></span>` + `未分类：${Time.toString(second)}`
        )
      },
    },
    grid: {
      left: '-2%',
      right: '10%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
          16,
          17,
          18,
          19,
          20,
          21,
          22,
          23,
        ],
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false,
        },
      },
    ],
    yAxis: [
      {
        type: 'value',
        show: false,
        max: 60,
      },
    ],
    series: [
      {
        name: 'Direct',
        type: 'bar',
        barWidth: '60%',
        data: yAxis,
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            {
              name: '平均线',
              type: 'average',

              label: {
                formatter(value: any) {
                  return `${value.value}分钟`
                },
                color: 'rgba(239,68,68)',
              },
              lineStyle: {
                color: 'rgba(239,68,68)',
                type: [5, 6],
              },
            },
            {
              name: '30分钟',
              yAxis: 30,

              label: {
                formatter: '30分钟',
                color: '#ccc',
              },
              lineStyle: {
                color: '#ccc',
                type: [5, 6],
              },
            },
            {
              name: '1小时',
              yAxis: 60,

              label: {
                formatter: '1小时',
                color: '#ccc',
              },

              lineStyle: {
                color: '#ccc',
                type: [5, 6],
              },
            },
          ],
        },
        itemStyle: {
          color: 'rgb(243,242,223)',
        },
      },
    ],
  }

  return option
}
