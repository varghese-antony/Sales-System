import { ProductCard } from "@/components/ProductCard";
import { AnimatedBackground, GridPattern } from "@/components/ui/animated-background";
import { Lightbulb, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="relative">
      {/* Background Elements */}
      <AnimatedBackground />
      <GridPattern />
      
      {/* Main Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Illuminate Your 
              <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Space</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover our curated collection of premium lighting solutions, 
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
    </div>
  );
}
