import { ProductCard } from "@/components/ProductCard";
import { AnimatedBackground, GridPattern } from "@/components/ui/animated-background";
import { Lightbulb, Zap, Building2, Mail, Phone, MapPin } from "lucide-react";

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
              <span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> BH Sourcing</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Your trusted partner for premium lighting and electrical supplies. 
              We provide exceptional quality products and solutions to transform your spaces.
            </p>
            
            {/* Company Details */}
            <div className="mt-12 max-w-4xl mx-auto">
              <div className="glass-effect border border-border/50 rounded-3xl p-8 md:p-12">
                <div className="flex items-center justify-center mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                    <Building2 className="w-10 h-10" />
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-6">About Our Company</h2>
                <p className="text-muted-foreground leading-relaxed mb-8 text-lg">
                  BH Sourcing is a leading provider of premium lighting solutions and electrical supplies. 
                  With years of experience in the industry, we are committed to delivering exceptional quality 
                  products that meet the highest standards. Our extensive catalog includes everything from 
                  elegant indoor lighting fixtures to robust outdoor solutions and comprehensive electrical supplies.
                </p>
                
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="flex flex-col items-center gap-2">
                    <MapPin className="w-6 h-6 text-primary" />
                    <span className="text-sm text-muted-foreground text-center">123 Design Street, City, State 12345</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Phone className="w-6 h-6 text-primary" />
                    <span className="text-sm text-muted-foreground">+1 (555) 123-4567</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Mail className="w-6 h-6 text-primary" />
                    <span className="text-sm text-muted-foreground">hello@bhsourcing.com</span>
                  </div>
                </div>
              </div>
            </div>
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
              title="Electrical Supplies"
              description="Explore our wide range of electrical supplies and components for all your electrical needs. Quality products for residential and commercial applications"
              link="/electrical-supplies"
              icon={<Zap className="w-8 h-8" />}
              gradient="from-orange-500 to-red-600"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
