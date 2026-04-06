import React from "react";
import { ConfigPageSkeleton } from "@/components/SkeletonStore";

export default function Loading() {
    return (
        <div className="min-h-screen bg-site-bg">
            <ConfigPageSkeleton />
        </div>
    );
}
