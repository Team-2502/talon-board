export interface SettingsData {
    refreshRate: number,
    autoSave: boolean,
}

export interface Position {
    x: number,
    y: number,
}

export interface TelemetryData {
    [key: string]: string | number;
}

export interface Positions {
    [key: string]: Position;
}

export interface LayoutData {
    widgets: string[];
    positions: Positions;
    settings: SettingsData;
}

export interface TelemetryItem {
    key: string;
    value: string | number;
}