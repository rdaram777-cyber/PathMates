/**
 * Legal copy for the Privacy Policy and Terms & Conditions pages.
 *
 * Source: /home/team/shared/privacy-terms-draft.md (proposal, owner to review).
 * Text is kept near-verbatim from that draft so the owner can review the
 * rendered pages. Two flagged placeholders were resolved to defaults:
 *   - Operator name: "M/s. DARAM RAMYA" (the Razorpay merchant) — confirm with owner.
 *   - Dispute jurisdiction: "the courts of India" (generic; no unconfirmed city) — confirm with owner.
 *
 * Inline `**bold**` markers in the copy render as <strong> via
 * `renderLegalInline` in the pages.
 */

export interface LegalSection {
  heading: string;
  /** Paragraphs of body text. */
  paragraphs?: string[];
  /** Bullet list items (may contain `**bold**` markers). */
  bullets?: string[];
}

export interface LegalDoc {
  /** Badge pill text shown above the page heading. */
  badge: string;
  /** Page h1 (also used for the meta title). */
  heading: string;
  /** Short intro paragraph under the h1. */
  intro: string;
  /** "Last updated" line, shown in the hero. */
  lastUpdated: string;
  sections: LegalSection[];
}

export const PRIVACY_POLICY: LegalDoc = {
  badge: "Legal",
  heading: "Privacy Policy",
  intro:
    "This policy explains what PathMates collects, how we use it, and the choices you have.",
  lastUpdated: "Last updated: August 2026",
  sections: [
    {
      heading: "1. Who we are",
      paragraphs: [
        'PathMates ("we", "our", "us") operates https://pathmates.in, a marketplace where users ("Explorers") book paid 1:1 video calls with people ("PathMates") who share real experience stories. The platform is operated by M/s. DARAM RAMYA, India.',
      ],
    },
    {
      heading: "2. What we collect",
      bullets: [
        "**Account information**: name, email address, and password (stored securely, hashed) when you sign up. Profile details you choose to add (bio, photo via avatar_url, experience stories, availability).",
        "**Booking information**: the experiences you book, chosen time slots, call duration, and payment status.",
        "**Payment information**: we do NOT store card details. Payments are processed by Razorpay (card/UPI/netbanking). Razorpay shares with us only the payment status and a reference ID needed to confirm your booking.",
        "**Usage data**: basic analytics (page views, device type) once analytics is enabled, used to improve the site.",
        "**Communications**: any messages you send us at hello@pathmates.in.",
      ],
    },
    {
      heading: "3. How we use your data",
      bullets: [
        "To operate the marketplace: create and manage accounts, publish experience stories, process bookings, confirm payments, generate call links, and enable PathMates to meet Explorers.",
        "To send booking confirmations and service notifications (when email is enabled).",
        "To improve and secure the platform.",
        "To comply with legal obligations.",
      ],
    },
    {
      heading: "4. What we do NOT do",
      bullets: [
        "We do not sell your personal data.",
        "We do not share your payment card details (only Razorpay processes them).",
        "We do not display your private contact details publicly unless you choose to share them.",
      ],
    },
    {
      heading: "5. Data storage & security",
      bullets: [
        "Data is stored on Supabase (PostgreSQL) with row-level security so users can only access their own data and public listings.",
        "Passwords are hashed; secrets live in server-side environment variables.",
        "While we take reasonable precautions, no internet transmission is 100% secure.",
      ],
    },
    {
      heading: "6. Retention",
      paragraphs: [
        "We keep account and booking records as long as your account is active or as needed for legal, tax, and dispute-resolution purposes. You may request deletion of your account data by emailing hello@pathmates.in.",
      ],
    },
    {
      heading: "7. Your rights",
      paragraphs: [
        "Depending on applicable law (including India's Digital Personal Data Protection Act where it applies), you may have rights to access, correct, delete, or port your personal data, and to withdraw consent. Email hello@pathmates.in to exercise these.",
      ],
    },
    {
      heading: "8. Cookies & analytics",
      paragraphs: [
        "We use essential cookies for authentication and site functionality, and may use analytics (e.g. Google Analytics 4) to understand aggregate usage. Analytics are configured to not send raw personal identifiers.",
      ],
    },
    {
      heading: "9. Children",
      paragraphs: [
        "The service is for users aged 18 and above. We do not knowingly collect data from children.",
      ],
    },
    {
      heading: "10. Changes",
      paragraphs: [
        'We may update this policy; material changes will be posted on this page with a new "last updated" date.',
      ],
    },
    {
      heading: "11. Contact",
      paragraphs: ["Questions: hello@pathmates.in."],
    },
  ],
};

