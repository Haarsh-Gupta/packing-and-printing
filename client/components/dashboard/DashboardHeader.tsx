"use client";

import React from "react";

interface DashboardHeaderProps {
    title: string;
    description: string;
    badge?: string;
    icon?: React.ReactNode;
    accent?: string;
    children?: React.ReactNode;
}

export function DashboardHeader({
    title,
    description,
    badge,
    icon,
    accent = "#fdf567",
    children,
}: DashboardHeaderProps) {
    return (
        <div 
            className="relative overflow-hidden rounded-2xl border border-black/10 shadow-sm" 
            style={{ backgroundColor: accent }}
        >
            {/* Dot pattern background (matching landing page) */}
            <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle,#000_1px,transparent_1px)] bg-size-[24px_24px]" />

            <div className="relative z-10 p-6 sm:p-8 md:p-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                    <div className="space-y-3">
                        {/* Rotated badge label (like landing page section headers) */}
                        {badge && (
                            <div className="inline-block bg-white text-black px-3 py-1.5 font-black text-xs uppercase tracking-widest border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -rotate-1">
                                {badge}
                            </div>
                        )}

                        {/* Title with icon */}
                        <div className="flex items-center gap-3">
                            {icon && (
                                <div className="w-12 h-12 bg-white border-3 border-black rounded-full flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    {icon}
                                </div>
                            )}
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-black leading-[0.9]">
                                {title}
                            </h1>
                        </div>

                        {/* Description */}
                        <p className="text-sm sm:text-base text-black/60 font-medium max-w-lg leading-relaxed">
                            {description}
                        </p>
                    </div>

                    {/* Action buttons slot */}
                    {children && (
                        <div className="flex gap-3 shrink-0">
                            {children}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
