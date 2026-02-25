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
      <WaveDivider topColor="white" bottomColor="white" variant="smooth" />
      <MarqueeSection />
      <WaveDivider topColor="white" bottomColor="black" variant="blob" />
      <HowItWorksSection />
      <WaveDivider topColor="black" bottomColor="white" variant="smooth" />
      <Testimonials />
      <WaveDivider topColor="white" bottomColor="#FDF567" variant="smooth" />
      <AboutSection />
      <WaveDivider topColor="#FDF567" bottomColor="#FF90E8" variant="blob" />
      <CTASection />
      {/* <WaveDivider topColor="#FDF567" bottomColor="#FF90E8" variant="blob" /> */}
    </main>
  );
}
