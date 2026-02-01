"use client";
import Header from "./_components/LandingHeader";
import HeroSection from "./_components/HeroSection";
import FeaturesSection from "./_components/FeaturesSections";
import CTASection from "./_components/CTASection";
import Footer from "./_components/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
}
