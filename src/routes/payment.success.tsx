import { createFileRoute } from "@tanstack/react-router";
import { buildSeo } from "@/lib/seo";
import { PaymentResult } from "@/components/payment/PaymentResult";

export const Route = createFileRoute("/payment/success")({
  head: () =>
    buildSeo({
      title: "Status Pembayaran — CV Pintar",
      description: "Status pembayaran CV Pintar.",
      path: "/payment/success",
      noindex: true,
    }),
  validateSearch: (s: Record<string, unknown>) => ({
    order_id: typeof s.order_id === "string" ? s.order_id : undefined,
  }),
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  const { order_id } = Route.useSearch();
  return <PaymentResult orderId={order_id} variant="success" />;
}
