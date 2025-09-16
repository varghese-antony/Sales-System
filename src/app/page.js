import { ProductCard } from "@/components/ProductCard";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { AnimatedBackground, GridPattern } from "@/components/ui/animated-background";
import { Lightbulb, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="relative">
      {/* Background Elements */}
      <AnimatedBackground />
      <GridPattern />
      
      {/* Hero Section */}
      <HeroSection />

      {/* Product Cards Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Explore Our 
              <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Collections</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose from our carefully curated indoor and outdoor lighting collections, 
              each designed to enhance your space with style and functionality.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <ProductCard
              title="Indoor Lighting"
              description="Transform your interior spaces with our elegant indoor lighting collection featuring chandeliers, pendant lights, and modern fixtures"
              link="/indoor"
              icon={<Lightbulb className="w-8 h-8" />}
              gradient="from-blue-500 to-purple-600"
            />
            <ProductCard
              title="Outdoor Lighting"
              description="Illuminate your exterior spaces with weather-resistant outdoor solutions including landscape, security, and decorative lighting"
              link="/outdoor"
              icon={<Sparkles className="w-8 h-8" />}
              gradient="from-green-500 to-teal-600"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      {/* <FeaturesSection /> */}
    </div>
  );
}
