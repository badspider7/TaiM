import { Time } from '@/utils/timerEvent'

export function getDayOptions(xAxisData: number[], yAxisData: number[], secondArr: number[]) {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          // #FDECF0
          color: '#FEF6F8',
          opacity: 0.6,
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
      top: '10%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: xAxisData,
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
        type: 'bar',
        barWidth: '60%',
        data: yAxisData,
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
          color: '#F8F7F3',
        },
      },
    ],
  }

  return option
}

export function getWeekOptions(xAxisData: string[], yAxisData: string[], secondArr: Record<string, number>) {
  const maxValue = Math.max(...yAxisData.map(item => Number(item)))
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: '#FEF6F8',
          opacity: 0.6,
        },
      },
      formatter(params: any) {
        const second = secondArr[params[0].axisValue]
        return (
        ` <span style="color:red;width:10px;height:10px;border-radius:50%;background-color:#e11d48;display:inline-block;margin-right:5px;vertical-align:middle"></span>` + `未分类：${Time.toString(second)}`
        )
      },
    },
    grid: {
      left: '-2%',
      right: '12%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: xAxisData,
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
        max(value: any) {
          return value.max
        },
      },
    ],
    series: [
      {
        type: 'bar',
        barWidth: '60%',
        data: yAxisData,
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            {
              name: '平均线',
              type: 'average',
              label: {
                formatter(value: any) {
                  const hoursInt = Math.floor(value.value)
                  const minutes = Math.round((value.value - hoursInt) * 60)
                  return `${hoursInt}小时${minutes}分钟`
                },
                color: 'rgba(239,68,68)',
              },
              lineStyle: {
                color: 'rgba(239,68,68)',
                type: [5, 6],
              },
            },
            {
              name: '最大值的一半',
              yAxis: maxValue / 2,
              label: {
                formatter(value: any) {
                  const hoursInt = Math.floor(value.value)
                  const minutes = Math.round((value.value - hoursInt) * 60)
                  return `${hoursInt}小时${minutes}分钟`
                },
                color: '#ccc',
              },
              lineStyle: {
                color: '#ccc',
                type: [5, 6],
              },
            },
            {
              name: '最大值',
              yAxis: maxValue,
              label: {
                formatter(value: any) {
                  const hoursInt = Math.floor(maxValue)
                  const minutes = Math.round((maxValue - hoursInt) * 60)
                  return `${hoursInt}小时${minutes}分钟`
                },
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
          color: '#F8F7F3',
        },
      },
    ],
  }

  return option
}

export function getMonthOptions(xAxisData: number[], yAxisData: string[], secondArr: number[]) {
  const maxValue = Math.max(...yAxisData.map(item => Number(item)))
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: '#FEF6F8',
          opacity: 0.6,
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
      right: '0%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: xAxisData,
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        axisLabel: {
          interval: 0,
        },
      },
    ],
    yAxis: [
      {
        type: 'value',
        show: false,
        max(value: any) {
          return value.max
        },
      },
    ],
    series: [
      {
        type: 'bar',
        barWidth: '60%',
        data: yAxisData,
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            {
              name: '平均线',
              type: 'average',
              label: {
                formatter(value: any) {
                  const hoursInt = Math.floor(value.value)
                  const minutes = Math.round((value.value - hoursInt) * 60)
                  return `${hoursInt}小时${minutes}分钟`
                },
                color: 'rgba(239,68,68)',
                position: 'insideEndTop',
              },
              lineStyle: {
                color: 'rgba(239,68,68)',
                type: [5, 6],
              },
            },
            {
              name: '最大值的一半',
              yAxis: maxValue / 2,
              label: {
                formatter(value: any) {
                  const hoursInt = Math.floor(value.value)
                  const minutes = Math.round((value.value - hoursInt) * 60)
                  return `${hoursInt}小时${minutes}分钟`
                },
                color: '#ccc',
                position: 'insideEndTop',
              },
              lineStyle: {
                color: '#ccc',
                type: [5, 6],
              },
            },
            {
              name: '最大值',
              yAxis: maxValue,
              label: {
                formatter(value: any) {
                  const hoursInt = Math.floor(maxValue)
                  const minutes = Math.round((maxValue - hoursInt) * 60)
                  return `${hoursInt}小时${minutes}分钟`
                },
                color: '#ccc',
                position: 'insideEndTop',
              },
              lineStyle: {
                color: '#ccc',
                type: [5, 6],
              },
            },
          ],
        },
        itemStyle: {
          color: '#F8F7F3',
        },
      },
    ],
  }

  return option
}

export function getYearOptions(xAxisData: string[], yAxisData: string[], secondArr: number[]) {
  const maxValue = Math.max(...yAxisData.map(item => Number(item)))
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: '#FEF6F8',
          opacity: 0.6,
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
      right: '14%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: xAxisData,
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
        max(value: any) {
          return value.max
        },
      },
    ],
    series: [
      {
        type: 'bar',
        barWidth: '60%',
        data: yAxisData,
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            {
              name: '平均线',
              type: 'average',
              label: {
                formatter(value: any) {
                  const hoursInt = Math.floor(value.value)
                  const minutes = Math.round((value.value - hoursInt) * 60)
                  return `${hoursInt}小时${minutes}分钟`
                },
                color: 'rgba(239,68,68)',
              },
              lineStyle: {
                color: 'rgba(239,68,68)',
                type: [5, 6],
              },
            },
            {
              name: '最大值的一半',
              yAxis: maxValue / 2,
              label: {
                formatter(value: any) {
                  const hoursInt = Math.floor(value.value)
                  const minutes = Math.round((value.value - hoursInt) * 60)
                  return `${hoursInt}小时${minutes}分钟`
                },
                color: '#ccc',
              },
              lineStyle: {
                color: '#ccc',
                type: [5, 6],
              },
            },
            {
              name: '最大值',
              yAxis: maxValue,
              label: {
                formatter(value: any) {
                  const hoursInt = Math.floor(maxValue)
                  const minutes = Math.round((maxValue - hoursInt) * 60)
                  return `${hoursInt}小时${minutes}分钟`
                },
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
          color: '#F8F7F3',
        },
      },
    ],
  }

  return option
}
