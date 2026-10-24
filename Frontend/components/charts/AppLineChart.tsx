import React from "react";
import { LineChart } from "react-native-chart-kit";

export interface AppLineChartProps {
  data: any;
  width: number;
  height: number;
  chartConfig: any;
  bezier?: boolean;
  style?: any;
  withDots?: boolean;
  withInnerLines?: boolean;
  withOuterLines?: boolean;
  withVerticalLines?: boolean;
  withHorizontalLines?: boolean;
  withShadow?: boolean;
  fromZero?: boolean;
  yAxisLabel?: string;
  yAxisSuffix?: string;
  [key: string]: any;
}

export default function AppLineChart(props: AppLineChartProps) {
  return <LineChart {...props} />;
}
