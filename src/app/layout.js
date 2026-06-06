import './globals.css'

export const metadata = {
  title: 'Blendery Sales System',
  description: 'AI-Powered Lead Generation & Outreach for Blendery Tech Solutions',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
