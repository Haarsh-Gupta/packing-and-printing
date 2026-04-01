"use client";

import { useState, createContext, useContext, useCallback, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "default";
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error("useConfirm must be used within a ConfirmProvider");
    }
    return context;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        setOptions(opts);
        setIsOpen(true);
        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
        });
    }, []);

    const handleConfirm = () => {
        setIsOpen(false);
        resolveRef.current?.(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        resolveRef.current?.(false);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {/* Overlay */}
            {isOpen && options && (
                <div className="fixed inset-0 z-200 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={handleCancel}
                    />

                    {/* Dialog */}
                    <div className="relative bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full mx-4 animate-in zoom-in-95 fade-in duration-200">
                        {/* Header */}
                        <div className={`p-6 pb-4 border-b-2 border-black flex items-start gap-4 ${options.variant === "danger" ? "bg-[#ff90e8]" : "bg-[#fdf567]"}`}>
                            <div className="p-2 bg-black text-white rounded-lg shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-black uppercase tracking-tight">{options.title}</h3>
                                <p className="text-sm font-medium text-black/70 mt-1 leading-relaxed">{options.message}</p>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="p-1 hover:bg-black/10 rounded-md transition-colors shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="p-4 flex gap-3 justify-end bg-zinc-50">
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                                className="border-2 border-black font-black uppercase h-11 px-6 hover:bg-zinc-100 rounded-none"
                            >
                                {options.cancelText || "Cancel"}
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                className={`border-2 border-black font-black uppercase h-11 px-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all rounded-none ${
                                    options.variant === "danger"
                                        ? "bg-red-500 text-white hover:bg-red-600"
                                        : "bg-accent-green text-black hover:bg-[#3bc27b]"
                                }`}
                            >
                                {options.confirmText || "Confirm"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}
