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
      celebration_rewards_log: {
        Row: {
          company_id: string
          created_at: string
          event_date: string
          id: string
          points_awarded: number
          profile_id: string
          reward_type: string
          year: number
        }
        Insert: {
          company_id: string
          created_at?: string
          event_date: string
          id?: string
          points_awarded: number
          profile_id: string
          reward_type: string
          year: number
        }
        Update: {
          company_id?: string
          created_at?: string
          event_date?: string
          id?: string
          points_awarded?: number
          profile_id?: string
          reward_type?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "celebration_rewards_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "celebration_rewards_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          anniversary_reward_points: number
          anniversary_rewards_enabled: boolean
          billing_cycle_anchor: number | null
          billing_ready: boolean | null
          birthday_reward_points: number
          birthday_rewards_enabled: boolean
          created_at: string
          environment: string
          first_active_member_at: string | null
          first_charge_at: string | null
          handle: string | null
          id: string
          logo_url: string | null
          name: string
          points_balance: number
          region_setup_complete: boolean | null
          stripe_customer_id: string | null
          stripe_customer_id_live: string | null
          stripe_customer_id_test: string | null
          stripe_subscription_id: string | null
          stripe_subscription_item_id: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          trial_mode: boolean | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          anniversary_reward_points?: number
          anniversary_rewards_enabled?: boolean
          billing_cycle_anchor?: number | null
          billing_ready?: boolean | null
          birthday_reward_points?: number
          birthday_rewards_enabled?: boolean
          created_at?: string
          environment?: string
          first_active_member_at?: string | null
          first_charge_at?: string | null
          handle?: string | null
          id?: string
          logo_url?: string | null
          name: string
          points_balance?: number
          region_setup_complete?: boolean | null
          stripe_customer_id?: string | null
          stripe_customer_id_live?: string | null
          stripe_customer_id_test?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_item_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          trial_mode?: boolean | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          anniversary_reward_points?: number
          anniversary_rewards_enabled?: boolean
          billing_cycle_anchor?: number | null
          billing_ready?: boolean | null
          birthday_reward_points?: number
          birthday_rewards_enabled?: boolean
          created_at?: string
          environment?: string
          first_active_member_at?: string | null
          first_charge_at?: string | null
          handle?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          points_balance?: number
          region_setup_complete?: boolean | null
          stripe_customer_id?: string | null
          stripe_customer_id_live?: string | null
          stripe_customer_id_test?: string | null
          stripe_subscription_id?: string | null
          stripe_subscription_item_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          trial_mode?: boolean | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_point_transactions: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          created_by: string
          description: string
          id: string
          payment_status: string
          transaction_type: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          created_by: string
          description: string
          id?: string
          payment_status?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          payment_status?: string
          transaction_type?: string
        }
        Relationships: []
      }
      company_regions: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          region_code: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          region_code: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          region_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_regions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_values: {
        Row: {
          color: string
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          color?: string
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          color?: string
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_values_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      giftbit_brands: {
        Row: {
          allowed_prices_in_cents: number[] | null
          brand_code: string
          brand_data: Json | null
          category: string | null
          created_at: string
          currency_code: string | null
          description: string | null
          disclaimer: string | null
          environment: string
          id: string
          image_url: string | null
          is_active: boolean | null
          last_synced_at: string | null
          max_price_in_cents: number | null
          min_price_in_cents: number | null
          name: string
          price_is_variable: boolean | null
          region_code: string
          updated_at: string
        }
        Insert: {
          allowed_prices_in_cents?: number[] | null
          brand_code: string
          brand_data?: Json | null
          category?: string | null
          created_at?: string
          currency_code?: string | null
          description?: string | null
          disclaimer?: string | null
          environment?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          last_synced_at?: string | null
          max_price_in_cents?: number | null
          min_price_in_cents?: number | null
          name: string
          price_is_variable?: boolean | null
          region_code: string
          updated_at?: string
        }
        Update: {
          allowed_prices_in_cents?: number[] | null
          brand_code?: string
          brand_data?: Json | null
          category?: string | null
          created_at?: string
          currency_code?: string | null
          description?: string | null
          disclaimer?: string | null
          environment?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          last_synced_at?: string | null
          max_price_in_cents?: number | null
          min_price_in_cents?: number | null
          name?: string
          price_is_variable?: boolean | null
          region_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      giftbit_regions: {
        Row: {
          created_at: string
          currency_code: string | null
          environment: string
          giftbit_region_id: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          region_code: string
        }
        Insert: {
          created_at?: string
          currency_code?: string | null
          environment?: string
          giftbit_region_id?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          region_code: string
        }
        Update: {
          created_at?: string
          currency_code?: string | null
          environment?: string
          giftbit_region_id?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          region_code?: string
        }
        Relationships: []
      }
      goody_gift_cards: {
        Row: {
          brand_id: string | null
          brand_name: string
          created_at: string
          description: string | null
          environment: string
          goody_product_id: string
          id: string
          image_url: string | null
          is_active: boolean
          last_synced_at: string
          name: string
          price: number | null
          price_is_variable: boolean
          product_data: Json | null
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          brand_name: string
          created_at?: string
          description?: string | null
          environment?: string
          goody_product_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          last_synced_at?: string
          name: string
          price?: number | null
          price_is_variable?: boolean
          product_data?: Json | null
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          brand_name?: string
          created_at?: string
          description?: string | null
          environment?: string
          goody_product_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          last_synced_at?: string
          name?: string
          price?: number | null
          price_is_variable?: boolean
          product_data?: Json | null
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      goody_products: {
        Row: {
          brand_id: string | null
          brand_name: string
          created_at: string
          description: string | null
          environment: string
          goody_product_id: string
          id: string
          image_url: string | null
          is_active: boolean
          last_synced_at: string
          name: string
          price: number | null
          price_is_variable: boolean
          product_data: Json | null
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          brand_name: string
          created_at?: string
          description?: string | null
          environment?: string
          goody_product_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          last_synced_at?: string
          name: string
          price?: number | null
          price_is_variable?: boolean
          product_data?: Json | null
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          brand_name?: string
          created_at?: string
          description?: string | null
          environment?: string
          goody_product_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          last_synced_at?: string
          name?: string
          price?: number | null
          price_is_variable?: boolean
          product_data?: Json | null
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      login_events: {
        Row: {
          company_id: string
          created_at: string
          id: string
          logged_in_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          logged_in_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          logged_in_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          monthly_price_per_team_member_in_cents: number | null
          point_exchange_rate: number | null
          stripe_celebration_product_id_live: string | null
          stripe_celebration_product_id_test: string | null
          stripe_price_id_live: string | null
          stripe_price_id_test: string | null
          stripe_product_id_live: string | null
          stripe_product_id_test: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          monthly_price_per_team_member_in_cents?: number | null
          point_exchange_rate?: number | null
          stripe_celebration_product_id_live?: string | null
          stripe_celebration_product_id_test?: string | null
          stripe_price_id_live?: string | null
          stripe_price_id_test?: string | null
          stripe_product_id_live?: string | null
          stripe_product_id_test?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          monthly_price_per_team_member_in_cents?: number | null
          point_exchange_rate?: number | null
          stripe_celebration_product_id_live?: string | null
          stripe_celebration_product_id_test?: string | null
          stripe_price_id_live?: string | null
          stripe_price_id_test?: string | null
          stripe_product_id_live?: string | null
          stripe_product_id_test?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          company_id: string
          company_value_id: string | null
          created_at: string
          description: string
          gif_url: string | null
          id: string
          points: number
          recipient_profile_id: string
          sender_profile_id: string
          structured_message: string | null
        }
        Insert: {
          company_id: string
          company_value_id?: string | null
          created_at?: string
          description: string
          gif_url?: string | null
          id?: string
          points: number
          recipient_profile_id: string
          sender_profile_id: string
          structured_message?: string | null
        }
        Update: {
          company_id?: string
          company_value_id?: string | null
          created_at?: string
          description?: string
          gif_url?: string | null
          id?: string
          points?: number
          recipient_profile_id?: string
          sender_profile_id?: string
          structured_message?: string | null
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
            foreignKeyName: "point_transactions_company_value_id_fkey"
            columns: ["company_value_id"]
            isOneToOne: false
            referencedRelation: "company_values"
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
          birthday: string | null
          company_id: string | null
          company_start_date: string | null
          created_at: string
          department: string | null
          department_id: string | null
          first_login_at: string | null
          first_name: string
          id: string
          is_admin: boolean
          is_platform_admin: boolean
          last_name: string
          monthly_points: number
          points: number
          role: string
          slack_user_id: string | null
          status: string
          temporary_password: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          company_id?: string | null
          company_start_date?: string | null
          created_at?: string
          department?: string | null
          department_id?: string | null
          first_login_at?: string | null
          first_name: string
          id: string
          is_admin?: boolean
          is_platform_admin?: boolean
          last_name: string
          monthly_points?: number
          points?: number
          role?: string
          slack_user_id?: string | null
          status?: string
          temporary_password?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          company_id?: string | null
          company_start_date?: string | null
          created_at?: string
          department?: string | null
          department_id?: string | null
          first_login_at?: string | null
          first_name?: string
          id?: string
          is_admin?: boolean
          is_platform_admin?: boolean
          last_name?: string
          monthly_points?: number
          points?: number
          role?: string
          slack_user_id?: string | null
          status?: string
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
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      redemptions: {
        Row: {
          company_id: string
          created_at: string
          dollar_amount: number | null
          giftbit_claim_link: string | null
          giftbit_gift_id: string | null
          giftbit_order_id: string | null
          goody_order_batch_id: string | null
          goody_order_id: string | null
          id: string
          individual_gift_link: string | null
          points_spent: number
          provider: string | null
          redemption_date: string
          reward_id: string
          reward_name: string
          shipping_address: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          dollar_amount?: number | null
          giftbit_claim_link?: string | null
          giftbit_gift_id?: string | null
          giftbit_order_id?: string | null
          goody_order_batch_id?: string | null
          goody_order_id?: string | null
          id?: string
          individual_gift_link?: string | null
          points_spent: number
          provider?: string | null
          redemption_date?: string
          reward_id: string
          reward_name: string
          shipping_address?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          dollar_amount?: number | null
          giftbit_claim_link?: string | null
          giftbit_gift_id?: string | null
          giftbit_order_id?: string | null
          goody_order_batch_id?: string | null
          goody_order_id?: string | null
          id?: string
          individual_gift_link?: string | null
          points_spent?: number
          provider?: string | null
          redemption_date?: string
          reward_id?: string
          reward_name?: string
          shipping_address?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      slack_integrations: {
        Row: {
          access_token: string
          bot_token: string
          company_id: string
          created_at: string
          default_channel_id: string | null
          default_channel_name: string | null
          id: string
          notification_settings: Json | null
          updated_at: string
          workspace_id: string
          workspace_name: string
        }
        Insert: {
          access_token: string
          bot_token: string
          company_id: string
          created_at?: string
          default_channel_id?: string | null
          default_channel_name?: string | null
          id?: string
          notification_settings?: Json | null
          updated_at?: string
          workspace_id: string
          workspace_name: string
        }
        Update: {
          access_token?: string
          bot_token?: string
          company_id?: string
          created_at?: string
          default_channel_id?: string | null
          default_channel_name?: string | null
          id?: string
          notification_settings?: Json | null
          updated_at?: string
          workspace_id?: string
          workspace_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "slack_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
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
      teams_integrations: {
        Row: {
          access_token: string | null
          auth_type: string
          channel_id: string | null
          channel_name: string | null
          company_id: string
          created_at: string
          id: string
          notification_settings: Json | null
          refresh_token: string | null
          team_id: string | null
          team_name: string | null
          token_expires_at: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          access_token?: string | null
          auth_type?: string
          channel_id?: string | null
          channel_name?: string | null
          company_id: string
          created_at?: string
          id?: string
          notification_settings?: Json | null
          refresh_token?: string | null
          team_id?: string | null
          team_name?: string | null
          token_expires_at?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          access_token?: string | null
          auth_type?: string
          channel_id?: string | null
          channel_name?: string | null
          company_id?: string
          created_at?: string
          id?: string
          notification_settings?: Json | null
          refresh_token?: string | null
          team_id?: string | null
          team_name?: string | null
          token_expires_at?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
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
      check_platform_admin_bypass_rls: {
        Args: { user_id?: string }
        Returns: boolean
      }
      check_user_company_membership: {
        Args: { company_id: string; profile_id: string }
        Returns: boolean
      }
      check_user_is_company_admin_bypass_rls: {
        Args: { check_company_id: string; check_user_id: string }
        Returns: boolean
      }
      check_user_is_team_member_bypass_rls: {
        Args: { check_company_id: string; check_user_id: string }
        Returns: boolean
      }
      get_company_member_count: {
        Args: { company_id: string }
        Returns: number
      }
      get_platform_setting: { Args: { setting_key: string }; Returns: string }
      get_stripe_active_member_count: {
        Args: { company_id: string }
        Returns: number
      }
      get_user_platform_admin_status: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_company_admin: { Args: { company_id: string }; Returns: boolean }
      is_company_member: { Args: { company_id: string }; Returns: boolean }
      is_member_of_company: { Args: { company_id: string }; Returns: boolean }
      is_platform_admin: { Args: { user_id?: string }; Returns: boolean }
      is_platform_admin_with_company_check: {
        Args: { user_id?: string }
        Returns: boolean
      }
      should_allocate_monthly_points: {
        Args: { target_company_id: string }
        Returns: boolean
      }
      sync_gift_cards_from_products: {
        Args: { target_environment?: string }
        Returns: number
      }
      transfer_points_between_users: {
        Args: {
          points_amount: number
          recipient_user_id: string
          sender_user_id: string
          transfer_company_id: string
          transfer_description: string
          transfer_gif_url?: string
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
