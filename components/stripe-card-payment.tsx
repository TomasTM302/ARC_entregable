import { useState } from "react";
import {loadStripe} from "@stripe/stripe-js";
import {Elements, CardElement, useStripe, useElements} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CardPaymentFormProps {
  amount: number;
  referencia: string;
  onSuccess?: (paymentIntent: { id: string; status: string }) => void;
  onError?: (error: { message?: string }) => void;
}

function CardPaymentForm({ amount, onSuccess, onError, referencia }: CardPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Crear PaymentIntent en backend
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, metadata: { referencia } }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const clientSecret = data.clientSecret;
      // Confirmar pago con Stripe
      const result = await stripe!.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements!.getElement(CardElement)!,
        },
      });
      if (result.error) {
        setError(result.error.message || "Error al procesar pago");
        onError?.(result.error);
      } else if (result.paymentIntent?.status === "succeeded") {
        onSuccess?.(result.paymentIntent);
      }
    } catch (err) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || "Error inesperado");
      onError?.(errorObj);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement options={{ hidePostalCode: true }} className="p-2 border rounded" />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button type="submit" disabled={!stripe || loading} className="bg-blue-600 text-white px-4 py-2 rounded">
        {loading ? "Procesando..." : "Pagar"}
      </button>
    </form>
  );
}

interface StripeCardPaymentProps {
  amount: number;
  referencia: string;
  onSuccess?: (paymentIntent: { id: string; status: string }) => void;
  onError?: (error: { message?: string }) => void;
}

export default function StripeCardPayment({ amount, referencia, onSuccess, onError }: StripeCardPaymentProps) {
  return (
    <Elements stripe={stripePromise}>
      <CardPaymentForm amount={amount} referencia={referencia} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
