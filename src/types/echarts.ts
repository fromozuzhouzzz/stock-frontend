import type { ComposeOption } from 'echarts/core'
import type {
  TitleComponentOption,
  TooltipComponentOption,
  LegendComponentOption,
  GridComponentOption
} from 'echarts/components'
import type { PieSeriesOption, BarSeriesOption, LineSeriesOption } from 'echarts/charts'

export type ECOption = ComposeOption<
  | TitleComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | GridComponentOption
  | PieSeriesOption
  | BarSeriesOption
  | LineSeriesOption
>