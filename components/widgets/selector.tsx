"use client";

import React, {useEffect, useState} from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {StatusIndicator} from "@/components/ui/status-indicator";
import {ConnectionStatus, SelectorVisualState, UpdateStatus} from "@/lib/types";

export interface SelectorData {
    options: string[];
    selected: string;
}

interface TelemetrySelectorProps {
    url: string;
    selectorKey: string;
    data: SelectorData;
    onValueChange: (key: string, value: SelectorData) => void;
    connectionStatus: ConnectionStatus;
    updateStatus?: UpdateStatus;
}

export const TelemetrySelector: React.FC<TelemetrySelectorProps> = ({
                                                                        url,
                                                                        selectorKey,
                                                                        data,
                                                                        onValueChange,
                                                                        connectionStatus,
                                                                        updateStatus,
                                                                    }) => {
    const [isVerified, setIsVerified] = useState(true);

    useEffect(() => {
        if (connectionStatus === ConnectionStatus.Connected) {
            const verifyWithServer = async () => {
                try {
                    const response = await fetch(`${url}/telemetry/${selectorKey}`);
                    if (!response.ok) {
                        setIsVerified(false);
                        return;
                    }

                    const serverData = await response.json();
                    const serverValue = typeof serverData === 'string'
                        ? JSON.parse(serverData).selected
                        : serverData.selected;

                    setIsVerified(serverValue === data.selected);

                    // If mismatch detected, trigger automatic correction
                    if (serverValue !== data.selected) {
                        onValueChange(selectorKey, {
                            ...data,
                            selected: serverValue
                        });
                    }
                } catch (error) {
                    console.error(error);
                    setIsVerified(false);
                }
            };

            verifyWithServer();
            const interval = setInterval(verifyWithServer, 5000);
            return () => clearInterval(interval);
        }
    }, [connectionStatus, selectorKey, data.selected, url, data, onValueChange]);

    const getVisualState = (): SelectorVisualState => {
        if (updateStatus === UpdateStatus.Pending) return SelectorVisualState.Syncing;
        if (updateStatus === UpdateStatus.Error) return SelectorVisualState.Error;
        if (connectionStatus !== ConnectionStatus.Connected) return SelectorVisualState.Offline;
        return isVerified ? SelectorVisualState.Online : SelectorVisualState.Syncing;
    };

    const visualState = getVisualState();

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Select
                    value={data.selected}
                    onValueChange={(value) =>
                        onValueChange(selectorKey, { ...data, selected: value })
                    }
                    disabled={visualState !== SelectorVisualState.Online}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                        {data.options.map((option) => (
                            <SelectItem
                                key={option}
                                value={option}
                                disabled={visualState !== SelectorVisualState.Online}
                            >
                                {option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <StatusIndicator
                    state={visualState}
                    className={visualState === SelectorVisualState.Error ? "animate-pulse" : ""}
                />
            </div>

            {visualState === SelectorVisualState.Offline && (
                <p className="text-xs text-muted-foreground">
                    Connect to server to modify
                </p>
            )}

            {visualState === SelectorVisualState.Error && (
                <p className="text-xs text-yellow-500">
                    Failed to save selection - retrying...
                </p>
            )}
        </div>
    );
};