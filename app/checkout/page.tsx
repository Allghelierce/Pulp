import type { Metadata } from "next"
import { CheckoutView } from "./CheckoutView"

export const metadata: Metadata = {
  title: "Upgrade to Plus",
  robots: { index: false, follow: false },
}

// /checkout?plan=plus_monthly|plus_yearly[&from=site] — Pulp-styled payment page.
export default function CheckoutPage() {
  return <CheckoutView />
}
