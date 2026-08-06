export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          country: string | null;
          years_of_experience: number | null;
          current_role: string | null;
          headline: string | null;
          bio: string | null;
          bio_short: string | null;
          avatar_url: string | null;
          languages: string[] | null;
          skills: string[] | null;
          role: "explorer" | "pathmate" | "admin";
          hourly_rate: number;
          avg_rating: number;
          review_count: number;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          country?: string | null;
          years_of_experience?: number | null;
          current_role?: string | null;
          headline?: string | null;
          bio?: string | null;
          bio_short?: string | null;
          avatar_url?: string | null;
          languages?: string[] | null;
          skills?: string[] | null;
          role?: "explorer" | "pathmate" | "admin";
          hourly_rate?: number;
          avg_rating?: number;
          review_count?: number;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          country?: string | null;
          years_of_experience?: number | null;
          current_role?: string | null;
          headline?: string | null;
          bio?: string | null;
          bio_short?: string | null;
          avatar_url?: string | null;
          languages?: string[] | null;
          skills?: string[] | null;
          role?: "explorer" | "pathmate" | "admin";
          hourly_rate?: number;
          avg_rating?: number;
          review_count?: number;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
      };
      experiences: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          category_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          category_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          category_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          explorer_id: string;
          pathmate_id: string;
          experience_id: string | null;
          scheduled_at: string;
          duration_minutes: number;
          amount_cents: number;
          platform_fee_cents: number;
          pathmate_earnings_cents: number;
          stripe_session_id: string | null;
          stripe_payment_status: string;
          /** ISO 4217 code the booking was paid in: "INR" → Razorpay, "USD" → Stripe. */
          currency: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          /** Which gateway processed this booking: "stripe" | "razorpay". */
          payment_gateway: string;
          meeting_url: string | null;
          status: "pending" | "paid" | "completed" | "cancelled" | "refunded";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          explorer_id: string;
          pathmate_id: string;
          experience_id?: string | null;
          scheduled_at: string;
          duration_minutes?: number;
          amount_cents: number;
          platform_fee_cents: number;
          pathmate_earnings_cents: number;
          stripe_session_id?: string | null;
          stripe_payment_status?: string;
          currency?: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          payment_gateway?: string;
          meeting_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          explorer_id?: string;
          pathmate_id?: string;
          experience_id?: string | null;
          scheduled_at?: string;
          duration_minutes?: number;
          amount_cents?: number;
          platform_fee_cents?: number;
          pathmate_earnings_cents?: number;
          stripe_session_id?: string | null;
          stripe_payment_status?: string;
          currency?: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          payment_gateway?: string;
          meeting_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      availability_slots: {
        Row: {
          id: string;
          user_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          reviewer_id: string;
          pathmate_id: string;
          rating: number;
          content: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          reviewer_id: string;
          pathmate_id: string;
          rating: number;
          content?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          reviewer_id?: string;
          pathmate_id?: string;
          rating?: number;
          content?: string | null;
          created_at?: string;
        };
      };
      platform_settings: {
        Row: {
          key: string;
          value: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
