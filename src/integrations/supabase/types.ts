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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      applicant_profiles: {
        Row: {
          availability: string | null
          availability_list: string[] | null
          created_at: string
          cv_original_filename: string | null
          cv_path: string | null
          english_level: string | null
          experience_level: string | null
          hourly_rate: number
          hours_per_week: number | null
          id: string
          owner_id: string
          role_title: string
          skills: string[] | null
          status: string
          summary: string | null
          time_zones: string[] | null
          updated_at: string
        }
        Insert: {
          availability?: string | null
          availability_list?: string[] | null
          created_at?: string
          cv_original_filename?: string | null
          cv_path?: string | null
          english_level?: string | null
          experience_level?: string | null
          hourly_rate: number
          hours_per_week?: number | null
          id?: string
          owner_id?: string
          role_title: string
          skills?: string[] | null
          status?: string
          summary?: string | null
          time_zones?: string[] | null
          updated_at?: string
        }
        Update: {
          availability?: string | null
          availability_list?: string[] | null
          created_at?: string
          cv_original_filename?: string | null
          cv_path?: string | null
          english_level?: string | null
          experience_level?: string | null
          hourly_rate?: number
          hours_per_week?: number | null
          id?: string
          owner_id?: string
          role_title?: string
          skills?: string[] | null
          status?: string
          summary?: string | null
          time_zones?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicant_profiles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          applicant_id: string
          application_id: string
          client_id: string
          created_at: string
          id: string
          last_message_at: string
        }
        Insert: {
          applicant_id: string
          application_id: string
          client_id: string
          created_at?: string
          id?: string
          last_message_at?: string
        }
        Update: {
          applicant_id?: string
          application_id?: string
          client_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_id: string
          applicant_profile_id: string
          cover_note: string
          created_at: string
          id: string
          job_id: string
          status: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          applicant_profile_id: string
          cover_note?: string
          created_at?: string
          id?: string
          job_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          applicant_profile_id?: string
          cover_note?: string
          created_at?: string
          id?: string
          job_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_applicant_profile_id_fkey"
            columns: ["applicant_profile_id"]
            isOneToOne: false
            referencedRelation: "applicant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      job_posts: {
        Row: {
          created_at: string
          description: string
          employment_type: string | null
          experience_level: string | null
          hourly_rate: number | null
          hours_max: number | null
          hours_min: number | null
          hours_per_week: number | null
          id: string
          must_have_tools: string[] | null
          owner_id: string
          project_duration: string | null
          rate_max: number | null
          rate_min: number | null
          status: string
          time_zones: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          employment_type?: string | null
          experience_level?: string | null
          hourly_rate?: number | null
          hours_max?: number | null
          hours_min?: number | null
          hours_per_week?: number | null
          id?: string
          must_have_tools?: string[] | null
          owner_id?: string
          project_duration?: string | null
          rate_max?: number | null
          rate_min?: number | null
          status?: string
          time_zones?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          employment_type?: string | null
          experience_level?: string | null
          hourly_rate?: number | null
          hours_max?: number | null
          hours_min?: number | null
          hours_per_week?: number | null
          id?: string
          must_have_tools?: string[] | null
          owner_id?: string
          project_duration?: string | null
          rate_max?: number | null
          rate_min?: number | null
          status?: string
          time_zones?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_posts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_views: {
        Row: {
          first_viewed_at: string
          job_id: string
          viewer_id: string
        }
        Insert: {
          first_viewed_at?: string
          job_id: string
          viewer_id: string
        }
        Update: {
          first_viewed_at?: string
          job_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_views_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tool_catalog: {
        Row: {
          created_at: string
          id: string
          is_seeded: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_seeded?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_seeded?: boolean
          name?: string
        }
        Relationships: []
      }
      tool_catalog_usage: {
        Row: {
          client_id: string
          tool_id: string
        }
        Insert: {
          client_id: string
          tool_id: string
        }
        Update: {
          client_id?: string
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_catalog_usage_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_catalog_usage_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tool_catalog"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      apply_to_job: {
        Args: { _job_id: string; _note: string; _profile_id: string }
        Returns: string
      }
      browse_jobs: {
        Args: never
        Returns: {
          created_at: string
          description: string
          employment_type: string
          hours_max: number
          hours_min: number
          id: string
          rate_max: number
          rate_min: number
          title: string
        }[]
      }
      browse_talent: {
        Args: never
        Returns: {
          hourly_rate: number
          id: string
          initials: string
          role_title: string
          updated_at: string
        }[]
      }
      get_open_job: {
        Args: { _id: string }
        Returns: {
          created_at: string
          description: string
          employment_type: string
          experience_level: string
          hours_max: number
          hours_min: number
          id: string
          must_have_tools: string[]
          project_duration: string
          rate_max: number
          rate_min: number
          time_zones: string[]
          title: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      incoming_applications: {
        Args: never
        Returns: {
          applicant_name: string
          cover_note: string
          created_at: string
          hourly_rate: number
          id: string
          job_id: string
          job_title: string
          role_title: string
          status: string
        }[]
      }
      is_participant: {
        Args: { _conv: string; _user: string }
        Returns: boolean
      }
      mark_read: { Args: { _conversation_id: string }; Returns: undefined }
      my_applications: {
        Args: never
        Returns: {
          cover_note: string
          created_at: string
          id: string
          job_id: string
          job_status: string
          job_title: string
          role_title: string
          status: string
        }[]
      }
      my_conversations: {
        Args: never
        Returns: {
          application_id: string
          id: string
          job_title: string
          last_body: string
          last_message_at: string
          last_sender_id: string
          other_name: string
          role_title: string
          unread: number
        }[]
      }
      my_job_stats: {
        Args: never
        Returns: {
          applicants: number
          contacted: number
          created_at: string
          id: string
          pending: number
          rate_max: number
          rate_min: number
          rejected: number
          shortlisted: number
          status: string
          title: string
          views: number
        }[]
      }
      record_job_view: { Args: { _job_id: string }; Returns: undefined }
      set_application_status: {
        Args: { _id: string; _status: string }
        Returns: undefined
      }
      start_conversation: {
        Args: { _application_id: string; _body: string }
        Returns: string
      }
      suggest_tools: {
        Args: { _q: string }
        Returns: {
          name: string
        }[]
      }
      unread_message_count: { Args: never; Returns: number }
      valid_tool_list: { Args: { _t: string[] }; Returns: boolean }
    }
    Enums: {
      app_role: "applicant" | "client" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["applicant", "client", "admin"],
    },
  },
} as const
