"use client";

import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export const InquiryStatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case "PENDING":
            return <Badge className="bg-[#fdf567] text-black border-2 border-black rounded-none hover:bg-[#fdf567]"><Clock className="w-3 h-3 mr-1" /> Pending Review</Badge>;
        case "QUOTED":
            return <Badge className="bg-[#ff90e8] text-black border-2 border-black rounded-none hover:bg-[#ff90e8] animate-pulse"><AlertCircle className="w-3 h-3 mr-1" /> Quote Ready</Badge>;
        case "ACCEPTED":
            return <Badge className="bg-[#90e8ff] text-black border-2 border-black rounded-none hover:bg-[#90e8ff]"><CheckCircle2 className="w-3 h-3 mr-1" /> Accepted</Badge>;
        case "REJECTED":
            return <Badge className="bg-zinc-200 text-zinc-500 border-2 border-zinc-500 rounded-none hover:bg-zinc-200"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
};
