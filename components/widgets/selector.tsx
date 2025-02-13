import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TelemetrySelector = ({
                               dataKey,
                               position,
                               onDragStart,
                               onDrag,
                               onRemove
                           }) => {
    const [options, setOptions] = useState([]);
    const [selectedValue, setSelectedValue] = useState('');

    useEffect(() => {
        // Fetch options from telemetry server
        const fetchOptions = async () => {
            try {
                const response = await fetch(`http://localhost:5807/telemetry/${dataKey}`);
                if (response.ok) {
                    const data = await response.json();
                    setOptions(JSON.parse(data));
                }
            } catch (error) {
                console.error('Error fetching options:', error);
            }
        };

        fetchOptions();
    }, [dataKey]);

    const handleValueChange = async (value) => {
        setSelectedValue(value);
        try {
            await fetch(`http://localhost:5807/telemetry/${dataKey}_selected`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(value),
            });
        } catch (error) {
            console.error('Error updating selection:', error);
        }
    };

    return (
        <Card
            className="absolute cursor-move shadow-lg"
            style={{
                transform: `translate(${position?.x || 0}px, ${position?.y || 0}px)`,
                width: '200px',
            }}
            draggable="true"
            onDragStart={onDragStart}
            onDrag={onDrag}
        >
            <CardHeader className="p-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">{dataKey}</CardTitle>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRemove}
                    className="h-6 w-6"
                >
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <Select value={selectedValue} onValueChange={handleValueChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select option..." />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((option) => (
                            <SelectItem key={option} value={option}>
                                {option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
    );
};