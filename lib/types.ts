import {Address} from "node:cluster";

export interface SettingsData {
    url: string,
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

export enum ConnectionStatus {
    Connected = "CONNECTED",
    Disconnected = "DISCONNECTED",
    Checking = "CHECKING"
}

export enum UpdateStatus {
    Success = "SUCCESS",
    Error = "ERROR",
    Pending = "PENDING"
}

export enum SelectorStatus {
    Online = "ONLINE",
    Offline = "OFFLINE"
}

export enum SelectorVisualState {
    Online = "ONLINE",
    Offline = "OFFLINE",
    Syncing = "SYNCING",
    Error = "ERROR"
}