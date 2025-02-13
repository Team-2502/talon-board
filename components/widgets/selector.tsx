"use client";

import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export interface SelectorData {
    options: string[];
    selected: string;
}

export interface TelemetrySelectorProps {
    selectorKey: string;
    data: SelectorData;
    onValueChange: (key: string, value: SelectorData) => void;
}

export const TelemetrySelector: React.FC<TelemetrySelectorProps> = ({
                                                                        selectorKey,
                                                                        data,
                                                                        onValueChange,
                                                                    }) => {
    const handleChange = (value: string) => {
        onValueChange(selectorKey, {
            ...data,
            selected: value
        });
    };

    return (
        <div className="space-y-2">
            <Select
                value={data.selected}
                onValueChange={handleChange}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                    {data.options.map((option) => (
                        <SelectItem key={option} value={option}>
                            {option}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};