"use client";

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useTheme} from "next-themes";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ScrollArea} from "@/components/ui/scroll-area";
import {ChevronLeft, ChevronRight, Grip, Monitor, Moon, Save, Settings, Sun, Trash, Upload, X} from "lucide-react";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,} from "@/components/ui/sheet";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
import {
    ConnectionStatus,
    LayoutData,
    Position,
    Positions,
    SettingsData,
    TelemetryData,
    TelemetryItem,
    UpdateStatus
} from "@/lib/types";
import {SelectorData, TelemetrySelector} from "@/components/widgets/selector";

const TelemetryDashboard: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [widgets, setWidgets] = useState<string[]>([]);
    const [telemetryData, setTelemetryData] = useState<TelemetryData>({widget_type: ""});
    const [positions, setPositions] = useState<Positions>({});
    const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [settings, setSettings] = useState<SettingsData>({
        refreshRate: 100,
        autoSave: true,
    });
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.Checking);
    const [selectorStatuses, setSelectorStatuses] = useState<Record<string, UpdateStatus | undefined>>({});
    const retryQueue = useRef<Array<{ key: string; data: SelectorData }>>([]);
    const isProcessing = useRef(false);

    // next-themes mounting check
    useEffect(() => {
        setMounted(true);
    }, []);

    const processQueue = useCallback(async () => {
        if (isProcessing.current || connectionStatus !== ConnectionStatus.Connected) return;
        isProcessing.current = true;

        while (retryQueue.current.length > 0) {
            const { key, data } = retryQueue.current.shift()!;
            try {
                const response = await fetch(`http://localhost:5807/telemetry/${key}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                if (!response.ok) retryQueue.current.push({ key, data });
            } catch (error) {
                retryQueue.current.push({ key, data });
            }
        }

        isProcessing.current = false;
    }, [connectionStatus]);

    const checkServerStatus = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:5807/status');
            setConnectionStatus(response.ok ? ConnectionStatus.Connected : ConnectionStatus.Disconnected);
        } catch (error) {
            setConnectionStatus(ConnectionStatus.Disconnected);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(checkServerStatus, 1000);
        return () => clearInterval(interval);
    }, [checkServerStatus]);

    useEffect(() => {
        if (connectionStatus == ConnectionStatus.Connected) {
            setSelectorStatuses(prev => {
                const newStatuses = { ...prev };
                Object.keys(newStatuses).forEach(key => {
                    if (newStatuses[key] == UpdateStatus.Error) {
                        delete newStatuses[key];
                    }
                });
                return newStatuses;
            });
        }
    }, [connectionStatus]);

    const saveLayout = async (): Promise<void> => {
        const layoutData: LayoutData = {
            widgets,
            positions,
            settings
        };

        try {
            await fetch('http://localhost:5807/telemetry_layout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(layoutData)
            });
        } catch (error) {
            console.error('Error saving layout:', error);
        }
    };

    const loadLayout = async (): Promise<void> => {
        try {
            const response = await fetch('http://localhost:5807/telemetry_layout');
            if (response.ok) {
                const data: LayoutData = await response.json();
                setWidgets(data.widgets || []);
                setPositions(data.positions || {});
                setSettings(data.settings || settings);
            }
        } catch (error) {
            console.error('Error loading layout:', error);
        }
    };

    const fetchData = useCallback(async (): Promise<void> => {
        try {
            const response = await fetch('http://localhost:5807/telemetry');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data: TelemetryItem[] = await response.json();

            setTelemetryData(prevData => {
                const newData = Object.fromEntries(data.map(item => [item.key, item.value]));
                const isEqual = JSON.stringify(prevData) === JSON.stringify(newData);
                if (isEqual) return prevData;
                return newData;
            });
        } catch (error) {
            console.error('Error fetching telemetry:', error);
        }
    }, []);

    useEffect(() => {
        loadLayout();
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, settings.refreshRate);
        return () => clearInterval(interval);
    }, [fetchData, settings.refreshRate]);

    useEffect(() => {
        if (settings.autoSave) {
            const saveInterval = setInterval(saveLayout, 5000);
            return () => clearInterval(saveInterval);
        }
    }, [settings.autoSave, widgets, positions]);

    const onDragStart = (e: React.DragEvent<HTMLDivElement>, key: string): void => {
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        e.dataTransfer.setData('text/plain', key);
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        const key = e.dataTransfer.getData('text/plain');
        const sidebarElement = document.querySelector('[data-sidebar]');
        const sidebarWidth = sidebarElement ? sidebarElement.getBoundingClientRect().width : 0;

        if (!widgets.includes(key)) {
            setWidgets(prev => [...prev, key]);
            setPositions(prev => ({
                ...prev,
                [key]: {
                    x: e.clientX - dragOffset.x - sidebarWidth,
                    y: e.clientY - dragOffset.y
                }
            }));
        }
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
    };

    const removeWidget = (key: string): void => {
        setWidgets(prev => prev.filter(w => w !== key));
        setPositions(prev => {
            const newPositions = { ...prev };
            delete newPositions[key];
            return newPositions;
        });
    };

    const onDragWidget = (e: React.DragEvent<HTMLDivElement>, key: string): void => {
        if (e.clientX === 0 && e.clientY === 0) return;
        const sidebarElement = document.querySelector('[data-sidebar]');
        const sidebarWidth = sidebarElement ? sidebarElement.getBoundingClientRect().width : 0;

        setPositions(prev => ({
            ...prev,
            [key]: {
                x: e.clientX - dragOffset.x - sidebarWidth,
                y: e.clientY - dragOffset.y
            }
        }));
    };

    const clearLayout = (): void => {
        setWidgets([]);
        setPositions({});
    };

    const handleSelectorChange = async (key: string, newData: SelectorData) => {
        setSelectorStatuses(prev => ({ ...prev, [key]: UpdateStatus.Pending }));

        try {
            const response = await fetch(`http://localhost:5807/telemetry/${key}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newData),
            });

            if (!response.ok) {
                retryQueue.current.push({ key, data: newData });
                setSelectorStatuses(prev => ({ ...prev, [key]: UpdateStatus.Error }));
            } else {
                setSelectorStatuses(prev => ({ ...prev, [key]: undefined }));
            }
        } catch (error) {
            retryQueue.current.push({ key, data: newData });
            setSelectorStatuses(prev => ({ ...prev, [key]: UpdateStatus.Error }));
        }

        processQueue();
    };

    if (!mounted) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background">
            <div className="flex h-screen bg-background">
                {/* Connection status banner */}
                {connectionStatus !== ConnectionStatus.Connected && (
                    <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-center z-50">
                        {connectionStatus === ConnectionStatus.Disconnected
                            ? "Cannot connect to server - check network connection"
                            : "Connecting to server..."}
                    </div>
                )}
            </div>
            {/* Sidebar */}
            <div
                data-sidebar
                className={`${
                    isSidebarCollapsed ? 'w-16' : 'w-64'
                } border-r bg-card transition-all duration-300 flex flex-col shrink-0`}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b h-14 shrink-0">
                    {!isSidebarCollapsed && (
                        <h2 className="text-lg font-semibold">
                            Telemetry
                        </h2>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className={`${
                            isSidebarCollapsed ? 'w-full' : ''
                        }`}
                    >
                        {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    </Button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {!isSidebarCollapsed ? (
                        <ScrollArea className="flex-1 px-2">
                            <div className="space-y-2 py-2">
                                {Object.entries(telemetryData).map(([key]) => (
                                    <div
                                        key={key}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, key)}
                                        className="p-2 bg-muted rounded-lg cursor-move hover:bg-muted/80 flex items-center group"
                                    >
                                        <Grip className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-foreground" />
                                        <span className="text-sm">{key}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="flex-1" />
                    )}

                    {/* Settings Button - Fixed at Bottom */}
                    <div className="border-t p-2 shrink-0">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-${isSidebarCollapsed ? 'center' : 'start'} h-10`}
                                >
                                    <Settings className="h-5 w-5" />
                                    {!isSidebarCollapsed && (
                                        <span className="ml-2">Settings</span>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle>Dashboard Settings</SheetTitle>
                                </SheetHeader>
                                <div className="mt-6 space-y-6">
                                    <div className="space-y-2">
                                        <Label>Theme</Label>
                                        <Select value={theme} onValueChange={setTheme}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="light">
                                                    <div className="flex items-center">
                                                        <Sun className="h-4 w-4 mr-2" />
                                                        Light
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="dark">
                                                    <div className="flex items-center">
                                                        <Moon className="h-4 w-4 mr-2" />
                                                        Dark
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="system">
                                                    <div className="flex items-center">
                                                        <Monitor className="h-4 w-4 mr-2" />
                                                        System
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Refresh Rate (ms)</Label>
                                        <Input
                                            type="number"
                                            value={settings.refreshRate}
                                            onChange={(e) => setSettings({...settings, refreshRate: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>Auto Save</Label>
                                        <Switch
                                            checked={settings.autoSave}
                                            onCheckedChange={(checked) => setSettings({...settings, autoSave: checked})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Button onClick={saveLayout} className="w-full">
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Layout
                                        </Button>
                                        <Button onClick={loadLayout} variant="outline" className="w-full">
                                            <Upload className="h-4 w-4 mr-2" />
                                            Load Layout
                                        </Button>
                                        <Button onClick={clearLayout} variant="destructive" className="w-full">
                                            <Trash className="h-4 w-4 mr-2" />
                                            Clear Layout
                                        </Button>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>

            {/* Main grid area */}
            <div
                className="flex-1 p-4 bg-muted/30 relative overflow-auto"
                onDrop={onDrop}
                onDragOver={onDragOver}
            >
                {widgets.map((key) => {
                    const rawValue = telemetryData[key];
                    let isSelector = false;
                    let selectorData: SelectorData | null = null;

                    try {
                        const parsed = JSON.parse(rawValue);
                        if (parsed.options && Array.isArray(parsed.options) && parsed.selected) {
                            isSelector = true;
                            selectorData = parsed;
                        }
                    } catch {}

                    return (
                        <Card
                            key={key}
                            className="absolute cursor-move shadow-lg"
                            style={{
                                transform: `translate(${positions[key]?.x || 0}px, ${positions[key]?.y || 0}px)`,
                                width: '200px',
                            }}
                            draggable="true"
                            onDragStart={(e) => onDragStart(e, key)}
                            onDrag={(e) => onDragWidget(e, key)}
                        >
                            <CardHeader className="p-4 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-sm font-medium">{key}</CardTitle>
                                    {connectionStatus === 'disconnected' && (
                                        <span className="text-red-500 text-xs">(Offline)</span>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeWidget(key)}
                                    className="h-6 w-6"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                {isSelector && selectorData ? (
                                    <TelemetrySelector
                                        selectorKey={key}
                                        data={selectorData}
                                        onValueChange={handleSelectorChange}
                                        connectionStatus={connectionStatus}
                                        updateStatus={selectorStatuses[key]}
                                    />
                                ) : (
                                    <div className="text-2xl font-bold">
                                        {rawValue || 'No data'}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default TelemetryDashboard;