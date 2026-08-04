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
          quota_ai_tailor_cv: number | null;
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
          quota_ai_tailor_cv?: number | null;
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
          quota_ai_tailor_cv?: number | null;
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
      tryout_attempts: {
        Row: {
          answers: Json;
          created_at: string;
          credit_id: string | null;
          duration_seconds: number | null;
          exam_set_id: string;
          finished_at: string | null;
          flagged_questions: Json;
          id: string;
          pass_overall: boolean;
          pass_tiu: boolean;
          pass_tkp: boolean;
          pass_twk: boolean;
          score_tiu: number;
          score_tkp: number;
          score_total: number;
          score_twk: number;
          started_at: string;
          stats: Json;
          status: string;
          user_id: string;
        };
        Insert: {
          answers?: Json;
          created_at?: string;
          credit_id?: string | null;
          duration_seconds?: number | null;
          exam_set_id: string;
          finished_at?: string | null;
          flagged_questions?: Json;
          id?: string;
          pass_overall?: boolean;
          pass_tiu?: boolean;
          pass_tkp?: boolean;
          pass_twk?: boolean;
          score_tiu?: number;
          score_tkp?: number;
          score_total?: number;
          score_twk?: number;
          started_at?: string;
          stats?: Json;
          status?: string;
          user_id: string;
        };
        Update: {
          answers?: Json;
          created_at?: string;
          credit_id?: string | null;
          duration_seconds?: number | null;
          exam_set_id?: string;
          finished_at?: string | null;
          flagged_questions?: Json;
          id?: string;
          pass_overall?: boolean;
          pass_tiu?: boolean;
          pass_tkp?: boolean;
          pass_twk?: boolean;
          score_tiu?: number;
          score_tkp?: number;
          score_total?: number;
          score_twk?: number;
          started_at?: string;
          stats?: Json;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tryout_attempts_credit_id_fkey";
            columns: ["credit_id"];
            isOneToOne: false;
            referencedRelation: "tryout_credits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tryout_attempts_exam_set_id_fkey";
            columns: ["exam_set_id"];
            isOneToOne: false;
            referencedRelation: "tryout_exam_sets";
            referencedColumns: ["id"];
          },
        ];
      };
      tryout_credits: {
        Row: {
          activated_at: string | null;
          created_at: string;
          expired_at: string | null;
          id: string;
          package_id: string;
          payment_method: string | null;
          payment_ref: string | null;
          remaining_credits: number;
          status: string;
          total_credits: number;
          used_credits: number;
          user_id: string;
        };
        Insert: {
          activated_at?: string | null;
          created_at?: string;
          expired_at?: string | null;
          id?: string;
          package_id: string;
          payment_method?: string | null;
          payment_ref?: string | null;
          remaining_credits?: number;
          status?: string;
          total_credits?: number;
          used_credits?: number;
          user_id: string;
        };
        Update: {
          activated_at?: string | null;
          created_at?: string;
          expired_at?: string | null;
          id?: string;
          package_id?: string;
          payment_method?: string | null;
          payment_ref?: string | null;
          remaining_credits?: number;
          status?: string;
          total_credits?: number;
          used_credits?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tryout_credits_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "tryout_packages";
            referencedColumns: ["id"];
          },
        ];
      };
      tryout_exam_sets: {
        Row: {
          created_at: string;
          description: string | null;
          duration_minutes: number;
          id: string;
          is_active: boolean;
          is_free_preview: boolean;
          name: string;
          passing_grade_tiu: number;
          passing_grade_tkp: number;
          passing_grade_twk: number;
          slug: string;
          sort_order: number;
          tiu_count: number;
          tkp_count: number;
          total_questions: number;
          twk_count: number;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          duration_minutes?: number;
          id?: string;
          is_active?: boolean;
          is_free_preview?: boolean;
          name: string;
          passing_grade_tiu?: number;
          passing_grade_tkp?: number;
          passing_grade_twk?: number;
          slug: string;
          sort_order?: number;
          tiu_count?: number;
          tkp_count?: number;
          total_questions?: number;
          twk_count?: number;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          duration_minutes?: number;
          id?: string;
          is_active?: boolean;
          is_free_preview?: boolean;
          name?: string;
          passing_grade_tiu?: number;
          passing_grade_tkp?: number;
          passing_grade_twk?: number;
          slug?: string;
          sort_order?: number;
          tiu_count?: number;
          tkp_count?: number;
          total_questions?: number;
          twk_count?: number;
        };
        Relationships: [];
      };
      tryout_packages: {
        Row: {
          created_at: string;
          credits: number;
          description: string | null;
          features: Json;
          has_analytics: boolean;
          has_leaderboard: boolean;
          has_pembahasan: boolean;
          id: string;
          is_active: boolean;
          name: string;
          price: number;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          credits?: number;
          description?: string | null;
          features?: Json;
          has_analytics?: boolean;
          has_leaderboard?: boolean;
          has_pembahasan?: boolean;
          id?: string;
          is_active?: boolean;
          name: string;
          price?: number;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          credits?: number;
          description?: string | null;
          features?: Json;
          has_analytics?: boolean;
          has_leaderboard?: boolean;
          has_pembahasan?: boolean;
          id?: string;
          is_active?: boolean;
          name?: string;
          price?: number;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      tryout_questions: {
        Row: {
          category: string | null;
          correct_answer: string | null;
          created_at: string;
          difficulty: string;
          exam_set_id: string;
          explanation: string | null;
          explanation_image_url: string | null;
          id: string;
          options: Json;
          question_image_url: string | null;
          question_number: number;
          question_text: string;
          scores: Json | null;
          subtest: string;
        };
        Insert: {
          category?: string | null;
          correct_answer?: string | null;
          created_at?: string;
          difficulty?: string;
          exam_set_id: string;
          explanation?: string | null;
          explanation_image_url?: string | null;
          id?: string;
          options: Json;
          question_image_url?: string | null;
          question_number: number;
          question_text: string;
          scores?: Json | null;
          subtest: string;
        };
        Update: {
          category?: string | null;
          correct_answer?: string | null;
          created_at?: string;
          difficulty?: string;
          exam_set_id?: string;
          explanation?: string | null;
          explanation_image_url?: string | null;
          id?: string;
          options?: Json;
          question_image_url?: string | null;
          question_number?: number;
          question_text?: string;
          scores?: Json | null;
          subtest?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tryout_questions_exam_set_id_fkey";
            columns: ["exam_set_id"];
            isOneToOne: false;
            referencedRelation: "tryout_exam_sets";
            referencedColumns: ["id"];
          },
        ];
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
      tryout_leaderboard: {
        Row: {
          attempt_id: string;
          avatar_url: string | null;
          duration_seconds: number | null;
          exam_name: string;
          exam_set_id: string;
          finished_at: string | null;
          full_name: string | null;
          pass_overall: boolean | null;
          ranking: number;
          score_tiu: number | null;
          score_tkp: number | null;
          score_total: number | null;
          score_twk: number | null;
          user_id: string;
        };
        Relationships: [
          {
            foreignKeyName: "tryout_attempts_exam_set_id_fkey";
            columns: ["exam_set_id"];
            isOneToOne: false;
            referencedRelation: "tryout_exam_sets";
            referencedColumns: ["id"];
          },
        ];
      };
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
