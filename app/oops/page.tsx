import { OrangeError } from "../components/OrangeError"

export const metadata = { title: "oops — pulp" }

// Redirect target for handler errors (e.g. a failed checkout button press).
export default function OopsPage() {
  return <OrangeError />
}
