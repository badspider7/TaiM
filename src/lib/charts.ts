import { init, use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GraphicComponent, GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, GraphicComponent, GridComponent, MarkLineComponent, TooltipComponent, CanvasRenderer])
export { init }
export type { ECharts, EChartsCoreOption } from 'echarts/core'