export const TERMS_AND_CONDITIONS: LegalDoc = {
  badge: "Legal",
  heading: "Terms & Conditions",
  intro:
    "The terms that govern your use of PathMates — bookings, payments, refunds, and more.",
  lastUpdated: "Last updated: August 2026",
  sections: [
    {
      heading: "1. The service",
      paragraphs: [
        "PathMates is a marketplace platform that connects Explorers with PathMates for paid 1:1 video calls. We provide the technology and payment infrastructure; the PathMates you book with are independent individuals sharing their personal experience.",
      ],
    },
    {
      heading: "2. Eligibility",
      paragraphs: [
        "You must be at least 18 years old to use the service. By creating an account you confirm you meet this requirement and that the information you provide is accurate.",
      ],
    },
    {
      heading: "3. Accounts",
      bullets: [
        "You are responsible for safeguarding your account credentials.",
        "One person, one account; don't create accounts for others or misrepresent yourself.",
        "We may suspend accounts that violate these terms.",
      ],
    },
    {
      heading: "4. Experience stories & PathMate conduct",
      bullets: [
        "Experience stories reflect the PathMate's personal journey. They are opinions/experiences, not professional advice (not financial, legal, medical, or career advice).",
        "PathMates agree to share only their genuine experiences and not to make false or misleading claims.",
        "**No outcome guarantees**: booking a call does not guarantee any particular result (income, admission, job, etc.). Both parties acknowledge that outcomes depend on many factors outside the platform's control.",
      ],
    },
    {
      heading: "5. Bookings & payments",
      bullets: [
        "Calls are booked in 30-minute increments at published prices in INR (₹) or USD ($), as selected at checkout.",
        "Payment is processed by Razorpay and is due at booking. Your booking is confirmed once payment succeeds.",
        "The platform fee structure between PathMates and PathMates-app is governed by the PathMate agreement.",
        "You must attend calls at the booked time; both parties agree to join via the provided call link.",
      ],
    },
    {
      heading: "6. Cancellations & refunds",
      bullets: [
        "**If your PathMate does not attend the call, you get a full refund.**",
        "If you cannot attend, contact hello@pathmates.in as early as possible; refunds for Explorer-side cancellations are at our discretion (e.g., genuine emergencies, technical failures).",
        "Refunds are issued to the original payment method within 5–10 business days after approval.",
        "Payment failures are not charged; the booking is cancelled automatically.",
      ],
    },
    {
      heading: "7. Acceptable use",
      paragraphs: ["You agree NOT to:"],
      bullets: [
        "Use the service for unlawful purposes, harassment, fraud, or impersonation.",
        "Record or redistribute calls without the other party's consent.",
        "Scrape, reverse-engineer, or disrupt the platform.",
        "Attempt to pay with stolen or unauthorized payment methods.",
      ],
    },
    {
      heading: "8. Intellectual property",
      paragraphs: [
        "The PathMates name, logo, and platform content belong to us. Experience stories remain owned by the PathMates who wrote them; you may not republish them without permission.",
      ],
    },
    {
      heading: "9. Limitation of liability",
      paragraphs: [
        "To the maximum extent permitted by law, PathMates is not liable for indirect or consequential damages arising from calls, including any outcome (or lack thereof) of a call. Our total liability is limited to the amount you paid for the booking in question.",
      ],
    },
    {
      heading: "10. Dispute resolution",
      paragraphs: [
        "These terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the courts of India. We'll always try to resolve disputes amicably first — email hello@pathmates.in.",
      ],
    },
    {
      heading: "11. Changes",
      paragraphs: [
        "We may update these terms; continued use after changes means acceptance. Material changes will be posted here.",
      ],
    },
    {
      heading: "12. Contact",
      paragraphs: ["hello@pathmates.in."],
    },
  ],
};
