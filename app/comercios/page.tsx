"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ExternalLink, ArrowLeft } from "lucide-react"
import { useAuthStore } from "@/lib/auth"
import Link from "next/link"

export default function ComerciosPage() {
  const { isAdmin } = useAuthStore()
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [businesses, setBusinesses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null)
      try {
        const res = await fetch("/api/comercios")
        const data = await res.json()
        if (data?.success && Array.isArray(data.comercios)) {
          setBusinesses(
            data.comercios.map((c: any) => ({
              id: c.id,
              name: c.nombre || c.name,
              imageUrl: c.logo_url || c.imageUrl,
              websiteUrl: c.sitio_web || c.websiteUrl,
              category: c.categoria || c.category || "",
              createdAt: c.fecha_registro || c.createdAt,
            }))
          )
        } else {
          setBusinesses([])
        }
      } catch (e) {
        setError("No se pudieron cargar los comercios")
        setBusinesses([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Obtener categorías únicas
  const categories = ["all", ...new Set(businesses.map((business) => business.category))]

  // Filtrar comercios por categoría
  const filteredBusinesses =
    selectedCategory === "all"
      ? businesses
      : businesses.filter((business) => business.category === selectedCategory)

  return (
    <main className="flex min-h-screen flex-col bg-[#0e2c52] pb-20">
      <header className="container mx-auto py-4 px-4 max-w-7xl">
        <Link href="/home" className="flex items-center text-white hover:text-gray-200">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Volver al inicio
        </Link>
      </header>
      <section className="container mx-auto flex-1 flex flex-col items-center justify-start py-8 px-4 max-w-7xl">
        <div className="w-full mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Comercios Cercanos</h1>
            <p className="text-gray-300 mt-2">Descubre los mejores comercios y servicios cerca de tu residencial</p>
          </div>
        </div>

        {/* Filtro por categorías */}
        <div className="mb-8 w-full max-w-4xl">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-[#d6b15e] text-[#0e2c52]"
                    : "bg-[#1a3a64] text-white hover:bg-[#254a7d]"
                }`}
              >
                {category === "all" ? "Todos" : category}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg p-8 text-center w-full max-w-md">
            <p className="text-gray-500">Cargando…</p>
          </div>
        ) : (
          <>
            {/* Grid de comercios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-6xl">
              {filteredBusinesses.map((business) => (
                <a
                  key={business.id}
                  href={business.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-lg overflow-hidden shadow-md transition-transform hover:scale-105"
                >
                  <div className="relative h-48 w-full">
                    <Image
                      src={business.imageUrl || "/placeholder.svg"}
                      alt={business.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-800">{business.name}</h3>
                    <p className="text-sm text-gray-500">{business.category}</p>
                    <div className="mt-2 flex items-center text-[#3b6dc7] text-sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      <span>Visitar sitio web</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {filteredBusinesses.length === 0 && (
              <div className="bg-white rounded-lg p-8 text-center w-full max-w-md">
                <p className="text-gray-500">{error || "No se encontraron comercios en esta categoría."}</p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
