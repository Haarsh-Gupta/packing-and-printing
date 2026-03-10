"use client";

import { motion } from "framer-motion";
import { ServiceItem } from "@/types/service";
import { SubServiceCard } from "@/components/services/SubServiceCard";
import { staggerContainer, slideUpFade, cardReveal } from "@/lib/animations";
import AnimatedHero from "@/components/AnimatedHero";

const GRID_STYLES = `
  .product-grid {
    display: grid;
    gap: 28px;
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 900px) {
    .product-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 540px) {
    .product-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
  }
`;

export default function ServiceDetailView({ service }: { service: ServiceItem }) {
    return (
        <div className="bg-[#e0e9f8] text-zinc-900 pb-20 overflow-x-hidden">
            <style>{GRID_STYLES}</style>

            <AnimatedHero
                title={
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", display: 'block', textTransform: 'uppercase' }}>
                        {service.name}
                    </span>
                }
                description={
                    service.description ||
                    "Professional implementation and expert guidance tailored specifically for your structured requirements and operations. Experience unmatched quality."
                }
                ctaPlaceholder="Enter your project details..."
                ctaButtonText="Request Quote"
                bgColor="#e0e9f8"
                imageSrc={service.cover_image || undefined}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16 md:py-24">
                <div className="mb-10">
                    <motion.h2
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-60px" }}
                        variants={slideUpFade}
                        className="text-3xl font-black uppercase tracking-tight mb-8"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        Available Tiers & Services
                    </motion.h2>

                    {service.sub_services && service.sub_services.filter(s => s.is_active !== false).length > 0 ? (
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-60px" }}
                            className="product-grid"
                        >
                            {service.sub_services.filter(s => s.is_active !== false).map((variant, index) => (
                                <motion.div key={variant.id} variants={cardReveal}>
                                    <SubServiceCard variant={variant} index={index} serviceSlug={service.slug} />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className="p-10 border-4 border-black bg-zinc-50 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                            <p className="font-bold text-lg" style={{ fontFamily: "'DM Sans', sans-serif" }}>No designated variants found for this service category currently.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
