
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function CondominiumListPage() {
  const [condominiums, setCondominiums] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/condominios?simple=1")
      .then(async (res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        if (data.success && Array.isArray(data.condominiums)) {
          setCondominiums(data.condominiums);
        } else {
          setCondominiums([]);
        }
      })
      .catch((err) => {
        setError("No se pudieron cargar los condominios");
        setCondominiums([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredCondominiums = condominiums.filter((condo) =>
    (condo.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-bold text-black text-center">Condominios</h1>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Buscar condominios..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando condominios...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : filteredCondominiums.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron condominios</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredCondominiums.map((condo) => (
              <Link key={condo.id} href={`/mantenimiento/${condo.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="relative h-40 w-full">
                    <Image
                      src={
                        condo.id === 1
                          ? "/images/mountain-view-residence.png"
                          : condo.id === 2
                          ? "/images/modern-residential-building.png"
                          : condo.id === 3
                          ? "/images/luxury-river-condo.png"
                          : "/images/apartment-complex-garden.png"
                      }
                      alt={condo.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold">{condo.name}</h2>
                    {condo.direccion && (
                      <p className="text-sm text-gray-600 mt-1">{condo.direccion}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
