export default function TermsPage() {
    const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "BookBind";

    const sections = [
        {
            title: "1. Acceptance of Terms and Binding Agreement",
            content: (
                <div className="space-y-4">
                    <p>
                        1.1 Methods of Acceptance: Agreement to these terms is established through any of the following actions: checking the "I agree" box during checkout, signing a quotation or invoice, paying a deposit or full invoice, or submitting artwork for production.
                    </p>
                    <p>
                        1.2 Authority: If you are accepting these terms on behalf of a corporation, partnership, or other legal entity, you represent and warrant that you possess the legal authority to bind that entity to this Agreement.
                    </p>
                    <p>
                        1.3 Right to Amend: {companyName} reserves the right to modify, update, or amend these Terms at any time without prior individual notice. The most current version will always be posted on our website. Continued use of our services following any changes constitutes acceptance of the new Terms.
                    </p>
                </div>
            )
        },
        {
            title: "2. Orders, Quotations, and Right of Refusal",
            content: (
                <div className="space-y-4">
                    <p>
                        2.1 Quotation Validity: Due to the volatile nature of supply chains and fluctuating costs for raw materials (paper, ink, coatings, packaging), all provided estimates and formal quotations are valid for exactly thirty (30) calendar days from the date of issuance.
                    </p>
                    <p>
                        2.2 Order Acceptance: An order is not considered accepted by {companyName} until all final artwork is received, proofs are approved, and payment terms are met.
                    </p>
                    <p>
                        2.3 Right of Refusal: We reserve the right, at our sole discretion, to refuse, suspend, or cancel any order at any stage. Reasons for refusal may include, but are not limited to: technical impossibility, suspected fraud, or submission of artwork that contains illegal, libelous, defamatory, highly offensive, or copyright-infringing material.
                    </p>
                </div>
            )
        },
        {
            title: "3. Artwork, File Specifications, and Prepress",
            content: (
                <div className="space-y-4">
                    <p>
                        3.1 Client Responsibility: The Client is solely responsible for the accuracy and quality of all submitted files. Files must be submitted in CMYK color mode, at a minimum resolution of 300 DPI (Dots Per Inch) at the final print size.
                    </p>
                    <p>
                        3.2 Fonts and Bleeds: All text must be converted to outlines or curves. All files must include a minimum of 0.125 inches (1/8") of bleed on all sides if the artwork extends to the edge of the product. Safe zones must be respected to prevent critical text from being trimmed.
                    </p>
                    <p>
                        3.3 Limitation of Prepress Liability: {companyName} is not responsible for poor print quality, pixelation, color shifts, or formatting errors resulting from improperly prepared files. If {companyName} must intervene to fix file errors, prepress formatting fees at our standard hourly rate may apply, subject to Client approval.
                    </p>
                </div>
            )
        },
        {
            title: "4. Proofing Process and Final Approval",
            content: (
                <div className="space-y-4">
                    <p>
                        4.1 Digital Proofs: Following file submission, {companyName} will provide a digital PDF proof. This proof is intended strictly for verifying layout, text accuracy, bleed, and image placement. Digital proofs cannot accurately replicate the exact color of the final printed piece due to backlighting on computer monitors.
                    </p>
                    <p>
                        4.2 Final Sign-Off: The Client must provide written or digital "OK to Print" approval. Once this approval is given, the file is immediately sent to plate and production.
                    </p>
                    <p>
                        4.3 No Post-Approval Changes: Absolutely no changes can be made to the artwork, quantity, or material specifications once final approval is granted.
                    </p>
                    <p>
                        4.4 Errors in Approved Proofs: {companyName} shall not be held liable for any errors contained in the final approved proof, including but not limited to misspellings, incorrect grammar, wrong dates, omitted text, or incorrect layout.
                    </p>
                </div>
            )
        },
        {
            title: "5. Color Matching and Printing Standards",
            content: (
                <div className="space-y-4">
                    <p>
                        5.1 RGB vs. CMYK: Computer monitors display colors in RGB (Red, Green, Blue) light, while physical printing uses CMYK (Cyan, Magenta, Yellow, Key/Black) ink. Therefore, colors viewed on a screen will fundamentally differ from the final printed product.
                    </p>
                    <p>
                        5.2 Commercial Match Standard: We print to a "Commercial Match" standard. This means we will produce a reasonable representation of the colors in your artwork. A color variance of up to 10% between the digital file and the final printed product, or between different production runs, is normal and considered an acceptable standard in the commercial printing industry.
                    </p>
                    <p>
                        5.3 Pantone/PMS Matching: Exact color matching requires the use of Pantone Matching System (PMS) spot colors. This requires dedicated press setup and is not included in standard CMYK pricing. Pantone matching is only guaranteed if explicitly requested, quoted, and paid for as a separate line item.
                    </p>
                </div>
            )
        },
        {
            title: "6. Manufacturing Tolerances and Variances",
            content: (
                <div className="space-y-4">
                    <p>
                        6.1 Overruns and Underruns: Setting up commercial printing presses requires "make-ready" waste. Consequently, exact quantities cannot be guaranteed. All orders are subject to an industry-standard overrun or underrun variance of +/- 10%.
                    </p>
                    <p>
                        6.2 Billing for Exact Quantities: The Client will only be billed for the exact quantity shipped. If an underrun occurs, a prorated refund will be issued. If an overrun occurs, the Client will be billed for the extra units at the agreed-upon per-unit rate.
                    </p>
                    <p>
                        6.3 Trimming and Folding Shifts: Paper is a physical medium subject to atmospheric conditions. During the cutting and folding processes, a mechanical shift of up to 1/16th of an inch (1.5mm) may occur. This shift is an acceptable manufacturing tolerance and does not constitute a defective product.
                    </p>
                </div>
            )
        },
        {
            title: "7. Materials, Supplies, and Substitutions",
            content: (
                <div className="space-y-4">
                    <p>
                        7.1 Customer-Supplied Stock: If a Client insists on supplying their own paper or substrate, {companyName} assumes no liability for spoilage, misprints, or how our inks/coatings react to the unverified material. A minimum of 20% extra stock must be provided for make-ready waste.
                    </p>
                    <p>
                        7.2 Material Substitutions: {companyName} sources paper from various global mills. While we strive to use the exact brand specified, supply chain disruptions may occur. We reserve the right to substitute paper stock with a product of comparable or superior quality, weight, and finish without prior notice to the Client.
                    </p>
                </div>
            )
        },
        {
            title: "8. Payment, Pricing, and Credit Terms",
            content: (
                <div className="space-y-4">
                    <p>
                        8.1 Payment Upfront: Unless a formal net-terms credit account has been established and approved in writing, 100% payment is required upfront before any prepress work or production begins.
                    </p>
                    <p>
                        8.2 Taxes and Fees: All displayed prices exclude applicable state, local, or federal sales taxes, duties, and shipping costs. These will be calculated and added to the final invoice at checkout. Tax-exempt organizations must provide a valid exemption certificate prior to ordering.
                    </p>
                    <p>
                        8.3 Late Payments: For Clients with established credit accounts, invoices are due strictly within the agreed-upon terms (e.g., Net 30). Late payments will accrue interest at a rate of 1.5% per month (18% annually), or the maximum rate permitted by law, whichever is lower. The Client is responsible for all collection costs and legal fees incurred by {companyName} in recovering past-due balances.
                    </p>
                </div>
            )
        },
        {
            title: "9. Shipping, Delivery, and Force Majeure",
            content: (
                <div className="space-y-4">
                    <p>
                        9.1 FOB Shipping Point: All shipments are made Free On Board (FOB) Shipping Point. This means that the title to the goods, and the risk of loss or damage, legally transfers to the Client the moment the carrier (UPS, FedEx, freight line) picks up the order from our facility.
                    </p>
                    <p>
                        9.2 Carrier Delays: {companyName} is not liable for any delays, losses, or damages caused by third-party shipping carriers, customs clearance, or incorrect addresses provided by the Client.
                    </p>
                    <p>
                        9.3 Split Shipments: If a Client requires an order to be shipped to multiple locations, additional handling and freight charges will apply per destination.
                    </p>
                    <p>
                        9.4 Force Majeure: We are not liable for production or delivery delays caused by events beyond our reasonable control, including Acts of God, severe weather, natural disasters, labor strikes, pandemics, material shortages, or government actions.
                    </p>
                </div>
            )
        },
        {
            title: "10. Cancellation and Returns Policy",
            content: (
                <div className="space-y-4">
                    <p>
                        10.1 All Sales Final: Because all Products are entirely custom-manufactured to the Client's specific artwork and specifications, they have no resale value. Therefore, all sales are final. There are no returns or refunds for custom-printed goods.
                    </p>
                    <p>
                        10.2 Cancellation Prior to Proofing: If an order is canceled before digital proofs are generated, a full refund will be issued minus a 5% administrative payment processing fee.
                    </p>
                    <p>
                        10.3 Cancellation Prior to Printing: If an order is canceled after proofs have been generated and sent, but before the Client has given final "OK to Print" approval, the order is subject to a flat prepress cancellation fee of $75.00, plus the cost of any physical proofs provided.
                    </p>
                    <p>
                        10.4 Post-Approval Cancellation: Once an order has been approved and moved into production, it cannot be canceled or refunded under any circumstances.
                    </p>
                </div>
            )
        },
        {
            title: "11. Claims, Defects, and Limitation of Liability",
            content: (
                <div className="space-y-4">
                    <p>
                        11.1 Notification Window: Any claims regarding defects, shortages, or damages must be submitted in writing to {companyName} within forty-eight (48) to seventy-two (72) hours of the documented delivery date.
                    </p>
                    <p>
                        11.2 Evidence Requirement: All claims must be accompanied by clear photographic evidence showing the defect. {companyName} reserves the right to request that a sample of the defective goods be shipped back to our facility for inspection before any reprint or refund is authorized.
                    </p>
                    <p>
                        11.3 Sole Remedy: If a manufacturing error is validated and deemed to be the fault of {companyName}, our sole obligation—and the Client's exclusive remedy—shall be either the reprinting of the defective portion of the order or a prorated refund for the defective units, at our discretion.
                    </p>
                    <p>
                        11.4 Limitation of Liability: Under no circumstances shall {companyName} be liable for any indirect, incidental, special, punitive, or consequential damages. This includes, without limitation, lost profits, loss of business, or costs associated with missed event deadlines, even if we were advised of the possibility of such damages. In all cases, {companyName}'s maximum total liability shall be strictly limited to the actual dollar amount paid by the Client for the specific order in dispute.
                    </p>
                </div>
            )
        },
        {
            title: "12. Intellectual Property and Indemnification",
            content: (
                <div className="space-y-4">
                    <p>
                        12.1 Client Warranties: By uploading or submitting artwork, the Client represents and warrants that they are the sole owner of the intellectual property rights, or that they have obtained all necessary licenses, permissions, and releases to use the content for commercial reproduction.
                    </p>
                    <p>
                        12.2 Indemnification: The Client agrees to fully indemnify, defend, and hold harmless {companyName}, its officers, employees, and affiliates from any and all claims, damages, liabilities, costs, and legal fees arising from allegations that the printed materials infringe upon the copyright, trademark, trade dress, privacy rights, or intellectual property of any third party.
                    </p>
                    <p>
                        12.3 Marketing Portfolio Rights: Unless the Client explicitly opts out in writing prior to production, {companyName} reserves the right to photograph the completed physical goods and use these images on our website, social media channels, and physical marketing materials as examples of our craftsmanship.
                    </p>
                </div>
            )
        },
        {
            title: "13. Storage Fees and Abandoned Goods",
            content: (
                <div className="space-y-4">
                    <p>
                        13.1 Storage Grace Period: Upon completion of an order, the Client will be notified that goods are ready for shipping or local pickup. {companyName} will hold completed goods at no charge for a maximum of fourteen (14) calendar days.
                    </p>
                    <p>
                        13.2 Storage Fees: If the Client delays shipping, fails to pick up the order, or fails to pay a remaining balance preventing shipment, a storage fee of $25.00 per pallet, per day (or a prorated amount for smaller parcels) will be applied starting on the 15th day.
                    </p>
                    <p>
                        13.3 Abandonment: If an order remains unclaimed or storage fees go unpaid for forty-five (45) days past the completion date, the goods will be considered abandoned. {companyName} reserves the right to recycle, destroy, or otherwise dispose of the goods without offering a refund or credit to the Client.
                    </p>
                </div>
            )
        },
        {
            title: "14. Severability and Governing Law",
            content: (
                <div className="space-y-4">
                    <p>
                        14.1 Severability: If any provision of this Agreement is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions of this Agreement shall remain in full force and effect.
                    </p>
                    <p>
                        14.2 Governing Law: This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which {companyName}'s primary manufacturing facility is located, without regard to its conflict of law principles.
                    </p>
                </div>
            )
        }
    ];

    return (
        <main className="max-w-4xl mx-auto px-6 py-16 space-y-16">
            {/* Header section with Pink styling to match Hero */}
            <div className="bg-[#FF90E8] border-4 border-black p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9]">
                    Terms & <br />Conditions.
                </h1>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t-2 border-black/10">
                    <p className="text-black font-bold uppercase text-sm tracking-widest">
                        Last updated: March 24, 2026
                    </p>
                    <p className="text-black/60 font-medium text-xs uppercase tracking-widest bg-black/5 px-3 py-1 rounded-full border border-black/10">
                        Binding Agreement
                    </p>
                </div>
            </div>

            {/* Introduction section - Simplified and Plain */}
            <div className="space-y-8">
                <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Introduction</h2>
                    <p className="font-medium leading-relaxed text-zinc-600">
                        Welcome to {companyName}. These Terms and Conditions ("Agreement") govern your use of our website, services, and the purchase of any custom-printed goods or related materials ("Products") from {companyName} ("Company," "we," "us," or "our"). The individual or entity placing an order is referred to as the "Client," "you," or "your."
                    </p>
                </div>

                <div className="space-y-4">
                    <p className="text-lg font-black uppercase tracking-tight">
                        PLEASE READ THIS AGREEMENT CAREFULLY. CUSTOM-MANUFACTURED GOODS ARE STRICTLY NON-REFUNDABLE.
                    </p>
                    <p className="text-zinc-600 font-bold leading-relaxed">
                        By accessing our platform, requesting a quote, approving a digital or physical proof, or submitting payment, you acknowledge that you have read, understood, and agreed to be legally bound by these Terms and Conditions in their entirety.
                    </p>
                </div>
            </div>

            {/* Main terms sections */}
            <div className="space-y-12">
                {sections.map((section) => (
                    <div key={section.title} className="group">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="h-2 w-2 bg-[#FF90E8] mt-2.5 shrink-0 group-hover:scale-150 transition-transform duration-300" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter leading-tight group-hover:text-[#FF90E8] transition-colors">
                                {section.title}
                            </h2>
                        </div>
                        <div className="pl-6 text-zinc-600 font-medium leading-relaxed">
                            {section.content}
                        </div>
                    </div>
                ))}
            </div>

            {/* Final Footer Note */}
            <div className="pt-16 border-t-4 border-black text-center">
                <p className="text-zinc-400 font-black uppercase text-xs tracking-[0.2em]">
                    End of Agreement • {companyName}
                </p>
            </div>
        </main>
    );
}
