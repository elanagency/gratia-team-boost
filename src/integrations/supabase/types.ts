export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      backup_users: {
        Row: {
          company_name: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          department: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          original_user_id: string
          points: number | null
          role: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          original_user_id: string
          points?: number | null
          role?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          original_user_id?: string
          points?: number | null
          role?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          billing_cycle_anchor: number | null
          created_at: string
          environment: string
          first_active_member_at: string | null
          handle: string | null
          id: string
          logo_url: string | null
          name: string
          points_balance: number
          stripe_customer_id: string | null
          stripe_customer_id_live: string | null
          stripe_customer_id_test: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          trial_mode: boolean | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          billing_cycle_anchor?: number | null
          created_at?: string
          environment?: string
          first_active_member_at?: string | null
          handle?: string | null
          id?: string
          logo_url?: string | null
          name: string
          points_balance?: number
          stripe_customer_id?: string | null
          stripe_customer_id_live?: string | null
          stripe_customer_id_test?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          trial_mode?: boolean | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          billing_cycle_anchor?: number | null
          created_at?: string
          environment?: string
          first_active_member_at?: string | null
          handle?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          points_balance?: number
          stripe_customer_id?: string | null
          stripe_customer_id_live?: string | null
          stripe_customer_id_test?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          trial_mode?: boolean | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      goody_gift_cards: {
        Row: {
          brand_name: string
          created_at: string
          description: string | null
          goody_product_id: string
          id: string
          image_url: string | null
          is_active: boolean
          last_synced_at: string
          name: string
          price: number | null
          product_data: Json | null
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          brand_name: string
          created_at?: string
          description?: string | null
          goody_product_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          last_synced_at?: string
          name: string
          price?: number | null
          product_data?: Json | null
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          description?: string | null
          goody_product_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          last_synced_at?: string
          name?: string
          price?: number | null
          product_data?: Json | null
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      monthly_points_allocations: {
        Row: {
          allocation_date: string
          allocation_month: string
          company_id: string
          created_at: string
          id: string
          points_allocated: number
          user_id: string
        }
        Insert: {
          allocation_date?: string
          allocation_month: string
          company_id: string
          created_at?: string
          id?: string
          points_allocated?: number
          user_id: string
        }
        Update: {
          allocation_date?: string
          allocation_month?: string
          company_id?: string
          created_at?: string
          id?: string
          points_allocated?: number
          user_id?: string
        }
        Relationships: []
      }
      platform_product_blacklist: {
        Row: {
          created_at: string
          disabled_at: string
          disabled_by: string | null
          goody_product_id: string
          id: string
        }
        Insert: {
          created_at?: string
          disabled_at?: string
          disabled_by?: string | null
          goody_product_id: string
          id?: string
        }
        Update: {
          created_at?: string
          disabled_at?: string
          disabled_by?: string | null
          goody_product_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_product_blacklist_disabled_by_fkey"
            columns: ["disabled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          points: number
          recipient_profile_id: string
          sender_profile_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description: string
          id?: string
          points: number
          recipient_profile_id: string
          sender_profile_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          points?: number
          recipient_profile_id?: string
          sender_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          department: string | null
          first_login_at: string | null
          first_name: string
          id: string
          invitation_status: string
          is_active: boolean
          is_admin: boolean
          is_platform_admin: boolean
          last_name: string
          monthly_points: number
          points: number
          role: string
          shipping_address: string | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_name: string | null
          shipping_phone: string | null
          shipping_state: string | null
          shipping_zip_code: string | null
          temporary_password: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          department?: string | null
          first_login_at?: string | null
          first_name: string
          id: string
          invitation_status?: string
          is_active?: boolean
          is_admin?: boolean
          is_platform_admin?: boolean
          last_name: string
          monthly_points?: number
          points?: number
          role?: string
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_state?: string | null
          shipping_zip_code?: string | null
          temporary_password?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          department?: string | null
          first_login_at?: string | null
          first_name?: string
          id?: string
          invitation_status?: string
          is_active?: boolean
          is_admin?: boolean
          is_platform_admin?: boolean
          last_name?: string
          monthly_points?: number
          points?: number
          role?: string
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_state?: string | null
          shipping_zip_code?: string | null
          temporary_password?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          amount_charged: number | null
          company_id: string
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          new_quantity: number | null
          previous_quantity: number | null
          stripe_invoice_id: string | null
        }
        Insert: {
          amount_charged?: number | null
          company_id: string
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          new_quantity?: number | null
          previous_quantity?: number | null
          stripe_invoice_id?: string | null
        }
        Update: {
          amount_charged?: number | null
          company_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          new_quantity?: number | null
          previous_quantity?: number | null
          stripe_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allocate_monthly_points: {
        Args: { target_company_id: string }
        Returns: number
      }
      calculate_prorated_amount: {
        Args: {
          base_amount: number
          days_remaining: number
          employee_count: number
          total_days_in_month: number
        }
        Returns: number
      }
      check_company_membership: {
        Args: { company_id: string; profile_id: string }
        Returns: boolean
      }
      check_user_company_membership: {
        Args: { company_id: string; profile_id: string }
        Returns: boolean
      }
      get_company_member_count: {
        Args: { company_id: string }
        Returns: number
      }
      get_platform_setting: {
        Args: { setting_key: string }
        Returns: string
      }
      is_company_admin: {
        Args: { company_id: string }
        Returns: boolean
      }
      is_company_member: {
        Args: { company_id: string }
        Returns: boolean
      }
      is_member_of_company: {
        Args: { company_id: string }
        Returns: boolean
      }
      is_platform_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      should_allocate_monthly_points: {
        Args: { target_company_id: string }
        Returns: boolean
      }
      transfer_points_between_users: {
        Args: {
          points_amount: number
          recipient_user_id: string
          sender_user_id: string
          transfer_company_id: string
          transfer_description: string
        }
        Returns: Json
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
