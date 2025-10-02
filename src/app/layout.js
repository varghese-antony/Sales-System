import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
// import { CouponProvider } from "@/contexts/CouponContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "BH Sourcing - Premium Indoor & Outdoor Lighting",
  description: "Discover our curated collection of premium indoor and outdoor lighting solutions. Modern designs, exceptional quality.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased font-sans`}
      >
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <TooltipProvider>
                <div className="min-h-screen flex flex-col">
                  <Navbar/>
                  <main className="flex-1 animate-fade-in">
                    {children}
                  </main>
                  {/* <Footer/> */}
                </div>
              </TooltipProvider>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
