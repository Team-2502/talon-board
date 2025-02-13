// types/telemetry.ts
import { DraggableLocation } from 'react-beautiful-dnd';

export interface TelemetryData {
    key: string;
    value: string;
}

export interface HistoricalDataPoint {
    time: number;
    value: number | string;
}

export interface HistoricalDataMap {
    [key: string]: HistoricalDataPoint[];
}

export type WidgetType = 'number' | 'array' | 'string' | 'json';

export interface WidgetConfig {
    type: WidgetType;
    title: string;
    minValue?: number;
    maxValue?: number;
    unit?: string;
    precision?: number;
    chartEnabled?: boolean;
}

export interface GridItem {
    id: string;
    widgetConfig: WidgetConfig;
    gridArea?: string;
    w?: number;
    h?: number;
}

export interface DragResult {
    draggableId: string;
    type: string;
    source: DraggableLocation;
    destination: DraggableLocation | null;
}

export interface WidgetProps {
    data: TelemetryData;
    historicalData?: HistoricalDataPoint[];
    config?: WidgetConfig;
}

export interface ChartData {
    time: number;
    value: number;
}

export interface DashboardState {
    telemetryData: TelemetryData[];
    gridItems: GridItem[];
    historicalData: HistoricalDataMap;
    widgetConfigs: Record<string, WidgetConfig>;
}