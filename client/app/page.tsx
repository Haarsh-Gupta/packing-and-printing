import Testimonials from "@/components/Testimonials";
import FeaturesSection from "@/components/FeaturesSection";
import Services from "@/components/Services";
import AboutSection from "@/components/AboutSection";
import HeroSection from "@/components/HeroSection";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <Services />
      <Testimonials />
      <AboutSection />
    </main>
  );
}

