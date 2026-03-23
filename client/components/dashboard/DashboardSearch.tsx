"use client";

import { Search, LayoutGrid, List, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";

interface DashboardSearchProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    viewMode: "grid" | "list";
    setViewMode: (mode: "grid" | "list") => void;
    placeholder?: string;
    filterValue?: string;
    setFilterValue?: (value: string) => void;
    filterOptions?: { label: string; value: string }[];
}

export function DashboardSearch({
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    placeholder = "Search...",
    filterValue,
    setFilterValue,
    filterOptions
}: DashboardSearchProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <Input
                    placeholder={placeholder}
                    className="pl-10 h-12 border-2 border-black rounded-full focus:ring-0 focus:ring-offset-0 focus-visible:ring-0"
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="flex flex-wrap items-center gap-4">
                {filterOptions && setFilterValue && (
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-zinc-500 hidden sm:block" />
                        <Select value={filterValue} onValueChange={setFilterValue}>
                            <SelectTrigger className="h-12 px-6 border-2 border-black bg-[#4be794] hover:bg-[#3cd083] text-black font-bold rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] 
                            hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all [&>svg]:stroke-[3px]">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent className="border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                {filterOptions.map((opt) => (
                                    <SelectItem 
                                        key={opt.value} 
                                        value={opt.value} 
                                        className="focus:bg-[#4be794] focus:text-black font-medium data-[state=checked]:shadow-[2px_2px_4px_rgba(0,0,0,0.1)] data-[state=checked]:bg-[#4be794]/10"
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                
                <div className="flex border-2 border-black p-1 bg-zinc-100 shrink-0 rounded-xl overflow-hidden">
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
