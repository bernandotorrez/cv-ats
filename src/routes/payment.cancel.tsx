import { createFileRoute } from "@tanstack/react-router";
import { buildSeo } from "@/lib/seo";
import { PaymentResult } from "@/components/payment/PaymentResult";

export const Route = createFileRoute("/payment/cancel")({
  head: () =>
    buildSeo({
      title: "Pembayaran Dibatalkan — CV Pintar",
      description: "Status pembayaran CV Pintar.",
      path: "/payment/cancel",
      noindex: true,
    }),
  validateSearch: (s: Record<string, unknown>) => ({
    order_id: typeof s.order_id === "string" ? s.order_id : undefined,
  }),
  component: PaymentCancelPage,
});

function PaymentCancelPage() {
  const { order_id } = Route.useSearch();
  return <PaymentResult orderId={order_id} variant="cancel" />;
}
