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
}

export default function TareasMantenimientoTable() {
  const [tareas, setTareas] = useState<TaskMantenimiento[]>([])
  const [loading, setLoading] = useState(true)

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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
