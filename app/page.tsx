"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Grip, X } from "lucide-react";

const TelemetryDashboard = () => {
    const [widgets, setWidgets] = useState([]);
    const [telemetryData, setTelemetryData] = useState({});
    const [positions, setPositions] = useState({});
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const SIDEBAR_WIDTH = 256;

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
        fetchData();
        const interval = setInterval(fetchData, 100);
        return () => clearInterval(interval);
    }, [fetchData]);

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
                    x: e.clientX - dragOffset.x - SIDEBAR_WIDTH,
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
                x: e.clientX - dragOffset.x - SIDEBAR_WIDTH,
                y: e.clientY - dragOffset.y
            }
        }));
    };

    return (
        <div className="flex h-screen">
            <div className="w-64 border-r bg-gray-100 dark:bg-gray-800">
                <div className="p-4">
                    <h2 className="text-lg font-bold mb-4">Available Telemetry</h2>
                    <ScrollArea className="h-[calc(100vh-8rem)]">
                        {Object.entries(telemetryData).map(([key]) => (
                            <div
                                key={key}
                                draggable
                                onDragStart={(e) => onDragStart(e, key)}
                                className="mb-2 p-2 bg-white dark:bg-gray-700 rounded-lg cursor-move hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center"
                            >
                                <Grip className="h-4 w-4 mr-2" />
                                <span className="text-sm">{key}</span>
                            </div>
                        ))}
                    </ScrollArea>
                </div>
            </div>

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