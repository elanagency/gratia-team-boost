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
      companies: {
        Row: {
          address: string | null
          billing_cycle_anchor: number | null
          created_at: string
          handle: string
          id: string
          logo_url: string | null
          name: string
          points_balance: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          team_slots: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          billing_cycle_anchor?: number | null
          created_at?: string
          handle: string
          id?: string
          logo_url?: string | null
          name: string
          points_balance?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          team_slots?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          billing_cycle_anchor?: number | null
          created_at?: string
          handle?: string
          id?: string
          logo_url?: string | null
          name?: string
          points_balance?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          team_slots?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_admin: boolean
          points: number
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_admin?: boolean
          points?: number
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_admin?: boolean
          points?: number
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_point_transactions: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          created_by: string
          description: string
          id: string
          payment_status: string | null
          stripe_fee: number | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          total_amount: number | null
          transaction_type: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          created_by: string
          description: string
          id?: string
          payment_status?: string | null
          stripe_fee?: number | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount?: number | null
          transaction_type: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          payment_status?: string | null
          stripe_fee?: number | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount?: number | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_point_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          points: number
          recipient_id: string
          sender_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description: string
          id?: string
          points: number
          recipient_id: string
          sender_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          points?: number
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string
          id: string
          last_name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name: string
          id: string
          last_name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      reward_categories: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_category_mappings: {
        Row: {
          category_id: string
          reward_id: string
        }
        Insert: {
          category_id: string
          reward_id: string
        }
        Update: {
          category_id?: string
          reward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_category_mappings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "reward_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_category_mappings_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_redemptions: {
        Row: {
          id: string
          points_spent: number
          redemption_date: string
          reward_id: string
          rye_cart_id: string | null
          rye_order_id: string | null
          shipping_address: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          points_spent: number
          redemption_date?: string
          reward_id: string
          rye_cart_id?: string | null
          rye_order_id?: string | null
          shipping_address?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          points_spent?: number
          redemption_date?: string
          reward_id?: string
          rye_cart_id?: string | null
          rye_order_id?: string | null
          shipping_address?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          external_id: string | null
          id: string
          image_url: string | null
          name: string
          points_cost: number
          rye_product_url: string | null
          stock: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          points_cost: number
          rye_product_url?: string | null
          stock?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          points_cost?: number
          rye_product_url?: string | null
          stock?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_company_id_fkey"
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
          new_slots: number | null
          previous_quantity: number | null
          previous_slots: number | null
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
          new_slots?: number | null
          previous_quantity?: number | null
          previous_slots?: number | null
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
          new_slots?: number | null
          previous_quantity?: number | null
          previous_slots?: number | null
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
      calculate_prorated_amount: {
        Args: {
          base_amount: number
          employee_count: number
          days_remaining: number
          total_days_in_month: number
        }
        Returns: number
      }
      check_company_membership: {
        Args: { user_id: string; company_id: string }
        Returns: boolean
      }
      check_user_company_membership: {
        Args: { user_id: string; company_id: string }
        Returns: boolean
      }
      get_company_member_count: {
        Args: { company_id: string }
        Returns: number
      }
      get_used_team_slots: {
        Args: { company_id: string }
        Returns: number
      }
      has_available_team_slots: {
        Args: { company_id: string }
        Returns: boolean
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
