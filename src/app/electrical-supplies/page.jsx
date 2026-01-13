"use client"

import { AnimatedBackground, GridPattern } from "@/components/ui/animated-background";
import { Zap, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function ElectricalSupplies() {
  return (
    <div className="relative">
      {/* Background Elements */}
      <AnimatedBackground />
      <GridPattern />
      
      {/* Main Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 min-h-screen flex items-center">
        <div className="max-w-4xl mx-auto w-full">
          {/* Back to Home Button */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate~z-x-1 transition-transform" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Coming Soon Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="glass-effect border border-border/50 rounded-3xl p-12 md:p-16">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-8"
              >
                <div className="p-6 rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-2xl">
                  <Zap className="w-16 h-16" />
                </div>
              </motion.div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-gradient bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                  Coming Soon
                </span>
              </h1>

              {/* Description */}
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                We're working hard to bring you an amazing collection of electrical supplies.
              </p>

              <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
                Our electrical supplies section is currently under development. 
                We'll be launching soon with a comprehensive range of quality electrical components, 
                tools, and supplies for all your needs.
              </p>

              {/* Clock Icon with Animation */}
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="flex justify-center mb-8"
              >
                <div className="p-4 rounded-full bg-muted/30">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
              </motion.div>

              {/* Contact Info */}
              <div className="mt-12 pt-8 border-t border-border/50">
                <p className="text-muted-foreground mb-4">
                  Want to be notified when we launch?
                </p>
                <p className="text-sm text-muted-foreground">
                  Contact us at <span className="text-primary font-medium">hello@bhsourcing.com</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

