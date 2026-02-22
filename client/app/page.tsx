import Testimonials from "@/components/Testimonials";
import FeaturesSection from "@/components/FeaturesSection";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import MarqueeSection from "@/components/MarqueeSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import StatsSection from "@/components/StatsSection";
import CTASection from "@/components/CTASection";
import TrustedBySection from "@/components/TrustedBySection";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <StatsSection />
      {/* <TrustedBySection /> */}
      <FeaturesSection />
      <MarqueeSection />
      <HowItWorksSection />
      <Testimonials />
      <AboutSection />
      <CTASection />
    </main>
  );
}
