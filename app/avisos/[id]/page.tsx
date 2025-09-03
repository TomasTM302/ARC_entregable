"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  PawPrintIcon as Paw,
  Bell,
  AlertTriangle,
  Wrench,
} from "lucide-react"
// Store eliminado
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function AvisoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [notice, setNotice] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const noticeId = params.id as string;

  useEffect(() => {
    if (!noticeId) return;
    setLoading(true);
    fetch(`/api/avisos/${noticeId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.aviso) {
          setNotice(data.aviso);
        } else {
          setNotice(null);
        }
      })
      .catch(() => setNotice(null))
      .finally(() => setLoading(false));
  }, [noticeId]);

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Cargando aviso...</div>;
  }
  if (!notice) {
    router.push("/avisos");
    return null;
  }

  // Función para obtener el icono según el tipo de aviso
  const getNoticeIcon = (type: string) => {
    switch (type) {
      case "emergencia":
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      case "mantenimiento":
        return <Wrench className="h-6 w-6 text-yellow-500" />;
      default:
        return <Bell className="h-6 w-6 text-gray-500" />;
    }
  };

  // Función para obtener el color de fondo según el tipo de aviso
  const getNoticeBgColor = (type: string) => {
    switch (type) {
      case "emergencia":
        return "bg-red-50";
      case "mantenimiento":
        return "bg-yellow-50";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#0e2c52] pb-20">
      <header className="container mx-auto py-4 px-4 max-w-7xl">
        <Link href="/avisos" className="flex items-center text-white hover:text-gray-200">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Volver a Avisos
        </Link>
      </header>

      <section className="container mx-auto flex-1 flex flex-col items-center justify-start py-8 px-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl text-gray-800 mb-8 mx-auto">
          <div className={`mb-6 p-4 rounded-lg ${getNoticeBgColor(notice.importante)}`}> 
            <div className="flex items-center mb-2">
              {getNoticeIcon(notice.importante)}
              <span className="text-xs text-gray-500 ml-auto">
                {notice.fecha_publicacion ? format(new Date(notice.fecha_publicacion), "d 'de' MMMM, yyyy - HH:mm", { locale: es }) : ""}
              </span>
            </div>
            <h1 className="text-2xl font-semibold mt-1">{notice.titulo}</h1>
          </div>

          {notice.imagen_url && (
            <div className="mb-6">
              <img
                src={notice.imagen_url || "/placeholder.svg"}
                alt="Imagen del aviso"
                className="w-full max-h-96 object-contain rounded-md"
              />
            </div>
          )}

          <div>
            <p className="text-gray-700 whitespace-pre-line">{notice.contenido}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
