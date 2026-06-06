import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata = {
  title: 'Blendery — Sales Intelligence',
  description: 'AI-Powered Lead Generation & Outreach',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true} style={{ background: '#07070F' }}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-60 min-h-screen" style={{ background: '#07070F' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
