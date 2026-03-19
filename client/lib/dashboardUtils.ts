export const getOrderStatusColor = (status: string) => {
    switch (status) {
        case "WAITING_PAYMENT": return "bg-amber-50 text-amber-600 border-amber-200";
        case "PARTIALLY_PAID": return "bg-blue-50 text-blue-600 border-blue-200";
        case "PAID": return "bg-green-50 text-green-600 border-green-200";
        case "PROCESSING": return "bg-purple-50 text-purple-600 border-purple-200";
        case "READY": return "bg-sky-50 text-sky-600 border-sky-200";
        case "COMPLETED": return "bg-emerald-50 text-emerald-600 border-emerald-200";
        case "CANCELLED": return "bg-red-50 text-red-600 border-red-200";
        default: return "bg-gray-100 text-gray-800";
    }
};

export const getOrderStatusStep = (status: string) => {
    const steps = ["WAITING_PAYMENT", "PAID", "PROCESSING", "READY", "COMPLETED"];
    if (status === "PARTIALLY_PAID") return 1;
    const index = steps.indexOf(status);
    return index === -1 ? 0 : index + 1;
};

export const getInquiryStatusBadge = (status: string) => {
    // This depends on Badge which is a component. Maybe keep it in a component or pass it.
    // Let's create a common StatusBadge component instead.
    return status;
};
