export default function PrivacyPage() {
    return (
        <main className="max-w-3xl mx-auto px-4 py-16 space-y-10">
            <div className="text-center space-y-4 border-b-4 border-black pb-8">
                <h1 className="text-5xl font-black uppercase tracking-tighter">Privacy Policy</h1>
                <p className="text-zinc-500 font-bold">Last updated: February 2026</p>
            </div>

            {[
                { title: "1. Information We Collect", body: "We collect information you provide directly — name, email, phone number, shipping address, and payment details. We also collect usage data such as pages viewed, browser type, and device information to improve our services." },
                { title: "2. How We Use Your Information", body: "Your information is used to: process and fulfil orders, communicate order status and updates, send notifications and promotional content (with your consent), improve our platform and customer experience, and comply with legal obligations." },
                { title: "3. Payment Security", body: "All payment transactions are processed through Razorpay's secure gateway. We do not store your complete card details on our servers. Payment processing is handled in compliance with PCI-DSS standards." },
                { title: "4. Data Sharing", body: "We do not sell your personal information. We may share data with: logistics partners (for order delivery), payment processors (Razorpay), cloud service providers (for file storage), and law enforcement (when legally required)." },
                { title: "5. Data Storage & Retention", body: "Your data is stored on secure cloud servers. We retain your information for as long as your account is active or as needed to provide services. You may request account deletion at any time by contacting our support team." },
                { title: "6. Cookies", body: "We use essential cookies for authentication and session management. No third-party tracking cookies are used without your explicit consent." },
                { title: "7. Your Rights", body: "You have the right to: access your personal data, correct inaccurate information, request deletion of your data, opt-out of marketing communications, and lodge a complaint with a data protection authority." },
                { title: "8. Contact", body: "For privacy-related inquiries, contact us at hello@bookbind.com or open a support ticket through your dashboard." },
            ].map((section) => (
                <div key={section.title} className="space-y-2">
                    <h2 className="text-xl font-black uppercase tracking-tight">{section.title}</h2>
                    <p className="text-zinc-600 font-medium leading-relaxed">{section.body}</p>
                </div>
            ))}
        </main>
    );
}
