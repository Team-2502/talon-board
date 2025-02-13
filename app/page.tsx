"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Settings,
    Grip,
    X,
    ChevronLeft,
    ChevronRight,
    Save,
    Upload,
    Trash
} from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const TelemetryDashboard = () => {
    const [widgets, setWidgets] = useState([]);
    const [telemetryData, setTelemetryData] = useState({});
    const [positions, setPositions] = useState({});
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [settings, setSettings] = useState({
        refreshRate: 100,
        darkMode: false,
        autoSave: true,
        layoutName: 'default'
    });

    const SIDEBAR_WIDTH = 256;
    const COLLAPSED_WIDTH = 52;

    const saveLayout = async () => {
        const layoutData = {
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

    const loadLayout = async () => {
        try {
            const response = await fetch('http://localhost:5807/telemetry_layout');
            if (response.ok) {
                const data = await response.json();
                setWidgets(data.widgets || []);
                setPositions(data.positions || {});
                setSettings(data.settings || settings);
            }
        } catch (error) {
            console.error('Error loading layout:', error);
        }
    };

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:5807/telemetry');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            setTelemetryData(prevData => {
                const isEqual = JSON.stringify(prevData) === JSON.stringify(
                    Object.fromEntries(data.map(item => [item.key, item.value]))
                );
                if (isEqual) return prevData;
                return Object.fromEntries(data.map(item => [item.key, item.value]));
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

    const onDragStart = (e, key) => {
        const rect = e.target.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        e.dataTransfer.setData('text/plain', key);
    };

    const onDrop = (e) => {
        e.preventDefault();
        const key = e.dataTransfer.getData('text/plain');
        if (!widgets.includes(key)) {
            setWidgets([...widgets, key]);
            setPositions({
                ...positions,
                [key]: {
                    x: e.clientX - dragOffset.x - (isSidebarCollapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH),
                    y: e.clientY - dragOffset.y
                }
            });
        }
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    const removeWidget = (key) => {
        setWidgets(widgets.filter(w => w !== key));
        const newPositions = { ...positions };
        delete newPositions[key];
        setPositions(newPositions);
    };

    const onDragWidget = (e, key) => {
        if (e.clientX === 0 && e.clientY === 0) return;
        setPositions(prev => ({
            ...prev,
            [key]: {
                x: e.clientX - dragOffset.x - (isSidebarCollapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH),
                y: e.clientY - dragOffset.y
            }
        }));
    };

    const clearLayout = () => {
        setWidgets([]);
        setPositions({});
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div
                className={`${
                    isSidebarCollapsed ? 'w-12' : 'w-64'
                } border-r bg-gray-100 dark:bg-gray-800 transition-all duration-300 flex flex-col`}
            >
                <div className="flex justify-between items-center p-4">
                    {!isSidebarCollapsed && <h2 className="text-lg font-bold">Available Telemetry</h2>}
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                        {isSidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
                    </button>
                </div>

                {!isSidebarCollapsed && (
                    <ScrollArea className="flex-1">
                        {Object.entries(telemetryData).map(([key]) => (
                            <div
                                key={key}
                                draggable
                                onDragStart={(e) => onDragStart(e, key)}
                                className="mx-2 mb-2 p-2 bg-white dark:bg-gray-700 rounded-lg cursor-move hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center"
                            >
                                <Grip className="h-4 w-4 mr-2" />
                                <span className="text-sm">{key}</span>
                            </div>
                        ))}
                    </ScrollArea>
                )}

                <div className="p-2 border-t">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start">
                                <Settings className="h-4 w-4 mr-2" />
                                {!isSidebarCollapsed && "Settings"}
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Dashboard Settings</SheetTitle>
                            </SheetHeader>
                            <div className="mt-4 space-y-4">
                                <div className="space-y-2">
                                    <Label>Layout Name</Label>
                                    <Input
                                        value={settings.layoutName}
                                        onChange={(e) => setSettings({...settings, layoutName: e.target.value})}
                                    />
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
                                <div className="flex items-center justify-between">
                                    <Label>Dark Mode</Label>
                                    <Switch
                                        checked={settings.darkMode}
                                        onCheckedChange={(checked) => setSettings({...settings, darkMode: checked})}
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

            {/* Main grid area */}
            <div
                className="flex-1 p-4 bg-gray-200 dark:bg-gray-900 relative"
                onDrop={onDrop}
                onDragOver={onDragOver}
            >
                {widgets.map((key) => (
                    <Card
                        key={key}
                        className="absolute cursor-move"
                        style={{
                            transform: `translate(${positions[key]?.x || 0}px, ${positions[key]?.y || 0}px)`,
                            width: '200px',
                        }}
                        draggable="true"
                        onDragStart={(e) => onDragStart(e, key)}
                        onDrag={(e) => onDragWidget(e, key)}
                    >
                        <CardHeader className="p-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium">{key}</CardTitle>
                            <button
                                onClick={() => removeWidget(key)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">
                                {telemetryData[key] || 'No data'}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default TelemetryDashboard;