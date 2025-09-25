"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, QrCode, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVisitorStore } from "@/lib/visitor-store"
import { useAuthStore } from "@/lib/auth"

interface FormValues {
  name: string
  phone: string
  visitDate: string
  entryTime: string
  destination: string
  companions: string
}

export default function InvitadosPage() {
  const router = useRouter()
  const { addVisitor } = useVisitorStore()
  const { user, isAuthenticated } = useAuthStore()

  const [formData, setFormData] = useState<FormValues>({
    name: "",
    phone: "",
    visitDate: "",
    entryTime: "",
    destination: "",
    companions: "",
  })
  const [pdfData, setPdfData] = useState<FormValues | null>(null)
  // Subida de imágenes deshabilitada en este apartado
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [qrData, setQrData] = useState<string>("")
  const [qrSnapshot, setQrSnapshot] = useState<string>("")
  const [qrPreviewBase64, setQrPreviewBase64] = useState<string | null>(null)
  const [residentInfo, setResidentInfo] = useState({ condominium: "", address: "" })
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Obtener info del residente
  useEffect(() => {
    if (isAuthenticated && user) {
      let address = user.house || ""
      if (user.house?.includes("-")) {
        const [, ...rest] = user.house.split("-")
        address = rest.join("-").trim()
      }
      setResidentInfo({ condominium: "Residencial Arcos", address })
      setFormData(f => ({ ...f, destination: f.destination || address }))
    }
  }, [isAuthenticated, user])

  // Auto-fill destino
  useEffect(() => {
    if (residentInfo.address && !formData.destination) {
      setFormData(f => ({ ...f, destination: residentInfo.address }))
    }
  }, [residentInfo.address])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const field = e.target.id as keyof FormValues
    setFormData(f => ({ ...f, [field]: e.target.value }))
  }

  const handleGenerateQR = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    setShowQR(false)

    try {
      // Validaciones
      if (!formData.name) throw new Error("El nombre es obligatorio")
      if (!/^\d{10}$/.test(formData.phone)) throw new Error("Teléfono de 10 dígitos")
      if (!formData.visitDate) throw new Error("La fecha es obligatoria")
      if (!formData.entryTime) throw new Error("La hora es obligatoria")
      if (!formData.destination) throw new Error("La dirección es obligatoria")
      if (formData.companions) {
        const n = Number(formData.companions)
        if (!Number.isInteger(n) || n < 0) throw new Error("Acompañantes ≥ 0")
      }

  // Registrar invitado (sin foto)
  addVisitor({ ...formData })
      setSuccess("Invitado registrado correctamente")

  // Guardar snapshot para PDF
  setPdfData({ ...formData })

      // Construir contenido multilínea para QR
      const acomp = formData.companions ? `\nACOMPAÑANTES: ${formData.companions}` : ""
      const content =
        `NOMBRE: ${formData.name}\n` +
        `TELÉFONO: ${formData.phone}\n` +
        `FECHA: ${formData.visitDate}\n` +
        `HORA: ${formData.entryTime}\n` +
        `DIRECCIÓN: ${formData.destination}` +
        acomp

      setQrData(content)
      setQrSnapshot(content)
      // Generar QR base64 local para vista previa (idéntico al del PDF)
      ;(async () => {
        try {
          const QRCode = (await import("qrcode")).default
          const dataUrl = await QRCode.toDataURL(content, { errorCorrectionLevel: "M", margin: 1, width: 200 })
          setQrPreviewBase64(dataUrl)
        } catch (e) {
          console.warn("No se pudo generar QR local para vista previa:", e)
          setQrPreviewBase64(null)
        }
      })()
      setShowQR(true)

      // Programar la generación automática del PDF una vez que el QR haya sido renderizado
      setTimeout(() => {
        void exportToPDF()
      }, 150)

      // Limpiar formulario tras 5s
      setTimeout(() => {
        setFormData({
          name: "",
          phone: "",
          visitDate: "",
          entryTime: "",
          destination: residentInfo.address,
          companions: "",
        })
        setSuccess(null)
      }, 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleGenerateQR(e as any)
  }


  // Cambia el nombre del archivo de logo y agrega manejo de error en getBase64Image
  const getBase64Image = async (url: string): Promise<string> => {
    try {
      // Reemplaza espacios por guiones para evitar errores de ruta
      const safeUrl = url.replace(/ /g, "-");
  console.log("[getBase64Image] fetching:", safeUrl)
  const res = await fetch(safeUrl)
      if (!res.ok) throw new Error(`No se pudo cargar la imagen: ${safeUrl}`)
      const blob = await res.blob()
  console.log("[getBase64Image] blob size:", blob.size)
      return await new Promise((resl, rej) => {
        const reader = new FileReader()
        reader.onload = () => resl(reader.result as string)
        reader.onerror = rej
        reader.readAsDataURL(blob)
      })
    } catch (err) {
      throw new Error("No se pudo cargar una imagen necesaria para el PDF. Verifica que el archivo exista en la carpeta public y que el nombre no tenga espacios ni errores de mayúsculas/minúsculas.")
    }
  }

   // Genera el PDF con el formato solicitado
const exportToPDF = async () => {
  if (!showQR) return;
  setIsGeneratingPDF(true);

  try {
    // 1) Inicialización jsPDF y dimensiones
const jsPDFModule = await import("jspdf");
const jsPDF       = jsPDFModule.jsPDF || jsPDFModule.default;
const doc         = new jsPDF({ unit: "mm", format: "a4" });
const pageW       = doc.internal.pageSize.getWidth();

// 2) Marco exterior
doc
  .setDrawColor(14, 44, 82)
  .setLineWidth(2)
  .rect(5, 5, pageW - 10, 287, "S");


  // 4) Logo Monet (esquina superior derecha)
const logoMonet = await getBase64Image("/logo monet.png");
const logoW     = 40;
const logoH     = 40;
doc.addImage(logoMonet, "PNG",85 ,10 , logoW, logoH);

// 3) Header: título y fecha
const now = new Date();
doc
  .setFont("helvetica", "bold")
  .setFontSize(32)
  .setTextColor(14, 44, 82)
  .text("PASE DE INVITADO",50, 50);
doc
  .setFont("helvetica", "normal")
  .setFontSize(10)
  .setTextColor(14, 44, 82)
  .text(
    `GENERADO EL ${now.toLocaleDateString("es-MX")} A LAS ${now
      .toLocaleTimeString("es-MX")
      .toUpperCase()}`,
    65,
    55
  );


// 5) QR a la izquierda (generado localmente y usando el mismo contenido que la vista previa)
const dataForPdf = pdfData || formData;
const qrString = qrSnapshot && qrSnapshot.length > 0
  ? qrSnapshot
  : (
      `NOMBRE: ${dataForPdf.name}\n` +
      `TELÉFONO: ${dataForPdf.phone}\n` +
      `FECHA: ${dataForPdf.visitDate}\n` +
      `HORA: ${dataForPdf.entryTime}\n` +
      `DIRECCIÓN: ${dataForPdf.destination}` +
      (dataForPdf.companions ? `\nACOMPAÑANTES: ${dataForPdf.companions}` : "")
    );
const QRCode = (await import("qrcode")).default;
const qrBase64 = await QRCode.toDataURL(qrString, {
  errorCorrectionLevel: "M",
  margin: 1,
  width: 200,
});
console.log("[exportToPDF] qrBase64 prefix:", qrBase64.substring(0, 30));
const qrSize = 80;
const qrX    = 15;
const qrY    = 60;
doc.addImage(qrBase64, "PNG", qrX, qrY, qrSize, qrSize);

// 6) Datos del invitado a la derecha del QR
let cursorY = qrY+20;
const textX = qrX + qrSize + 15;
const fields = [
  ["NOMBRE:", dataForPdf.name],
  ["TELÉFONO:", dataForPdf.phone],
  ["FECHA DE VISITA:", dataForPdf.visitDate ? new Date(dataForPdf.visitDate).toLocaleDateString("es-MX") : ""],
  ["HORA MÁX. ENTRADA:", dataForPdf.entryTime],
];
fields.forEach(([label, value]) => {
  doc
    .setFont("helvetica", "bold")
    .setFontSize(15)
    .setTextColor(14, 44, 82)
    .text(label, textX, cursorY);
  doc
    .setFont("helvetica", "bold")
    .setFontSize(18)
    .setTextColor(14, 44, 82)
    .text(value, textX, cursorY + 6);
  cursorY += 16;
});

// 7) Dirección y acompañantes en UNA COLUMNA
const leftX      = qrX;                    // mismo X que tu QR
let   bottomY    = qrY + qrSize + 10;      // justo debajo del QR
const labelSize  = 12;
const valueSize  = 15;
const indent     = 50;                     // sangría para el valor
const lineSpacing= 10;                     // separación entre líneas

// FILA 1: Dirección
doc
  .setFont("helvetica", "bold")
  .setFontSize(labelSize)
  .setTextColor(14, 44, 82)
  .text("DIRECCIÓN A VISITAR:", leftX, bottomY);
doc
  .setFont("helvetica", "normal")
  .setFontSize(valueSize)
  .text(formData.destination, leftX + indent, bottomY);

// Avanzamos Y para la siguiente línea
bottomY += lineSpacing;

// FILA 2: Acompañantes (si aplica)
if (formData.companions != null) {
  doc
    .setFont("helvetica", "bold")
    .setFontSize(labelSize)
    .text("ACOMPAÑANTES:", leftX, bottomY);
  doc
    .setFont("helvetica", "normal")
    .setFontSize(valueSize)
    .text(`${formData.companions}`, leftX + indent, bottomY);
}

// 8) Mapa estático y link
const mapBase64 = await getBase64Image("/images/mapa.png");
const mapX      = textX-10 ;
const mapY      = qrY + qrSize+20;
doc.addImage(mapBase64, "PNG", mapX, mapY, 95, 65);
doc
  .setFont("helvetica", "normal")
  .setFontSize(15)
  .setTextColor(0, 0, 200)
  .textWithLink(
    "Ver ubicación en Google Maps",
    mapX,
    mapY + 70,
    { url: "https://goo.gl/maps/XXXXXXXX" }
  );


  const KMBase64 = await getBase64Image("/images/KM.png");
const KMX      = 15;
const KMY      = qrY + qrSize+40;
doc.addImage(KMBase64, "PNG", KMX, KMY,50, 35);

    // 10) Pie de página
    doc
      .setFont("helvetica", "normal")
      .setFontSize(8)
      .setTextColor(150)
      .text("POWERED BY:", 130, 265);
    const logoPower = await getBase64Image("/images/arcos-logo.png");
    doc.addImage(logoPower, "PNG", 150, 258, 8, 10);
    doc
      .setFont("helvetica", "bold")
      .setFontSize(9)
      .setTextColor(14, 44, 82)
      .text(
        "ESTE CÓDIGO QR DEBE SER PRESENTADO EN LA ENTRADA DEL RESIDENCIAL",
        pageW / 2,
        275,
        { align: "center" }
      );

    // 11) Guardar el PDF
    doc.save(`Invitado-${formData.name.replace(/\s+/g, "-")}.pdf`);
  } catch (error) {
    console.error("Error al generar el PDF:", error);
    setError("Hubo un problema al generar el PDF. Por favor, inténtelo de nuevo.");
  } finally {
    setIsGeneratingPDF(false);
  }
};


  return (
    <main className="flex min-h-screen flex-col bg-[#0e2c52] pb-20">
      <header className="container mx-auto py-4 px-4 max-w-7xl">
        <Link href="/" className="flex items-center text-white hover:text-gray-200">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Volver al inicio
        </Link>
      </header>
      <section className="container mx-auto flex-1 flex flex-col items-center justify-start py-8 px-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl text-gray-800 mb-8 mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-center">Registro de Invitados</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <p className="text-sm text-blue-700">
                Los campos marcados con <span className="text-red-500">*</span> son obligatorios.
              </p>
            </div>

            {/* Información del invitado */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Información del Invitado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10 dígitos"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="visitDate" className="block text-sm font-medium">
                    Fecha de visita <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="visitDate"
                    value={formData.visitDate}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="entryTime" className="block text-sm font-medium">
                    Hora máxima de entrada <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="entryTime"
                    value={formData.entryTime}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="destination" className="block text-sm font-medium">
                    Dirección a visitar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                    placeholder="Casa/Lote a visitar"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="companions" className="block text-sm font-medium">
                    Número de acompañantes
                  </label>
                  <input
                    type="number"
                    id="companions"
                    value={formData.companions}
                    onChange={handleChange}
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Subida de fotografías deshabilitada en este apartado */}

              {/* Botón Generar QR y Registrar */}
              <div className="pt-4">
                <Button
                  type="button"
                  className="bg-[#d6b15e] text-[#0e2c52] hover:bg-[#c4a14e] py-6 text-lg w-full"
                  onClick={handleGenerateQR}
                  disabled={isSubmitting}
                >
                  <QrCode className="mr-2 h-5 w-5" />
                  {isSubmitting ? "Procesando..." : "Generar QR y Registrar"}
                </Button>
              </div>
            </div>
          </form>

          {/* Mostrar código QR generado y Exportar PDF */}
          {showQR && (
            <div className="mt-8 p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-center">Código QR Generado</h3>
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <img
                    src={qrPreviewBase64 || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">
                Este código QR contiene la información del invitado. Puede ser presentado en la entrada del residencial.
              </p>
              <div className="flex justify-center mt-4">
                <Button
                  type="button"
                  onClick={exportToPDF}
                  className="bg-[#0e2c52] text-white hover:bg-[#0a2240] flex items-center"
                  disabled={isGeneratingPDF}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isGeneratingPDF ? "Generando PDF..." : "Exportar a PDF"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
