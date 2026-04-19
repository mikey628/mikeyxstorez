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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bonus_rules: {
        Row: {
          created_at: string
          free_keys: number
          id: string
          is_active: boolean
          min_keys: number
          note: string | null
          product_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          free_keys: number
          id?: string
          is_active?: boolean
          min_keys: number
          note?: string | null
          product_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          free_keys?: number
          id?: string
          is_active?: boolean
          min_keys?: number
          note?: string | null
          product_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string | null
          sender_role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role?: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          status: string
          updated_at: string
          user_email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_email: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          price: number
          qr_url: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
          qr_url?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
          qr_url?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      credit_requests: {
        Row: {
          admin_note: string | null
          amount_paid: number
          created_at: string
          id: string
          package_amount: number
          package_id: string | null
          payment_method: string
          payment_proof_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount_paid?: number
          created_at?: string
          id?: string
          package_amount?: number
          package_id?: string | null
          payment_method?: string
          payment_proof_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount_paid?: number
          created_at?: string
          id?: string
          package_amount?: number
          package_id?: string | null
          payment_method?: string
          payment_proof_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_requests_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      keys: {
        Row: {
          created_at: string
          duration_days: number | null
          id: string
          is_used: boolean
          key_code: string
          product_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          duration_days?: number | null
          id?: string
          is_used?: boolean
          key_code: string
          product_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          duration_days?: number | null
          id?: string
          is_used?: boolean
          key_code?: string
          product_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keys_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number | null
          id: string
          is_active: boolean
          key_code: string | null
          price_points: number | null
          sort_order: number | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          is_active?: boolean
          key_code?: string | null
          price_points?: number | null
          sort_order?: number | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          is_active?: boolean
          key_code?: string | null
          price_points?: number | null
          sort_order?: number | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string
          currency: string | null
          id: string
          instructions: string | null
          is_active: boolean
          method_type: string
          name: string
          qr_url: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          method_type?: string
          name: string
          qr_url?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          method_type?: string
          name?: string
          qr_url?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number[] | null
          duration_prices: Json | null
          file_url: string | null
          id: string
          image_url: string | null
          name: string
          price_points: number
          price_usd: number | null
          stock: number
          tier_prices: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number[] | null
          duration_prices?: Json | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          name: string
          price_points: number
          price_usd?: number | null
          stock?: number
          tier_prices?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number[] | null
          duration_prices?: Json | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price_points?: number
          price_usd?: number | null
          stock?: number
          tier_prices?: Json
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          discord_link: string | null
          display_name: string | null
          email: string
          id: string
          is_approved: boolean
          is_banned: boolean
          phone_number: string | null
          photo_url: string | null
          total_purchases: number
          updated_at: string
          user_id: string
          wallet_points: number
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          discord_link?: string | null
          display_name?: string | null
          email: string
          id?: string
          is_approved?: boolean
          is_banned?: boolean
          phone_number?: string | null
          photo_url?: string | null
          total_purchases?: number
          updated_at?: string
          user_id: string
          wallet_points?: number
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          discord_link?: string | null
          display_name?: string | null
          email?: string
          id?: string
          is_approved?: boolean
          is_banned?: boolean
          phone_number?: string | null
          photo_url?: string | null
          total_purchases?: number
          updated_at?: string
          user_id?: string
          wallet_points?: number
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      reseller_applications: {
        Row: {
          admin_note: string | null
          avg_followers: string | null
          created_at: string
          id: string
          reseller_tier: string
          seller_name: string
          status: string
          tiktok_channel: string | null
          updated_at: string
          user_id: string
          whatsapp: string
        }
        Insert: {
          admin_note?: string | null
          avg_followers?: string | null
          created_at?: string
          id?: string
          reseller_tier?: string
          seller_name: string
          status?: string
          tiktok_channel?: string | null
          updated_at?: string
          user_id: string
          whatsapp: string
        }
        Update: {
          admin_note?: string | null
          avg_followers?: string | null
          created_at?: string
          id?: string
          reseller_tier?: string
          seller_name?: string
          status?: string
          tiktok_channel?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string
        }
        Relationships: []
      }
      reseller_keys: {
        Row: {
          created_at: string
          duration_days: number | null
          id: string
          is_used: boolean
          key_code: string
          product_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          duration_days?: number | null
          id?: string
          is_used?: boolean
          key_code: string
          product_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          duration_days?: number | null
          id?: string
          is_used?: boolean
          key_code?: string
          product_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reseller_keys_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "reseller_products"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_products: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number[] | null
          duration_prices: Json | null
          id: string
          is_active: boolean
          name: string
          price_credits: number
          stock: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number[] | null
          duration_prices?: Json | null
          id?: string
          is_active?: boolean
          name: string
          price_credits?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number[] | null
          duration_prices?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          price_credits?: number
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      topup_admins: {
        Row: {
          added_by: string | null
          created_at: string
          email: string
          id: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          email: string
          id?: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          email?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      topup_games: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          id_label: string | null
          image_url: string | null
          is_active: boolean
          name: string
          sort_order: number | null
          uid_label: string | null
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          id_label?: string | null
          image_url?: string | null
          is_active?: boolean
          name: string
          sort_order?: number | null
          uid_label?: string | null
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          id_label?: string | null
          image_url?: string | null
          is_active?: boolean
          name?: string
          sort_order?: number | null
          uid_label?: string | null
        }
        Relationships: []
      }
      topup_history: {
        Row: {
          created_at: string
          game_name: string | null
          game_uid: string | null
          id: string
          package_label: string | null
          package_price: number | null
          payment_method: string | null
          player_name: string | null
          server_name: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          game_name?: string | null
          game_uid?: string | null
          id?: string
          package_label?: string | null
          package_price?: number | null
          payment_method?: string | null
          player_name?: string | null
          server_name?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          game_name?: string | null
          game_uid?: string | null
          id?: string
          package_label?: string | null
          package_price?: number | null
          payment_method?: string | null
          player_name?: string | null
          server_name?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      topup_packages: {
        Row: {
          created_at: string
          description: string | null
          diamonds: number | null
          duration_days: number | null
          emoji: string | null
          game_id: string | null
          id: string
          image_url: string | null
          is_active: boolean
          label: string
          price: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          diamonds?: number | null
          duration_days?: number | null
          emoji?: string | null
          game_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          label: string
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          diamonds?: number | null
          duration_days?: number | null
          emoji?: string | null
          game_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          label?: string
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topup_packages_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "topup_games"
            referencedColumns: ["id"]
          },
        ]
      }
      topup_requests: {
        Row: {
          admin_note: string | null
          amount_paid: number
          created_at: string
          duration_label: string
          fake_score: number | null
          game_name: string | null
          game_uid: string
          id: string
          payment_method: string
          payment_proof_url: string | null
          product_name: string
          server_id: string | null
          server_name: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          amount_paid?: number
          created_at?: string
          duration_label: string
          fake_score?: number | null
          game_name?: string | null
          game_uid: string
          id?: string
          payment_method?: string
          payment_proof_url?: string | null
          product_name: string
          server_id?: string | null
          server_name?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          amount_paid?: number
          created_at?: string
          duration_label?: string
          fake_score?: number | null
          game_name?: string | null
          game_uid?: string
          id?: string
          payment_method?: string
          payment_proof_url?: string | null
          product_name?: string
          server_id?: string | null
          server_name?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topup_requests_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "topup_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      topup_servers: {
        Row: {
          created_at: string
          flag: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          flag?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          flag?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          key_id: string | null
          product_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          key_id?: string | null
          product_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          key_id?: string | null
          product_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
