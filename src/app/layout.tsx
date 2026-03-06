import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'March0603 — Emissions Calculator',
  description: 'DESNZ 2024 emissions calculation engine for UK businesses.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
