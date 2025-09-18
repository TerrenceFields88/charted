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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      brokerage_accounts: {
        Row: {
          account_id: string | null
          api_key_encrypted: string | null
          broker_name: string
          created_at: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          password_encrypted: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          account_id?: string | null
          api_key_encrypted?: string | null
          broker_name: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          password_encrypted?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          account_id?: string | null
          api_key_encrypted?: string | null
          broker_name?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          password_encrypted?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          member_count: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          member_count?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          member_count?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_1: string
          participant_2: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1: string
          participant_2: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1?: string
          participant_2?: string
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          created_at: string | null
          current_price: number | null
          description: string | null
          id: string
          market_cap: number | null
          price_change: number | null
          title: string
          updated_at: string | null
          volume: number | null
        }
        Insert: {
          created_at?: string | null
          current_price?: number | null
          description?: string | null
          id?: string
          market_cap?: number | null
          price_change?: number | null
          title: string
          updated_at?: string | null
          volume?: number | null
        }
        Update: {
          created_at?: string | null
          current_price?: number | null
          description?: string | null
          id?: string
          market_cap?: number | null
          price_change?: number | null
          title?: string
          updated_at?: string | null
          volume?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message_type: string
          sender_id: string
          shared_post_id: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string
          sender_id: string
          shared_post_id?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string
          sender_id?: string
          shared_post_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_shared_post_id_fkey"
            columns: ["shared_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          chart_symbol: string | null
          comment_count: number | null
          community_id: string | null
          content: string
          created_at: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          like_count: number | null
          post_type: string | null
          prediction_confidence: number | null
          prediction_outcome: string | null
          prediction_text: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chart_symbol?: string | null
          comment_count?: number | null
          community_id?: string | null
          content: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          like_count?: number | null
          post_type?: string | null
          prediction_confidence?: number | null
          prediction_outcome?: string | null
          prediction_text?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chart_symbol?: string | null
          comment_count?: number | null
          community_id?: string | null
          content?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          like_count?: number | null
          post_type?: string | null
          prediction_confidence?: number | null
          prediction_outcome?: string | null
          prediction_text?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          connected_brokers: Json | null
          created_at: string | null
          display_name: string | null
          follower_count: number | null
          following_count: number | null
          id: string
          total_accounts: number | null
          updated_at: string | null
          user_id: string
          username: string
          verified_trader: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          connected_brokers?: Json | null
          created_at?: string | null
          display_name?: string | null
          follower_count?: number | null
          following_count?: number | null
          id?: string
          total_accounts?: number | null
          updated_at?: string | null
          user_id: string
          username: string
          verified_trader?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          connected_brokers?: Json | null
          created_at?: string | null
          display_name?: string | null
          follower_count?: number | null
          following_count?: number | null
          id?: string
          total_accounts?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string
          verified_trader?: boolean | null
        }
        Relationships: []
      }
      security_audit: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      trades: {
        Row: {
          brokerage_account_id: string | null
          created_at: string
          executed_at: string
          id: string
          is_profitable: boolean | null
          price: number
          profit_loss: number | null
          quantity: number
          symbol: string
          trade_type: string
          trade_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          brokerage_account_id?: string | null
          created_at?: string
          executed_at: string
          id?: string
          is_profitable?: boolean | null
          price: number
          profit_loss?: number | null
          quantity: number
          symbol: string
          trade_type: string
          trade_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          brokerage_account_id?: string | null
          created_at?: string
          executed_at?: string
          id?: string
          is_profitable?: boolean | null
          price?: number
          profit_loss?: number | null
          quantity?: number
          symbol?: string
          trade_type?: string
          trade_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_brokerage_account_id_fkey"
            columns: ["brokerage_account_id"]
            isOneToOne: false
            referencedRelation: "brokerage_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_performance: {
        Row: {
          brokerage_account_id: string | null
          created_at: string
          id: string
          last_calculated_at: string | null
          losing_trades: number | null
          portfolio_return_percentage: number | null
          portfolio_value: number | null
          risk_reward_ratio: number | null
          total_trades: number | null
          updated_at: string
          user_id: string
          win_rate_percentage: number | null
          winning_trades: number | null
        }
        Insert: {
          brokerage_account_id?: string | null
          created_at?: string
          id?: string
          last_calculated_at?: string | null
          losing_trades?: number | null
          portfolio_return_percentage?: number | null
          portfolio_value?: number | null
          risk_reward_ratio?: number | null
          total_trades?: number | null
          updated_at?: string
          user_id: string
          win_rate_percentage?: number | null
          winning_trades?: number | null
        }
        Update: {
          brokerage_account_id?: string | null
          created_at?: string
          id?: string
          last_calculated_at?: string | null
          losing_trades?: number | null
          portfolio_return_percentage?: number | null
          portfolio_value?: number | null
          risk_reward_ratio?: number | null
          total_trades?: number | null
          updated_at?: string
          user_id?: string
          win_rate_percentage?: number | null
          winning_trades?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trading_performance_brokerage_account_id_fkey"
            columns: ["brokerage_account_id"]
            isOneToOne: false
            referencedRelation: "brokerage_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_trading_performance: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      decrement_post_likes: {
        Args: { post_id: string }
        Returns: undefined
      }
      get_or_create_conversation: {
        Args: { user_1: string; user_2: string }
        Returns: string
      }
      increment_post_comments: {
        Args: { post_id: string }
        Returns: undefined
      }
      increment_post_likes: {
        Args: { post_id: string }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_record_id?: string
          p_table_name?: string
          p_user_id: string
        }
        Returns: undefined
      }
      sanitize_content: {
        Args: { content: string }
        Returns: string
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
