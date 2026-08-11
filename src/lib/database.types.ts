export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * PathMates public schema — mirrors the real Supabase project
 * (supabase/migrations/all-migrations.sql, migrations 001-009).
 *
 * NOTE ON RELATIONSHIPS: user_id-style foreign keys reference auth.users in
 * the database, but the application joins them to public.profiles
 * (e.g. `profiles(...)`, `explorer:profiles!bookings_explorer_id_fkey(...)`).
 * The Relationships arrays below declare those joins as the code uses them so
 * the type-level select parser resolves embedded resources.
 */
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "experiences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne?: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "experiences_category_id_fkey";
            columns: ["category_id"];
            isOneToOne?: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
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
          meeting_url: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          currency: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          payment_gateway: string;
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
          meeting_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          currency?: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          payment_gateway?: string;
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
          meeting_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          currency?: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          payment_gateway?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_explorer_id_fkey";
            columns: ["explorer_id"];
            isOneToOne?: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_pathmate_id_fkey";
            columns: ["pathmate_id"];
            isOneToOne?: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_experience_id_fkey";
            columns: ["experience_id"];
            isOneToOne?: false;
            referencedRelation: "experiences";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: true;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey";
            columns: ["reviewer_id"];
            isOneToOne?: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_pathmate_id_fkey";
            columns: ["pathmate_id"];
            isOneToOne?: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string | null;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message?: string | null;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string | null;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
