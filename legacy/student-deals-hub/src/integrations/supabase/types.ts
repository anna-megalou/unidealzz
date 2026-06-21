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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ab_assignments: {
        Row: {
          anon_id: string | null
          created_at: string
          experiment_key: string
          id: string
          user_id: string | null
          variant: string
        }
        Insert: {
          anon_id?: string | null
          created_at?: string
          experiment_key: string
          id?: string
          user_id?: string | null
          variant: string
        }
        Update: {
          anon_id?: string | null
          created_at?: string
          experiment_key?: string
          id?: string
          user_id?: string | null
          variant?: string
        }
        Relationships: []
      }
      ab_events: {
        Row: {
          anon_id: string | null
          created_at: string
          event_type: string
          experiment_key: string
          id: string
          metadata: Json
          user_id: string | null
          variant: string
        }
        Insert: {
          anon_id?: string | null
          created_at?: string
          event_type: string
          experiment_key: string
          id?: string
          metadata?: Json
          user_id?: string | null
          variant: string
        }
        Update: {
          anon_id?: string | null
          created_at?: string
          event_type?: string
          experiment_key?: string
          id?: string
          metadata?: Json
          user_id?: string | null
          variant?: string
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          metadata: Json
          summary: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json
          summary: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json
          summary?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      claimed_offers: {
        Row: {
          claimed_at: string
          code_revealed: string | null
          id: string
          offer_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          code_revealed?: string | null
          id?: string
          offer_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          code_revealed?: string | null
          id?: string
          offer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claimed_offers_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      experience_post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "experience_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_post_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          position: number
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          position?: number
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          position?: number
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "experience_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "experience_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_posts: {
        Row: {
          brand_id: string | null
          category_id: string | null
          content: string
          created_at: string
          id: string
          location_text: string | null
          rating: number | null
          savings_amount: number | null
          title: string
          updated_at: string
          user_id: string
          visible: boolean
          would_recommend: boolean | null
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          content: string
          created_at?: string
          id?: string
          location_text?: string | null
          rating?: number | null
          savings_amount?: number | null
          title: string
          updated_at?: string
          user_id: string
          visible?: boolean
          would_recommend?: boolean | null
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          content?: string
          created_at?: string
          id?: string
          location_text?: string | null
          rating?: number | null
          savings_amount?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          visible?: boolean
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_posts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_brand_alerts_sent: {
        Row: {
          id: string
          offer_id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          offer_id: string
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          offer_id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          offer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          offer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          offer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          active: boolean
          brand_id: string
          category_id: string
          created_at: string
          description: string | null
          discount_code: string | null
          discount_label: string | null
          discount_percent: number | null
          expires_at: string | null
          featured: boolean
          id: string
          image_url: string | null
          redirect_url: string | null
          scope: string
          terms: string | null
          title: string
          university_ids: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          brand_id: string
          category_id: string
          created_at?: string
          description?: string | null
          discount_code?: string | null
          discount_label?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          redirect_url?: string | null
          scope?: string
          terms?: string | null
          title: string
          university_ids?: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          brand_id?: string
          category_id?: string
          created_at?: string
          description?: string | null
          discount_code?: string | null
          discount_label?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          redirect_url?: string | null
          scope?: string
          terms?: string | null
          title?: string
          university_ids?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_requests: {
        Row: {
          brand_name: string
          created_at: string
          email: string
          id: string
        }
        Insert: {
          brand_name: string
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_paid: number
          amount_saved: number
          claimed_offer_id: string | null
          created_at: string
          currency: string
          id: string
          merchant: string
          note: string | null
          offer_id: string | null
          payment_method: string | null
          purchased_at: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          amount_saved?: number
          claimed_offer_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          merchant: string
          note?: string | null
          offer_id?: string | null
          payment_method?: string | null
          purchased_at?: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          amount_saved?: number
          claimed_offer_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          merchant?: string
          note?: string | null
          offer_id?: string | null
          payment_method?: string | null
          purchased_at?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_claimed_offer_id_fkey"
            columns: ["claimed_offer_id"]
            isOneToOne: false
            referencedRelation: "claimed_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_offers: {
        Row: {
          created_at: string
          id: string
          offer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          offer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          offer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_offers_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          created_at: string
          expected_graduation: string | null
          id: string
          student_email: string | null
          university_id: string | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          expected_graduation?: string | null
          id?: string
          student_email?: string | null
          university_id?: string | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          expected_graduation?: string | null
          id?: string
          student_email?: string | null
          university_id?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          full_name: string
          id: string
          message: string
          status: string
          student_email: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          message: string
          status?: string
          student_email: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          message?: string
          status?: string
          student_email?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          invited_at: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          invited_at?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          invited_at?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          allowed_domains: string[]
          created_at: string
          id: string
          name: string
          short_code: string
        }
        Insert: {
          allowed_domains?: string[]
          created_at?: string
          id?: string
          name: string
          short_code: string
        }
        Update: {
          allowed_domains?: string[]
          created_at?: string
          id?: string
          name?: string
          short_code?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          budget_preference: string | null
          created_at: string
          extra: Json
          favorite_brands: string[]
          favorite_categories: string[]
          id: string
          onboarded: boolean
          online_vs_instore: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_preference?: string | null
          created_at?: string
          extra?: Json
          favorite_brands?: string[]
          favorite_categories?: string[]
          id?: string
          onboarded?: boolean
          online_vs_instore?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_preference?: string | null
          created_at?: string
          extra?: Json
          favorite_brands?: string[]
          favorite_categories?: string[]
          id?: string
          onboarded?: boolean
          online_vs_instore?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          currency: string
          email_notifications: boolean
          favorite_brand_alerts_opt_in: boolean
          id: string
          language: string
          marketing_opt_in: boolean
          phone: string | null
          push_notifications: boolean
          savings_goal: number
          security_alerts: boolean
          theme: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          email_notifications?: boolean
          favorite_brand_alerts_opt_in?: boolean
          id?: string
          language?: string
          marketing_opt_in?: boolean
          phone?: string | null
          push_notifications?: boolean
          savings_goal?: number
          security_alerts?: boolean
          theme?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          email_notifications?: boolean
          favorite_brand_alerts_opt_in?: boolean
          id?: string
          language?: string
          marketing_opt_in?: boolean
          phone?: string | null
          push_notifications?: boolean
          savings_goal?: number
          security_alerts?: boolean
          theme?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          created_at: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          student_email: string
          university_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          student_email: string
          university_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          student_email?: string
          university_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_registered_students_count: { Args: never; Returns: number }
      get_verified_students_count: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_activity: {
        Args: {
          _action: string
          _entity?: string
          _entity_id?: string
          _metadata?: Json
          _summary: string
        }
        Returns: string
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      submit_student_verification: {
        Args: { _student_email: string; _university_id: string }
        Returns: Database["public"]["Enums"]["verification_status"]
      }
    }
    Enums: {
      app_role: "admin" | "student" | "curator" | "analyst"
      verification_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "student", "curator", "analyst"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
