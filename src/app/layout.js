import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
// import { CouponProvider } from "@/contexts/CouponContext";

// Fonts are loaded via CSS @import in globals.css to avoid build-time fetching issues

export const metadata = {
  title: "BH Sourcing - Premium Indoor & Outdoor Lighting",
  description: "Discover our curated collection of premium indoor and outdoor lighting solutions. Modern designs, exceptional quality.",
  other: {
    'preconnect-google-fonts': 'https://fonts.googleapis.com',
    'preconnect-google-fonts-static': 'https://fonts.gstatic.com',
  },
};

const themeScript = `
(function(){
  try {
    var d=document.documentElement.classList;
    // Default to dark mode - only use light if explicitly set
    if(localStorage.theme==='light')
      d.remove('dark');
    else
      d.add('dark'); // Default to dark mode
  } catch(e){
    // If localStorage fails, default to dark mode
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@100..800&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className="antialiased font-sans"
        suppressHydrationWarning
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
