import jsPDF from "jspdf"

export function downloadTasksPDF(tasks: Array<{ title?: string; description?: string; status?: string }>) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text("Tareas de la última semana", 10, 15)
  doc.setFontSize(10)

  let y = 25
  tasks.forEach((t, i) => {
    doc.text(`${i + 1}. Título: ${t.title || ""}`, 10, y)
    y += 6
    doc.text(`   Descripción: ${t.description || ""}`, 10, y)
    y += 6
    doc.text(`   Estado: ${t.status || ""}`, 10, y)
    y += 8
    if (y > 270) { doc.addPage(); y = 20 }
  })

  doc.save("tareas-semana.pdf")
}
