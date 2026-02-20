"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import React from "react";

interface DashboardHeaderProps {
    title: string;
    description: string;
    children?: React.ReactNode;
}

export function DashboardHeader({ title, description, children }: DashboardHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-black pb-8">
            <div>
                <h1 className="text-5xl font-extrabold tracking-tighter text-neutral-900 uppercase">{title}</h1>
                <p className="text-xl font-bold text-zinc-500 mt-2">{description}</p>
            </div>
            <div className="flex gap-2">
                {children}
                <Button variant="outline" className="gap-2 border-2 border-black font-bold hover:bg-zinc-100 h-10">
                    <Download className="w-4 h-4" /> Export All
                </Button>
            </div>
        </div>
    );
}
