export const getOrderStatusColor = (status: string) => {
    switch (status) {
        case "WAITING_PAYMENT": return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "PARTIALLY_PAID": return "bg-orange-100 text-orange-800 border-orange-200";
        case "PAID": return "bg-blue-100 text-blue-800 border-blue-200";
        case "PROCESSING": return "bg-purple-100 text-purple-800 border-purple-200";
        case "READY": return "bg-indigo-100 text-indigo-800 border-indigo-200";
        case "COMPLETED": return "bg-green-100 text-green-800 border-green-200";
        case "CANCELLED": return "bg-zinc-100 text-zinc-500 border-zinc-200";
        default: return "bg-gray-100 text-gray-800";
    }
};

export const getOrderStatusStep = (status: string) => {
    const steps = ["WAITING_PAYMENT", "PAID", "PROCESSING", "READY", "COMPLETED"];
    if (status === "PARTIALLY_PAID") return 1;
    return steps.indexOf(status) + 1;
};

export const getInquiryStatusBadge = (status: string) => {
    // This depends on Badge which is a component. Maybe keep it in a component or pass it.
    // Let's create a common StatusBadge component instead.
    return status;
};
