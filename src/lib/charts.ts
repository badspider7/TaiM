import { init, use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, GridComponent, MarkLineComponent, TooltipComponent, CanvasRenderer])
export { init }
export type { ECharts, EChartsCoreOption } from 'echarts/core'
