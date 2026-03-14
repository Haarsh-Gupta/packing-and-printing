import Testimonials from "@/components/Testimonials";
import FeaturesSection from "@/components/FeaturesSection";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import MarqueeSection from "@/components/MarqueeSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import StatsSection from "@/components/StatsSection";
import CTASection from "@/components/CTASection";
import TrustedBySection from "@/components/TrustedBySection";
import WaveDivider from "@/components/WaveDivider";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <div className="h-10"></div>
      <MarqueeSection />
      <WaveDivider topColor="var(--site-bg)" bottomColor="black" variant="blob" />
      <HowItWorksSection />
      <WaveDivider topColor="black" bottomColor="var(--site-bg)" variant="smooth" />
      <Testimonials />
      <WaveDivider topColor="var(--site-bg)" bottomColor="#FDF567" variant="smooth" />
      <AboutSection />
      <WaveDivider topColor="#FDF567" bottomColor="#A78BFA" variant="blob" />
      <CTASection />
      <WaveDivider topColor="#A78BFA" bottomColor="#FF90E8" variant="blob" />
    </main>
  );
}
