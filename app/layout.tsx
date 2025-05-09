import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import { DatabaseInitializer } from "@/components/database-initializer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PLN Inventory System",
  description: "A web application for managing PLN inventory.",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <DatabaseInitializer />
      </body>
    </html>
  )
}
