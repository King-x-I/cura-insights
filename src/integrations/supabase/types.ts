export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_status: string
          consumer_id: string | null
          created_at: string | null
          date_time: string
          id: string
          location_drop: string | null
          location_pickup: string | null
          payment_method: string | null
          payment_status: string | null
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
          payment_method?: string | null
          payment_status?: string | null
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
          payment_method?: string | null
          payment_status?: string | null
          price_estimate?: number | null
          provider_id?: string | null
          service_details?: Json | null
          service_type?: string
        }
        Relationships: []
      }
      consumer_details: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          phone: string | null
          profile_picture: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          phone?: string | null
          profile_picture?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          phone?: string | null
          profile_picture?: string | null
          user_id?: string
        }
        Relationships: []
      }
      driver_booking_requests: {
        Row: {
          created_at: string | null
          date: string | null
          duration: string | null
          id: string
          location: string | null
          service_type: string | null
          status: string | null
          time: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          duration?: string | null
          id?: string
          location?: string | null
          service_type?: string | null
          status?: string | null
          time?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          duration?: string | null
          id?: string
          location?: string | null
          service_type?: string | null
          status?: string | null
          time?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      location_tracking: {
        Row: {
          accuracy: number | null
          booking_id: string
          id: string
          latitude: number
          longitude: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          booking_id: string
          id?: string
          latitude: number
          longitude: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          booking_id?: string
          id?: string
          latitude?: number
          longitude?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_tracking_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
      }
      payments: {
        Row: {
          amount: number | null
          booking_id: string | null
          created_at: string | null
          id: string
          payment_method: string | null
          payment_status: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          booking_id?: string | null
          created_at?: string | null
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          booking_id?: string | null
          created_at?: string | null
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_details: {
        Row: {
          address: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          created_at: string | null
          driving_license_number: string | null
          email: string
          experience_years: number | null
          full_name: string
          govt_id_url: string | null
          id: string
          id_number: string
          id_type: string
          ifsc_code: string | null
          is_approved: boolean | null
          is_online: boolean | null
          languages: string | null
          license_expiry_date: string | null
          license_url: string | null
          phone: string
          profile_picture: string | null
          resume_url: string | null
          service_type: string
          skills: string | null
          status: string | null
          updated_at: string | null
          upi_id: string | null
          user_id: string
          vehicle_type: string | null
          working_hours_from: string | null
          working_hours_to: string | null
        }
        Insert: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          created_at?: string | null
          driving_license_number?: string | null
          email: string
          experience_years?: number | null
          full_name: string
          govt_id_url?: string | null
          id?: string
          id_number: string
          id_type: string
          ifsc_code?: string | null
          is_approved?: boolean | null
          is_online?: boolean | null
          languages?: string | null
          license_expiry_date?: string | null
          license_url?: string | null
          phone: string
          profile_picture?: string | null
          resume_url?: string | null
          service_type: string
          skills?: string | null
          status?: string | null
          updated_at?: string | null
          upi_id?: string | null
          user_id: string
          vehicle_type?: string | null
          working_hours_from?: string | null
          working_hours_to?: string | null
        }
        Update: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          created_at?: string | null
          driving_license_number?: string | null
          email?: string
          experience_years?: number | null
          full_name?: string
          govt_id_url?: string | null
          id?: string
          id_number?: string
          id_type?: string
          ifsc_code?: string | null
          is_approved?: boolean | null
          is_online?: boolean | null
          languages?: string | null
          license_expiry_date?: string | null
          license_url?: string | null
          phone?: string
          profile_picture?: string | null
          resume_url?: string | null
          service_type?: string
          skills?: string | null
          status?: string | null
          updated_at?: string | null
          upi_id?: string | null
          user_id?: string
          vehicle_type?: string | null
          working_hours_from?: string | null
          working_hours_to?: string | null
        }
        Relationships: []
      }
      requests: {
        Row: {
          created_at: string | null
          customer_id: string
          details: Json | null
          id: string
          location: string | null
          provider_id: string | null
          service_type: string
          status: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          details?: Json | null
          id?: string
          location?: string | null
          provider_id?: string | null
          service_type: string
          status?: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          details?: Json | null
          id?: string
          location?: string | null
          provider_id?: string | null
          service_type?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      insert_provider_details: {
        Args: { provider_data: Json }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
