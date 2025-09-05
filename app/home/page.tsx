"use client"

import Image from "next/image"
import Link from "next/link"
import { useAuthStore } from "@/lib/auth"

// Definir los servicios para poder manejarlos más fácilmente
const services = [
  {
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pago-mantenimiento-MMTFximFCagRLrjHRH3fhK1XX4GPLy.png",
    href: "/pago-mantenimiento",
  },
  {
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/invitados-R778qq40SqNIbhj2t9gYE9fsrfFGLX.png",
    href: "/invitados",
  },
  {
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mascota-extraviada-HowA5Xm77xCEyFYJmtdr60BAlYHib7.png",
    href: "/mascotas",
  },
  {
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/comercios-cercanos-6g6KyXXvEYUPJmI2rJkgjWHnS15rNz.png",
    href: "/comercios",
  },
  {
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/transparencia-HPCcMQujJdUNifOQfXgdpYdVw8ethC.png",
    href: "/transparencia",
  },
  {
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/reserva-areas-comunes.jpg-qsAKzyGo5309VijOfsHtfssWsUAaz0.jpeg",
    href: "/reserva-areas",
  },
  {
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/avisos.jpg-gdFGXSxYms2wowe1c1Wh7jgstODMaM.jpeg",
    href: "/avisos",
  },
]

export default function Home() {
  const { logout, user, isAdmin } = useAuthStore()

  const handleLogout = () => {
    logout()
    window.location.href = "/login"
  }

  return (
    <main className="min-h-screen bg-[#0e2c52]">
      {/* Header */}
      <header className="bg-[#0e2c52] py-4 px-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/home" className="flex items-center">
            <div className="bg-[#0e2c52] rounded-md p-1 shadow-sm">
              <Image
                src="/images/arcos-logo.png"
                alt="ARCOS Logo"
                width={72}
                height={72}
                className="object-contain"
              />
            </div>
          </Link>

          {/* User Info and Actions */}
          <div className="flex items-center gap-4">
            <span className="text-white">
              Hola, {user?.firstName} ({user?.role === "admin" ? "Admin" : "Residente"})
            </span>
            {isAdmin && (
              <Link
                href="/admin"
                className="bg-[#d6b15e] text-[#0e2c52] px-4 py-2 rounded-md font-medium hover:bg-[#c4a052] transition-colors"
              >
                Panel administrativo
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="bg-[#d6b15e] text-[#0e2c52] px-4 py-2 rounded-md font-medium hover:bg-[#c4a052] transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6">
        {/* Welcome Title */}
        <h1 className="text-white text-6xl md:text-7xl font-bold mb-16 text-center">Bienvenidos</h1>

        {/* Services Grid */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-8 md:gap-x-16 lg:gap-x-20 max-w-2xl md:max-w-4xl lg:max-w-6xl">
          {services.map((service, index) => (
            <Link
              key={index}
              href={service.href}
              className={`block w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 hover:scale-105 transition-transform duration-300 ${
                services.length % 2 !== 0 && index === services.length - 1 ? "col-span-2 mx-auto" : ""
              }`}
            >
              <Image
                src={service.image || "/placeholder.svg"}
                alt={`Service ${index + 1}`}
                width={320}
                height={320}
                className="w-full h-full object-cover rounded-lg shadow-lg"
                priority
              />
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
