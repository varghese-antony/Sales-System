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
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{ marginLeft: '240px', flex: 1, minHeight: '100vh', background: '#07070F' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
