import jsPDF from "jspdf"

type TaskLike = {
  title?: string
  description?: string
  status?: string
  evidenceUrl?: string | string[] | null
}

function parseEvidenceUrls(evidence?: string | string[] | null): string[] {
  if (!evidence) return []
  if (Array.isArray(evidence)) return evidence.filter(Boolean)
  if (typeof evidence === 'string' && evidence.includes(',')) return evidence.split(',').map(s => s.trim()).filter(Boolean)
  return typeof evidence === 'string' ? [evidence] : []
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function tryBuildDriveThumbnail(url: string): string | null {
  try {
    const mUc = url.match(/[?&]id=([\w-]+)/)
    if (mUc?.[1]) return `https://drive.google.com/thumbnail?id=${mUc[1]}`
    const mFile = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/)
    if (mFile?.[1]) return `https://drive.google.com/thumbnail?id=${mFile[1]}`
    return null
  } catch { return null }
}

async function tryFetchImageAsDataUrl(url: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    const target = tryBuildDriveThumbnail(url) || url
    const res = await fetch(target, { signal: controller.signal as any })
    clearTimeout(id)
    if (!res.ok) return null
    const blob = await res.blob()
    // Intentar descartar HTML (algunos enlaces de Drive podrían devolver HTML si no son directos)
    if (blob.type && blob.type.includes('text/html')) return null
    const dataUrl = await blobToDataUrl(blob)
    return dataUrl
  } catch {
    return null
  }
}

export async function downloadTasksPDF(tasks: Array<TaskLike>) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 10
  const maxY = pageHeight - 20
  doc.setFontSize(16)
  doc.text("Tareas de la última semana", marginX, 15)
  doc.setFontSize(10)

  let y = 25
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i]
    doc.text(`${i + 1}. Título: ${t.title || ""}`, marginX, y)
    y += 6
    doc.text(`   Descripción: ${t.description || ""}`, marginX, y)
    y += 6
    doc.text(`   Estado: ${t.status || ""}`, marginX, y)
    y += 6

  // Incluir todas las imágenes por tarea
  const urls = parseEvidenceUrls(t.evidenceUrl)
    for (const u of urls) {
      // ancho disponible
      const imgMaxW = pageWidth - marginX * 2
      const targetW = imgMaxW
      const targetH = 60 // alto fijo aprox para no crecer demasiado
      const dataUrl = await tryFetchImageAsDataUrl(u)
      if (dataUrl) {
        try {
          if (y + targetH > maxY) { doc.addPage(); y = 20 }
          doc.addImage(dataUrl, 'JPEG', marginX, y, targetW, targetH, undefined, 'FAST')
          y += targetH + 6
        } catch {
          // Si falla addImage, escribimos la URL
          doc.text(`   Evidencia: ${u}`, marginX, y)
          y += 6
        }
      } else {
        // Fallback: escribir URL si no pudimos cargar imagen (CORS/HTML)
        doc.text(`   Evidencia: ${u}`, marginX, y)
        y += 6
      }
    }

    y += 4
    if (y > maxY) { doc.addPage(); y = 20 }
  }

  doc.save("tareas-semana.pdf")
}
