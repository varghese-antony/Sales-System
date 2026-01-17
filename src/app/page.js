import { ProductCard } from "@/components/ProductCard";
import { AnimatedBackground, GridPattern } from "@/components/ui/animated-background";
import { Lightbulb, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="relative">
      {/* Background Elements */}
      <AnimatedBackground />
      <GridPattern />
      
      {/* Main Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 min-h-screen">
        <div className="max-w-7xl mx-auto w-full">
          {/* Company Information Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to 
              <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> BH Sourcing ■</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Your trusted partner for premium lighting and electrical supplies. 
              We provide exceptional quality products and solutions to transform your spaces.
            </p>
          </div>

          {/* Product Category Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mt-16">
            <ProductCard
              title="Lighting"
              description="Discover our comprehensive collection of premium lighting solutions including indoor and outdoor fixtures designed to enhance your space with style and functionality"
              link="/lighting"
              icon={<Lightbulb className="w-8 h-8" />}
              gradient="from-blue-500 to-purple-600"
            />
            <ProductCard
              title="Electrical"
              description="Explore our wide range of electrical components for all your electrical needs. Quality products for residential and commercial applications"
              link="/electrical-supplies"
              icon={<Zap className="w-8 h-8" />}
              gradient="from-blue-500 to-purple-600"
            />
          </div>
          
        </div>
      </section>
    </div>
  );
}
