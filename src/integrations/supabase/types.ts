export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      ai_usage: {
        Row: {
          created_at: string;
          feature: string;
          id: string;
          tokens_used: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          feature: string;
          id?: string;
          tokens_used?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          feature?: string;
          id?: string;
          tokens_used?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          category: string;
          content: Json;
          created_at: string;
          excerpt: string;
          id: string;
          image_url: string | null;
          published_at: string;
          seo_meta: Json | null;
          slug: string;
          title: string;
        };
        Insert: {
          category?: string;
          content?: Json;
          created_at?: string;
          excerpt: string;
          id?: string;
          image_url?: string | null;
          published_at?: string;
          seo_meta?: Json | null;
          slug: string;
          title: string;
        };
        Update: {
          category?: string;
          content?: Json;
          created_at?: string;
          excerpt?: string;
          id?: string;
          image_url?: string | null;
          published_at?: string;
          seo_meta?: Json | null;
          slug?: string;
          title?: string;
        };
        Relationships: [];
      };
      cv_scores: {
        Row: {
          breakdown: Json;
          created_at: string;
          cv_id: string;
          id: string;
          job_description: string | null;
          overall_score: number;
          suggestions: Json;
          user_id: string;
        };
        Insert: {
          breakdown?: Json;
          created_at?: string;
          cv_id: string;
          id?: string;
          job_description?: string | null;
          overall_score: number;
          suggestions?: Json;
          user_id: string;
        };
        Update: {
          breakdown?: Json;
          created_at?: string;
          cv_id?: string;
          id?: string;
          job_description?: string | null;
          overall_score?: number;
          suggestions?: Json;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cv_scores_cv_id_fkey";
            columns: ["cv_id"];
            isOneToOne: false;
            referencedRelation: "cvs";
            referencedColumns: ["id"];
          },
        ];
      };
      cv_versions: {
        Row: {
          created_at: string;
          cv_id: string;
          id: string;
          snapshot: Json;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          cv_id: string;
          id?: string;
          snapshot: Json;
          user_id: string;
        };
        Update: {
          created_at?: string;
          cv_id?: string;
          id?: string;
          snapshot?: Json;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cv_versions_cv_id_fkey";
            columns: ["cv_id"];
            isOneToOne: false;
            referencedRelation: "cvs";
            referencedColumns: ["id"];
          },
        ];
      };
      cv_downloads: {
        Row: {
          created_at: string;
          cv_id: string | null;
          download_type: string;
          file_name: string | null;
          id: string;
          template_id: string | null;
          user_id: string;
          user_tier: string | null;
        };
        Insert: {
          created_at?: string;
          cv_id?: string | null;
          download_type?: string;
          file_name?: string | null;
          id?: string;
          template_id?: string | null;
          user_id: string;
          user_tier?: string | null;
        };
        Update: {
          created_at?: string;
          cv_id?: string | null;
          download_type?: string;
          file_name?: string | null;
          id?: string;
          template_id?: string | null;
          user_id?: string;
          user_tier?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cv_downloads_cv_id_fkey";
            columns: ["cv_id"];
            isOneToOne: false;
            referencedRelation: "cvs";
            referencedColumns: ["id"];
          },
        ];
      };
      cvs: {
        Row: {
          created_at: string;
          data: Json;
          id: string;
          share_enabled: boolean;
          share_token: string | null;
          status: string;
          template_id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          data?: Json;
          id?: string;
          share_enabled?: boolean;
          share_token?: string | null;
          status?: string;
          template_id?: string;
          title?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          data?: Json;
          id?: string;
          share_enabled?: boolean;
          share_token?: string | null;
          status?: string;
          template_id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      interview_tips: {
        Row: {
          category: string;
          content: Json;
          created_at: string;
          excerpt: string;
          id: string;
          published_at: string;
          seo_meta: Json | null;
          slug: string;
          title: string;
        };
        Insert: {
          category: string;
          content?: Json;
          created_at?: string;
          excerpt: string;
          id?: string;
          published_at?: string;
          seo_meta?: Json | null;
          slug: string;
          title: string;
        };
        Update: {
          category?: string;
          content?: Json;
          created_at?: string;
          excerpt?: string;
          id?: string;
          published_at?: string;
          seo_meta?: Json | null;
          slug?: string;
          title?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          headline: string | null;
          id: string;
          location: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          headline?: string | null;
          id: string;
          location?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          headline?: string | null;
          id?: string;
          location?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscription_tiers: {
        Row: {
          created_at: string;
          description: string | null;
          features: Json | null;
          id: string;
          is_active: boolean;
          max_cvs: number | null;
          name: string;
          price_monthly: number;
          price_yearly: number | null;
          quota_ai_chat: number | null;
          quota_ai_cover_letter: number | null;
          quota_ai_keyword_extract: number | null;
          quota_ai_score: number | null;
          quota_ai_suggest: number | null;
          quota_cv_downloads: number | null;
          slug: string;
          sort_order: number;
          template_access: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          features?: Json | null;
          id?: string;
          is_active?: boolean;
          max_cvs?: number | null;
          name: string;
          price_monthly?: number;
          price_yearly?: number | null;
          quota_ai_chat?: number | null;
          quota_ai_cover_letter?: number | null;
          quota_ai_keyword_extract?: number | null;
          quota_ai_score?: number | null;
          quota_ai_suggest?: number | null;
          quota_cv_downloads?: number | null;
          slug: string;
          sort_order?: number;
          template_access?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          features?: Json | null;
          id?: string;
          is_active?: boolean;
          max_cvs?: number | null;
          name?: string;
          price_monthly?: number;
          price_yearly?: number | null;
          quota_ai_chat?: number | null;
          quota_ai_cover_letter?: number | null;
          quota_ai_keyword_extract?: number | null;
          quota_ai_score?: number | null;
          quota_ai_suggest?: number | null;
          quota_cv_downloads?: number | null;
          slug?: string;
          sort_order?: number;
          template_access?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          created_at: string;
          current_period_end: string;
          current_period_start: string;
          external_id: string | null;
          id: string;
          provider: string | null;
          status: Database["public"]["Enums"]["subscription_status"];
          tier: Database["public"]["Enums"]["subscription_tier"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_period_end?: string;
          current_period_start?: string;
          external_id?: string | null;
          id?: string;
          provider?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          tier?: Database["public"]["Enums"]["subscription_tier"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_period_end?: string;
          current_period_start?: string;
          external_id?: string | null;
          id?: string;
          provider?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          tier?: Database["public"]["Enums"]["subscription_tier"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      templates: {
        Row: {
          color: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_premium: boolean;
          name: string;
          preview_url: string | null;
          slug: string;
          sort_order: number;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_premium?: boolean;
          name: string;
          preview_url?: string | null;
          slug: string;
          sort_order?: number;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_premium?: boolean;
          name?: string;
          preview_url?: string | null;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          auto_renew: boolean;
          created_at: string;
          date_end: string;
          date_start: string;
          external_id: string | null;
          id: string;
          provider: string | null;
          status: Database["public"]["Enums"]["subscription_status_new"];
          tier_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          auto_renew?: boolean;
          created_at?: string;
          date_end?: string;
          date_start?: string;
          external_id?: string | null;
          id?: string;
          provider?: string | null;
          status?: Database["public"]["Enums"]["subscription_status_new"];
          tier_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          auto_renew?: boolean;
          created_at?: string;
          date_end?: string;
          date_start?: string;
          external_id?: string | null;
          id?: string;
          provider?: string | null;
          status?: Database["public"]["Enums"]["subscription_status_new"];
          tier_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_tier_id_fkey";
            columns: ["tier_id"];
            isOneToOne: false;
            referencedRelation: "subscription_tiers";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_share_token: { Args: never; Returns: string };
      has_role: {
        Args: {
          _user_id: string;
          _role: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "user";
      subscription_status: "active" | "cancelled" | "expired" | "past_due";
      subscription_status_new: "active" | "cancelled" | "expired" | "past_due" | "trial";
      subscription_tier: "free" | "starter" | "pro";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      subscription_status: ["active", "cancelled", "expired", "past_due"],
      subscription_status_new: ["active", "cancelled", "expired", "past_due", "trial"],
      subscription_tier: ["free", "starter", "pro"],
    },
  },
} as const;
