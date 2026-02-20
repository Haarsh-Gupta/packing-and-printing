"use client";

import { Search, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DashboardSearchProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    viewMode: "grid" | "list";
    setViewMode: (mode: "grid" | "list") => void;
    placeholder?: string;
}

export function DashboardSearch({
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    placeholder = "Search..."
}: DashboardSearchProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <Input
                    placeholder={placeholder}
                    className="pl-10 h-12 border-2 border-black rounded-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-3">
                <div className="flex border-2 border-black p-1 bg-zinc-100">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 transition-all ${viewMode === "grid" ? "bg-black text-white" : "hover:bg-zinc-200"}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 transition-all ${viewMode === "list" ? "bg-black text-white" : "hover:bg-zinc-200"}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
