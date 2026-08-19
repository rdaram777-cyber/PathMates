import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "~/components/LegalPage";
import { PRIVACY_POLICY } from "~/lib/legal";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — PathMates" },
      {
        name: "description",
        content:
          "How PathMates collects, uses, and protects your data — account information, bookings, payments via Razorpay, and your privacy rights.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return <LegalPage doc={PRIVACY_POLICY} />;
}
