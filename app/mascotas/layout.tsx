import type React from "react"
import NavBar from "@/components/nav-bar"
import Footer from "@/components/footer"

export default function MascotasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Footer />
      <NavBar />
    </>
  )
}
