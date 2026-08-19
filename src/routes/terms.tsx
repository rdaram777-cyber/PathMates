import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "~/components/LegalPage";
import { TERMS_AND_CONDITIONS } from "~/lib/legal";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — PathMates" },
      {
        name: "description",
        content:
          "The terms for using PathMates: bookings and payments, refunds, acceptable use, and dispute resolution.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return <LegalPage doc={TERMS_AND_CONDITIONS} />;
}
