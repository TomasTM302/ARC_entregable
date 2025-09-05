import Image from "next/image"
import { ChevronDown } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-[#0e2c52] py-6 border-t border-[#1a3a64]">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-4">
        <div className="flex items-center mb-4 md:mb-0">
          <h2 className="text-white text-xl mr-6">Panel de control</h2>
          <div className="w-32 h-16 relative rounded-md p-1 shadow-sm bg-[#0e2c52]">
            <Image src="/images/arcos-logo.png" alt="ARCOS Logo" fill className="object-contain" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="dropdown relative">
            <button className="flex items-center text-white hover:text-gray-300">
              Comercios cercanos
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>
          </div>

          <div className="dropdown relative">
            <button className="flex items-center text-white hover:text-gray-300">
              Proveedores
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>
          </div>

          <div className="dropdown relative">
            <button className="flex items-center text-white hover:text-gray-300">
              Administración
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
