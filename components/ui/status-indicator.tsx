"use client";

import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SelectorVisualState, ConnectionStatus } from "@/lib/types";

interface StatusIndicatorProps {
    state: SelectorVisualState | ConnectionStatus;
    className?: string;
}

export const StatusIndicator = ({ state, className }: StatusIndicatorProps) => {
    const baseClasses = "h-5 w-5";

    switch (state) {
        case SelectorVisualState.Online:
        case ConnectionStatus.Connected:
            return <CheckCircle className={cn(baseClasses, "text-green-500", className)} />;

        case SelectorVisualState.Offline:
        case ConnectionStatus.Disconnected:
            return <XCircle className={cn(baseClasses, "text-red-500", className)} />;

        case SelectorVisualState.Syncing:
            return <Loader2 className={cn(baseClasses, "text-blue-500 animate-spin", className)} />;

        case SelectorVisualState.Error:
            return <AlertCircle className={cn(baseClasses, "text-yellow-500 animate-pulse", className)} />;

        default:
            return <Loader2 className={cn(baseClasses, "text-muted-foreground animate-spin", className)} />;
    }
};