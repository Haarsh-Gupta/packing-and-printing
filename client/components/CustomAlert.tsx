"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

type AlertType = "success" | "error" | "info";

interface Alert {
    id: string;
    message: string;
    type: AlertType;
}

interface AlertContextType {
    showAlert: (message: string, type?: AlertType) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlert() {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error("useAlert must be used within an AlertProvider");
    }
    return context;
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [alerts, setAlerts] = useState<Alert[]>([]);

    const showAlert = (message: string, type: AlertType = "info") => {
        const id = Math.random().toString(36).substring(2, 9);
        setAlerts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            setAlerts((prev) => prev.filter((a) => a.id !== id));
        }, 5000);
    };

    const removeAlert = (id: string) => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
    };

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            <div className="fixed bottom-8 right-8 z-100 space-y-4 max-w-sm w-full pointer-events-none">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className={`pointer-events-auto border-2 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3 transition-all animate-in slide-in-from-right fade-in duration-300
              ${alert.type === "success" ? "bg-[#4be794]" : ""}
              ${alert.type === "error" ? "bg-[#ff90e8]" : ""}
              ${alert.type === "info" ? "bg-[#90e8ff]" : ""}
            `}
                    >
                        <div className="shrink-0 mt-0.5">
                            {alert.type === "success" && <CheckCircle2 className="w-5 h-5" />}
                            {alert.type === "error" && <AlertCircle className="w-5 h-5" />}
                            {alert.type === "info" && <Info className="w-5 h-5" />}
                        </div>

                        <p className="font-bold text-sm leading-tight grow">{alert.message}</p>

                        <button
                            onClick={() => removeAlert(alert.id)}
                            className="shrink-0 hover:scale-110 transition-transform"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </AlertContext.Provider>
    );
}
