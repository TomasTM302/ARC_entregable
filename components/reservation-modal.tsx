"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
const StripeCardPayment = dynamic(() => import("./stripe-card-payment"), { ssr: false })
import { Users } from "lucide-react"
import { useAuthStore } from "@/lib/auth"
import { format, addDays } from "date-fns"
import { es } from "date-fns/locale"

interface ReservationModalProps {
  isOpen: boolean
  onClose: () => void
  areaId: string
  areaName: string
  maxPeople: number
  price?: number
  operatingHours: string
  maxDuration: number
}

export default function ReservationModal({
  isOpen,
  onClose,
  areaId,
  areaName,
  maxPeople,
  price,
  operatingHours,
  maxDuration,
}: ReservationModalProps) {
  const { user } = useAuthStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [date, setDate] = useState<Date>(new Date());
  const [people, setPeople] = useState<number>(4);
  const [startTime, setStartTime] = useState<string>("10:00");
  const [endTime, setEndTime] = useState<string>("14:00");
  const [paymentMethod, setPaymentMethod] = useState<"Tarjeta" | "Transferencia">("Tarjeta");
  const [bancoData, setBancoData] = useState<{ nombre_banco: string; nombre_titular: string; clave_inter: string } | null>(null);
  const [bancoError, setBancoError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [codigoReferencia, setCodigoReferencia] = useState<string>("");

  useEffect(() => {
    if (step === 2 && paymentMethod === "Transferencia" && user?.condominiumId) {
      fetch(`/api/condominios/${user.condominiumId}/banco`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setBancoData(data.banco);
            setBancoError(null);
          } else {
            setBancoData(null);
            setBancoError(data.message || "No se pudo obtener datos bancarios");
          }
        })
        .catch(() => {
          setBancoData(null);
          setBancoError("Error de red al obtener datos bancarios");
        });
    } else {
      setBancoData(null);
      setBancoError(null);
    }
  }, [step, paymentMethod, user?.condominiumId]);

  const maxDate = addDays(new Date(), 7);
  // Utilidad para parsear HH:mm o HH:mm:ss a minutos del día
  const parseToMinutes = (t: string): number | null => {
    const m = (t || "").trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return null;
    const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
    const mi = Math.min(59, Math.max(0, parseInt(m[2], 10)));
    return h * 60 + mi;
  };
  const minutesToStr = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };
  const getTimeRange = () => {
    if (!operatingHours || !operatingHours.includes(" - ")) return { start: 8 * 60, end: 20 * 60 };
    const [rawStart, rawEnd] = operatingHours.split(" - ").map(s => s.trim());
    const s = parseToMinutes(rawStart);
    const e = parseToMinutes(rawEnd);
    // Si no son válidos o el fin no es posterior al inicio, usar rango por defecto
    if (s == null || e == null || e <= s) return { start: 8 * 60, end: 20 * 60 };
    return { start: s, end: e };
  };
  const { start: rangeStart, end: rangeEnd } = getTimeRange();
  const timeOptions = (() => {
    const options: string[] = [];
    for (let mins = rangeStart; mins <= rangeEnd; mins += 30) {
      options.push(minutesToStr(mins));
    }
    return options;
  })();

  // Asegurar que la hora de fin sea posterior a la de inicio
  useEffect(() => {
    if (!timeOptions.length) return;
    const startIdx = timeOptions.indexOf(startTime);
    const endIdx = timeOptions.indexOf(endTime);
    // Si no existen en las opciones o no hay suficientes opciones, reajustar
    if (startIdx === -1) setStartTime(timeOptions[0]);
    if (endIdx === -1 || endIdx <= startIdx) {
      const next = timeOptions[Math.min(timeOptions.length - 1, Math.max(1, (startIdx === -1 ? 0 : startIdx) + 1))];
      setEndTime(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operatingHours]);

  function renderCalendar() {
    return (
      <input
        type="date"
        min={format(new Date(), "yyyy-MM-dd")}
        max={format(maxDate, "yyyy-MM-dd")}
        value={format(date, "yyyy-MM-dd")}
        onChange={e => setDate(new Date(e.target.value))}
        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] bg-white text-black"
      />
    );
  }

  async function generarCodigoReferencia() {
    const nombre = (user?.firstName || "").toUpperCase();
    const apellido = (user?.lastName || "").toUpperCase();
    const iniciales = (nombre.charAt(0) + apellido.charAt(0)).replace(/[^A-Z]/g, "");
    const fechaStr = format(date, "yyyyMMdd");
    const horaStr = startTime.replace(":", "");
    let base = `${iniciales}${fechaStr}${horaStr}`;
    if (user?.id) base += user.id;
    try {
      const res = await fetch("/api/referencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base }),
      });
      const data = await res.json();
      if (data.success && data.referencia) return data.referencia;
      return base;
    } catch {
      return base;
    }
  }

  const handleContinue = async () => {
    if (step === 1) {
      setLoading(true);
      const cod = await generarCodigoReferencia();
      setCodigoReferencia(cod);
      setLoading(false);
      setStep(2);
    } else {
      if (paymentMethod === "Tarjeta") {
        setStep(3);
      } else {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
          const res = await fetch("/api/reservaciones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              usuario_id: user?.id,
              area_comun_id: areaId,
              fecha_reservacion: format(date, "yyyy-MM-dd"),
              hora_inicio: startTime,
              hora_fin: endTime,
              num_invitados: people,
              proposito: "Reserva de área común",
              tipo_pago: paymentMethod,
              referencia_id: codigoReferencia,
            }),
          });
          const data = await res.json();
          await fetch("/api/pagos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              usuario_id: user?.id,
              referencia_id: codigoReferencia,
              tipo: "reserva",
              monto: Number(price ?? 0),
              metodo_pago: "transferencia",
              estado: "pendiente",
              notas: `Pago por transferencia. Esperando comprobante.`,
            }),
          });
          if (data.success) {
            setSuccess("Reserva enviada con éxito. Código de referencia: " + codigoReferencia);
            setTimeout(() => {
              onClose();
              setStep(1);
              setSuccess(null);
              setCodigoReferencia("");
            }, 2500);
          } else {
            setError(data.message || "Error al reservar");
          }
        } catch (err) {
          setError("Error de red o servidor");
        }
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    onClose();
    setStep(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-black">Reservar {areaName}</DialogTitle>
          <DialogDescription className="block text-sm text-gray-600 mt-1">
            Completa los datos para reservar el área común. Elige fecha, horario, método de pago y confirma tu reservación. Si pagas por transferencia, usa el código de referencia como concepto.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium mb-2 text-black">Selecciona la fecha y horario para tu reservación</h3>
              <div>
                <h4 className="text-base font-medium mb-2 text-black">Fecha</h4>
                {renderCalendar()}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-base font-medium mb-2 text-black">Hora de inicio</h4>
                  <select value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] bg-white text-black">
                    {timeOptions.slice(0, -1).map((time) => (
                      <option key={time} value={time} className="text-black bg-white">{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <h4 className="text-base font-medium mb-2 text-black">Hora de fin</h4>
                  <select value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] bg-white text-black">
                    {timeOptions.slice(1).map((time) => (
                      <option key={time} value={time} className="text-black bg-white">{time}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <h3 className="text-blue-800 font-medium">Restricciones de horario:</h3>
                <ul className="list-disc pl-5 text-blue-700">
                  <li>Horario de operación: {operatingHours}</li>
                  {maxDuration > 0 && (
                    <li>Duración máxima: {maxDuration} horas</li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="text-base font-medium mb-2 text-black">Número de personas</h4>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="number" min="1" max={maxPeople} value={people} onChange={(e) => setPeople(Number(e.target.value))} className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] bg-white text-black" />
                </div>
                <p className="text-sm text-gray-700 mt-1">Máximo {maxPeople} personas para este {areaName.toLowerCase()}.</p>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-2 text-black">Costo de la reservación:</h4>
                <p className="text-2xl font-bold text-[#0066cc]">${Number(price ?? 0).toLocaleString()}</p>
                <p className="text-sm text-gray-700 mt-1">Este es el costo por reservar el área.</p>
              </div>
              <div>
                <h4 className="text-base font-medium mb-2 text-black">Método de pago</h4>
                <div className="flex space-x-4">
                  <label className="flex items-center text-black">
                    <input type="radio" name="payment" checked={paymentMethod === "Tarjeta"} onChange={() => setPaymentMethod("Tarjeta")} className="mr-2" />
                    Tarjeta
                  </label>
                  <label className="flex items-center text-black">
                    <input type="radio" name="payment" checked={paymentMethod === "Transferencia"} onChange={() => setPaymentMethod("Transferencia")} className="mr-2" />
                    Transferencia
                  </label>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <h4 className="text-blue-800 font-medium mb-1">Reservado por:</h4>
                <div>
                  <p className="text-blue-800">
                    {user?.firstName} {user?.lastName}
                    {user?.house ? ` (${user.house})` : ""}
                  </p>
                  <h4 className="text-blue-800 font-medium mt-2 mb-1">Contacto:</h4>
                  <p className="text-blue-800">
                    {user?.email}
                    {user?.phone ? ` | ${user.phone}` : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium mb-2 text-black">Confirma tu reservación</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h4 className="font-medium mb-2 text-black">Detalles de la reservación:</h4>
                <ul className="space-y-2 text-black">
                  <li><span className="font-medium">Área:</span> {areaName}</li>
                  <li><span className="font-medium">Fecha:</span> {format(date, "d 'de' MMMM 'de' yyyy", { locale: es })}</li>
                  <li><span className="font-medium">Horario:</span> {startTime} - {endTime}</li>
                  <li><span className="font-medium">Número de personas:</span> {people}</li>
                  <li><span className="font-medium">Costo de la reservación:</span> {Number(price ?? 0).toLocaleString()}</li>
                  <li><span className="font-medium">Método de pago:</span> {paymentMethod === "Tarjeta" ? "Tarjeta" : "Transferencia"}</li>
                </ul>
              </div>
              {paymentMethod === "Transferencia" && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
                  <h4 className="font-medium mb-2 text-blue-800">Datos de transferencia</h4>
                  <ul className="space-y-2 text-blue-800">
                    <li><span className="font-medium">Código de referencia:</span> <span className="font-mono">{codigoReferencia}</span></li>
                    <li><span className="font-medium">Monto a transferir:</span> {Number(price ?? 0).toLocaleString()}</li>
                    <li><span className="font-medium">Concepto:</span>  {codigoReferencia}</li>
                    {bancoData && (<>
                      <li><span className="font-medium">Banco:</span> {bancoData.nombre_banco}</li>
                      <li><span className="font-medium">Titular:</span> {bancoData.nombre_titular}</li>
                      <li><span className="font-medium">CLABE interbancaria:</span> <span className="font-mono">{bancoData.clave_inter}</span></li>
                    </>)}
                  </ul>
                  {bancoError && <p className="text-xs text-red-700 mt-2">{bancoError}</p>}
                  <p className="text-xs text-blue-700 mt-2">Recuerda que al realizar la trasferencia debes usar el codigo de referencia como concepto Guarda este código y úsalo como referencia en tu comprobante de pago.</p>
                </div>
              )}
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h4 className="text-yellow-800 font-medium mb-2">Importante:</h4>
                <p className="text-yellow-800 text-sm">Al confirmar esta reservación, aceptas las políticas de uso de áreas comunes y te comprometes a seguir las reglas establecidas por la administración.</p>
              </div>
            </div>
          )}
          {step === 3 && paymentMethod === "Tarjeta" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium mb-2 text-black">Pago con tarjeta</h3>
              <StripeCardPayment
                amount={Number(price ?? 0)}
                referencia={codigoReferencia}
                onSuccess={async (paymentIntent) => {
                  setLoading(true);
                  setError(null);
                  setSuccess(null);
                  try {
                    // 1. Registrar la reservación
                    const res = await fetch("/api/reservaciones", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        usuario_id: user?.id,
                        area_comun_id: areaId,
                        fecha_reservacion: format(date, "yyyy-MM-dd"),
                        hora_inicio: startTime,
                        hora_fin: endTime,
                        num_invitados: people,
                        proposito: "Reserva de área común",
                        tipo_pago: paymentMethod,
                        referencia_id: codigoReferencia,
                        stripe_payment_id: paymentIntent.id,
                      }),
                    });
                    const data = await res.json();
                    // 2. Registrar el pago en la tabla de pagos
                    let pagoTipo = "rechazado";
                    if (paymentIntent.status === "succeeded") {
                      pagoTipo = "aceptado";
                    }
                    const pagoPayload = {
                      usuario_id: user?.id,
                      referencia_id: codigoReferencia,
                      tipo: pagoTipo === "aceptado" ? "reserva" : "rechazado",
                      monto: Number(price ?? 0),
                      metodo_pago: "tarjeta",
                      estado: pagoTipo === "aceptado" ? "completado" : "rechazado",
                      notas: `Stripe: ${paymentIntent.status}. ID: ${paymentIntent.id}`,
                    };
                    console.log("Enviando a /api/pagos:", pagoPayload);
                    const pagoRes = await fetch("/api/pagos", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(pagoPayload),
                    });
                    if (pagoTipo === "aceptado" && pagoRes.ok) {
                      setSuccess("Pago exitoso. Reserva enviada con éxito. Código de referencia: " + codigoReferencia);
                    } else {
                      setError("Pago rechazado por Stripe. Intenta con otra tarjeta.");
                    }
                    setTimeout(() => {
                      onClose();
                      setStep(1);
                      setSuccess(null);
                      setCodigoReferencia("");
                    }, 2500);
                  } catch (err) {
                    setError("Error de red o servidor");
                  }
                  setLoading(false);
                }}
                onError={(err) => setError(err?.message || "Error al procesar pago")}
              />
            </div>
          )}
        </div>
        <DialogFooter className="flex justify-between mt-4">
          <Button variant="destructive" onClick={handleCancel} className="text-white" disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleContinue} className="bg-[#0066cc] hover:bg-[#0052a3] text-white" disabled={loading}>
            {loading ? "Procesando..." : step === 1 ? "Continuar" : "Reservar"}
          </Button>
        </DialogFooter>
        {error && <div className="text-red-600 text-center mt-2">{error}</div>}
        {success && <div className="text-green-600 text-center mt-2">{success}</div>}
      </DialogContent>
    </Dialog>
  );
}
