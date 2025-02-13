"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Gauge, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

type TelemetryValue = {
    type: "number" | "string" | "array";
    data: any;
};

const parseValue = (value: string): TelemetryValue => {
    try {
        const num = parseFloat(value);
        if (!isNaN(num)) return { type: "number", data: num };

        const arr = JSON.parse(value);
        if (Array.isArray(arr)) return { type: "array", data: arr };
    } catch {}

    return { type: "string", data: value };
};

export const TelemetryWidget = ({ item }: { item: { key: string; value: string } }) => {
    const parsed = parseValue(item.value);

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {parsed.type === "number" ? <Gauge className="h-4 w-4" /> : <LineChart className="h-4 w-4" />}
                    {item.key}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {parsed.type === "number" && (
                    <div className="text-3xl font-bold">
                        {Math.round(parsed.data * 100) / 100}
                    </div>
                )}

                {parsed.type === "array" && (
                    <div className="text-sm text-muted-foreground">
                        {parsed.data.slice(0, 3).map((v: number, i: number) => (
                            <span key={i} className={cn(i > 0 && "ml-2")}>
                {v.toFixed(2)}
              </span>
                        ))}
                        {parsed.data.length > 3 && "..."}
                    </div>
                )}

                {parsed.type === "string" && (
                    <div className="text-sm text-muted-foreground">
                        {parsed.data}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};