import './globals.css'
import Sidebar from '@/components/Sidebar'
import { DemoModeProvider } from '@/contexts/DemoModeContext'

export const metadata = {
  title: 'Blendery — Sales Intelligence',
  description: 'AI-Powered Lead Generation & Outreach',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning style={{ background:'#080810', margin:0, padding:0 }}>
        <DemoModeProvider>
          <Sidebar />
          <main style={{ marginLeft:220, minHeight:'100vh', background:'#080810' }}>
            {children}
          </main>
        </DemoModeProvider>
      </body>
    </html>
  )
}
