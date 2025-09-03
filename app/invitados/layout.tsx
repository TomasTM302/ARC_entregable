import type React from "react"
import NavBar from "@/components/nav-bar"

export default function InvitadosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <NavBar />
    </>
  )
}
