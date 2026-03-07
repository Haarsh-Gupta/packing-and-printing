export const MOCK_INQUIRIES = [
    {
        id: 1,
        user_id: 1,
        template_id: 1,
        quantity: 500,
        selected_options: { binding: "Perfect Bound", pages: 200, paper: "Matter 90gsm" },
        notes: "Need this urgently for an event.",
        status: "QUOTED", // Ready for decision
        quoted_price: 15000,
        admin_notes: "Included express shipping.",
        quoted_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: 2,
        user_id: 1,
        template_id: 2,
        quantity: 1000,
        selected_options: { binding: "Spiral", pages: 50, paper: "Standard" },
        notes: null,
        status: "PENDING", // Still processing
        quoted_price: null,
        admin_notes: null,
        quoted_at: null,
        created_at: new Date().toISOString(),
    },
    {
        id: 3,
        user_id: 1,
        template_id: 1,
        quantity: 100,
        selected_options: { binding: "Hardcover", cover: "Leather" },
        notes: "Golden foil on cover please.",
        status: "ACCEPTED", // Moved to order
        quoted_price: 25000,
        admin_notes: "Premium materials sourced.",
        quoted_at: new Date(Date.now() - 172800000).toISOString(),
        created_at: new Date(Date.now() - 259200000).toISOString(),
    }
];

export const MOCK_MESSAGES = [
    {
        id: 1,
        inquiry_id: 1,
        sender_id: 1, // User
        content: "Hi, I need these by Friday. Is that possible?",
        created_at: new Date(Date.now() - 80000000).toISOString(),
    },
    {
        id: 2,
        inquiry_id: 1,
        sender_id: 2, // Admin
        content: "Yes, we can do express shipping for an extra fee. I've included it in the quote.",
        created_at: new Date(Date.now() - 70000000).toISOString(),
    },
    {
        id: 3,
        inquiry_id: 1,
        sender_id: 1, // User
        content: "Great, checking the quote now.",
        created_at: new Date(Date.now() - 60000000).toISOString(),
    }
];

export const MOCK_ORDERS = [
    {
        id: 101,
        inquiry_id: 3,
        total_amount: 25000,
        amount_paid: 5000,
        status: "PARTIALLY_PAID",
        product_name: "Hardcover Book (Gold Foil)",
        quantity: 100,
        image_url: "/placeholder-book.jpg",
        created_at: new Date(Date.now() - 100000000).toISOString(),
    },
    {
        id: 102,
        inquiry_id: 99, // Some past inquiry
        total_amount: 12000,
        amount_paid: 12000,
        status: "COMPLETED",
        product_name: "Standard Spiral Notebooks",
        quantity: 500,
        image_url: "/placeholder-notebook.jpg",
        created_at: new Date(Date.now() - 500000000).toISOString(),
    }
];

export const MOCK_NOTIFICATIONS = [
    {
        id: 1,
        title: "Quote Ready",
        message: "Your inquiry #1 has been quoted. Check the price now.",
        read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        link: "/dashboard/inquiries/1"
    },
    {
        id: 2,
        title: "Order Update",
        message: "Order #101 is now in production.",
        read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        link: "/dashboard/orders"
    }
];

export const MOCK_TICKETS = [
    {
        id: 1,
        subject: "Where is my order #101?",
        status: "IN_PROGRESS" as const,
        priority: "HIGH" as const,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: 2,
        subject: "Request for custom paper samples",
        status: "OPEN" as const,
        priority: "MEDIUM" as const,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 43200000).toISOString(),
    },
    {
        id: 3,
        subject: "Invoice correction needed",
        status: "RESOLVED" as const,
        priority: "LOW" as const,
        created_at: new Date(Date.now() - 604800000).toISOString(),
        updated_at: new Date(Date.now() - 259200000).toISOString(),
    },
];

export const MOCK_TICKET_MESSAGES = [
    {
        id: 1,
        ticket_id: 1,
        sender_id: 1,
        sender_name: "You",
        content: "Hi, I placed order #101 five days ago and haven't received any shipping update. Can you help?",
        is_admin: false,
        created_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
        id: 2,
        ticket_id: 1,
        sender_id: 99,
        sender_name: "Support Team",
        content: "Hello! Thank you for reaching out. Let me check the status of your order right away.",
        is_admin: true,
        created_at: new Date(Date.now() - 160000000).toISOString(),
    },
    {
        id: 3,
        ticket_id: 1,
        sender_id: 99,
        sender_name: "Support Team",
        content: "I've confirmed with our production team — your order is in final quality check and will be dispatched tomorrow. You'll receive a tracking number via email.",
        is_admin: true,
        created_at: new Date(Date.now() - 150000000).toISOString(),
    },
    {
        id: 4,
        ticket_id: 1,
        sender_id: 1,
        sender_name: "You",
        content: "That's great to hear! Thanks for the quick response.",
        is_admin: false,
        created_at: new Date(Date.now() - 140000000).toISOString(),
    },
];
