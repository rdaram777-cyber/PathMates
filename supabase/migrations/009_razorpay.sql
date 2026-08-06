-- ============================================================
-- Phase 4: Razorpay Integration & Currency Column
-- ============================================================
-- Route payments by currency: INR → Razorpay, USD → Stripe.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'stripe';
