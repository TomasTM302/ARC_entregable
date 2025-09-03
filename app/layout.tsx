import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import AuthRedirect from "@/components/auth-redirect"
import RootLayoutClient from "@/components/layouts/root-layout-client"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ARC",
  description: "Portal web para residentes",
    generator: 'v0.dev'
}

// Asegurar que el layout raíz ocupe todo el ancho y no tenga márgenes
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="w-full overflow-x-hidden">
      <body className={`${inter.className} w-full overflow-x-hidden m-0 p-0`}>
        <AuthRedirect />
  <RootLayoutClient>{children}</RootLayoutClient>
  <Toaster />
      </body>
    </html>
  )
}
