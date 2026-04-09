export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: 'patient' | 'provider' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role: 'patient' | 'provider' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'patient' | 'provider' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      providers: {
        Row: {
          id: string;
          user_id: string;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          booking_status: string
          consumer_id: string | null
          created_at: string | null
          date_time: string
          id: string
          location_drop: string | null
          location_pickup: string | null
          price_estimate: number | null
          provider_id: string | null
          service_details: Json | null
          service_type: string
        }
        Insert: {
          booking_status: string
          consumer_id?: string | null
          created_at?: string | null
          date_time: string
          id?: string
          location_drop?: string | null
          location_pickup?: string | null
          price_estimate?: number | null
          provider_id?: string | null
          service_details?: Json | null
          service_type: string
        }
        Update: {
          booking_status?: string
          consumer_id?: string | null
          created_at?: string | null
          date_time?: string
          id?: string
          location_drop?: string | null
          location_pickup?: string | null
          price_estimate?: number | null
          provider_id?: string | null
          service_details?: Json | null
          service_type?: string
        }
      }
      consumer_details: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          profile_picture: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          profile_picture?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          profile_picture?: string | null
        }
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          seen: boolean | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          seen?: boolean | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          seen?: boolean | null
          type?: string | null
          user_id?: string | null
        }
      }
      provider_details: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          service_type: string | null;
          experience_years: number | null;
          skills: string | null;
          profile_picture: string | null;
          govt_id_url: string | null;
          license_url: string | null;
          status: 'pending' | 'approved' | 'rejected';
          is_online: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          service_type?: string | null;
          experience_years?: number | null;
          skills?: string | null;
          profile_picture?: string | null;
          govt_id_url?: string | null;
          license_url?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          is_online?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          service_type?: string | null;
          experience_years?: number | null;
          skills?: string | null;
          profile_picture?: string | null;
          govt_id_url?: string | null;
          license_url?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          is_online?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
