import { useEffect, useState } from "react"

interface TaskMantenimiento {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  condominiumId: string | number;
  sectionId: string | number;
  dueDate?: string;
  evidenceUrl?: string | string[] | null;
}

export default function TareasMantenimientoTable() {
  const [tareas, setTareas] = useState<TaskMantenimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [previewUrls, setPreviewUrls] = useState<string[] | null>(null)

  useEffect(() => {
    fetch("/api/personal_mantenimiento/tareas")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.tareas)) {
          setTareas(data.tareas)
        } else {
          setTareas([])
        }
        setLoading(false)
      })
      .catch(() => {
        setTareas([])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="py-8 text-center">Cargando actividades...</div>
  if (!tareas.length) return <div className="py-8 text-center">No hay actividades registradas.</div>

  return (
    <div className="overflow-x-auto mt-8">
      <h3 className="text-lg font-semibold mb-2">Actividades de Mantenimiento</h3>
      <table className="min-w-full bg-white border">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-3 text-left">Título</th>
            <th className="py-2 px-3 text-left">Descripción</th>
            <th className="py-2 px-3 text-left">Prioridad</th>
            <th className="py-2 px-3 text-left">Estado</th>
            <th className="py-2 px-3 text-left">Condominio</th>
            <th className="py-2 px-3 text-left">Sección</th>
            <th className="py-2 px-3 text-left">Fecha Vencimiento</th>
            <th className="py-2 px-3 text-left">Evidencias</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {tareas.map((t) => (
            <tr key={t.id}>
              <td className="py-2 px-3">{t.title}</td>
              <td className="py-2 px-3">{t.description}</td>
              <td className="py-2 px-3">{t.priority}</td>
              <td className="py-2 px-3">{t.status}</td>
              <td className="py-2 px-3">{t.condominiumId}</td>
              <td className="py-2 px-3">{t.sectionId}</td>
              <td className="py-2 px-3">{t.dueDate ? t.dueDate.split('T')[0] : '-'}</td>
              <td className="py-2 px-3">
                {(() => {
                  const urls = Array.isArray(t.evidenceUrl)
                    ? t.evidenceUrl
                    : typeof t.evidenceUrl === 'string' && t.evidenceUrl.includes(',')
                      ? t.evidenceUrl.split(',').map(s => s.trim())
                      : t.evidenceUrl ? [t.evidenceUrl] : []
                  return urls.length ? (
                    <button
                      className="text-blue-600 underline"
                      onClick={() => setPreviewUrls(urls)}
                    >
                      Ver ({urls.length})
                    </button>
                  ) : <span className="text-gray-400">-</span>
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal simple para previsualizar evidencias */}
      {previewUrls && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPreviewUrls(null)}>
          <div className="bg-white rounded p-4 max-w-3xl w-[95vw] max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold">Evidencias</h4>
              <button onClick={() => setPreviewUrls(null)} className="px-2 py-1 border rounded">Cerrar</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {previewUrls.map((u, idx) => {
                const isDrive = /drive\.google\.com/.test(u)
                const toDrivePreview = (url: string): string | null => {
                  try {
                    const m1 = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/)
                    if (m1?.[1]) return `https://drive.google.com/file/d/${m1[1]}/preview`
                    const m2 = url.match(/[?&]id=([\w-]+)/)
                    if (m2?.[1]) return `https://drive.google.com/file/d/${m2[1]}/preview`
                    return null
                  } catch { return null }
                }
                const iframeUrl = isDrive ? (toDrivePreview(u) || u) : ''
                return (
                  <div key={idx} className="w-full aspect-[4/3] bg-black/5 rounded overflow-hidden flex items-center justify-center">
                    {isDrive ? (
                      <iframe src={iframeUrl} className="w-full h-full border-0" />
                    ) : (
                      <img src={u} alt={`Evidencia ${idx+1}`} className="w-full h-full object-cover" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
