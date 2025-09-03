// Endpoint antiguo deprecado: usar /api/personal_mantenimiento/tareas
function gone() {
  return Response.json({ success: false, moved: true, path: '/api/personal_mantenimiento/tareas' }, { status: 410 })
}
export async function GET() { return gone() }
export async function POST() { return gone() }
export async function PUT() { return gone() }
export async function DELETE() { return gone() }
