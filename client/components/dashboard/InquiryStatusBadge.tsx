"use client";

import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, CheckCircle2, XCircle, FileText, MessageSquare, Search } from "lucide-react";

export const InquiryStatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case "DRAFT":
            return <Badge className="bg-zinc-100 text-zinc-500 border-2 border-zinc-400 rounded-none hover:bg-zinc-100"><FileText className="w-3 h-3 mr-1" /> Draft</Badge>;
        case "SUBMITTED":
            return <Badge className="bg-[#fdf567] text-black border-2 border-black rounded-none hover:bg-[#fdf567]"><Clock className="w-3 h-3 mr-1" /> Pending Review</Badge>;
        case "UNDER_REVIEW":
            return <Badge className="bg-purple-100 text-purple-700 border-2 border-purple-400 rounded-none hover:bg-purple-100"><Search className="w-3 h-3 mr-1" /> Under Review</Badge>;
        case "NEGOTIATING":
            return <Badge className="bg-cyan-100 text-cyan-700 border-2 border-cyan-400 rounded-none hover:bg-cyan-100"><MessageSquare className="w-3 h-3 mr-1" /> Negotiating</Badge>;
        case "QUOTED":
            return <Badge className="bg-[#ff90e8] text-black border-2 border-black rounded-none hover:bg-[#ff90e8] animate-pulse"><AlertCircle className="w-3 h-3 mr-1" /> Quote Ready</Badge>;
        case "ACCEPTED":
            return <Badge className="bg-[#90e8ff] text-black border-2 border-black rounded-none hover:bg-[#90e8ff]"><CheckCircle2 className="w-3 h-3 mr-1" /> Accepted</Badge>;
        case "REJECTED":
            return <Badge className="bg-zinc-200 text-zinc-500 border-2 border-zinc-500 rounded-none hover:bg-zinc-200"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
        case "CANCELLED":
            return <Badge className="bg-zinc-200 text-zinc-500 border-2 border-zinc-400 rounded-none hover:bg-zinc-200"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
        case "EXPIRED":
            return <Badge className="bg-zinc-100 text-zinc-400 border-2 border-zinc-300 rounded-none hover:bg-zinc-100"><Clock className="w-3 h-3 mr-1" /> Expired</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
};
