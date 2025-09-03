"use client"

import type { ReactNode } from "react"
import {} from "next/navigation"
import MobileHeader from "@/components/layouts/mobile-header"

interface VigilanteLayoutProps {
  children: ReactNode
}

export default function VigilanteLayout({ children }: VigilanteLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 w-full overflow-x-hidden">
      <MobileHeader isVigilante={true} />

      <main className="flex-grow w-full">
        <div className="w-full bg-[#0e2c52]">{children}</div>
      </main>
    </div>
  )
}
