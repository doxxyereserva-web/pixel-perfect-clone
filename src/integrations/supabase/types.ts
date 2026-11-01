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
      api_keys: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          last_used_at: string | null
          name: string
          prefix: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          last_used_at?: string | null
          name: string
          prefix: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          last_used_at?: string | null
          name?: string
          prefix?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          description: string
          id: string
          name: string
        }
        Insert: {
          description: string
          id: string
          name: string
        }
        Update: {
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      creation_scans: {
        Row: {
          created_at: string
          creation_id: string
          findings: Json
          id: string
          owner_id: string
          scanner_version: string
          sha256: string
          status: string
          summary: string
        }
        Insert: {
          created_at?: string
          creation_id: string
          findings?: Json
          id?: string
          owner_id: string
          scanner_version: string
          sha256: string
          status: string
          summary: string
        }
        Update: {
          created_at?: string
          creation_id?: string
          findings?: Json
          id?: string
          owner_id?: string
          scanner_version?: string
          sha256?: string
          status?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "creation_scans_creation_id_fkey"
            columns: ["creation_id"]
            isOneToOne: false
            referencedRelation: "creations"
            referencedColumns: ["id"]
          },
        ]
      }
      creations: {
        Row: {
          created_at: string
          description: string | null
          external_url: string | null
          file_bucket: string
          file_name: string | null
          file_path: string | null
          id: string
          kind: Database["public"]["Enums"]["creation_kind"]
          owner_id: string
          scanned_sha256: string | null
          security_status: string
          security_summary: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_url?: string | null
          file_bucket?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["creation_kind"]
          owner_id: string
          scanned_sha256?: string | null
          security_status?: string
          security_summary?: string
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          created_at?: string
          description?: string | null
          external_url?: string | null
          file_bucket?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["creation_kind"]
          owner_id?: string
          scanned_sha256?: string | null
          security_status?: string
          security_summary?: string
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "creations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_public: boolean
          show_creations: boolean
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_public?: boolean
          show_creations?: boolean
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_public?: boolean
          show_creations?: boolean
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      project_connections: {
        Row: {
          auth_header: string | null
          created_at: string
          id: string
          last_checked_at: string | null
          last_status: string | null
          last_tools: string[]
          name: string
          project_id: string
          secret_encrypted: string | null
          secret_hint: string | null
          updated_at: string
          url: string
        }
        Insert: {
          auth_header?: string | null
          created_at?: string
          id?: string
          last_checked_at?: string | null
          last_status?: string | null
          last_tools?: string[]
          name: string
          project_id: string
          secret_encrypted?: string | null
          secret_hint?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          auth_header?: string | null
          created_at?: string
          id?: string
          last_checked_at?: string | null
          last_status?: string | null
          last_tools?: string[]
          name?: string
          project_id?: string
          secret_encrypted?: string | null
          secret_hint?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_connections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          path: string
          project_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          path: string
          project_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          path?: string
          project_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_skills: {
        Row: {
          content: string
          created_at: string
          description: string
          id: string
          name: string
          project_id: string
          target: Database["public"]["Enums"]["skill_target"]
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          description: string
          id?: string
          name: string
          project_id: string
          target: Database["public"]["Enums"]["skill_target"]
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          project_id?: string
          target?: Database["public"]["Enums"]["skill_target"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_skills_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          guide: string | null
          id: string
          mcp_url: string | null
          models: string[]
          name: string
          owner_id: string
          purpose: string | null
          skill_url: string | null
          updated_at: string
          uses_lovable_api: boolean
          visibility: Database["public"]["Enums"]["visibility"]
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          guide?: string | null
          id?: string
          mcp_url?: string | null
          models?: string[]
          name: string
          owner_id: string
          purpose?: string | null
          skill_url?: string | null
          updated_at?: string
          uses_lovable_api?: boolean
          visibility?: Database["public"]["Enums"]["visibility"]
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          guide?: string | null
          id?: string
          mcp_url?: string | null
          models?: string[]
          name?: string
          owner_id?: string
          purpose?: string | null
          skill_url?: string | null
          updated_at?: string
          uses_lovable_api?: boolean
          visibility?: Database["public"]["Enums"]["visibility"]
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ui_translations: {
        Row: {
          created_at: string
          lang: string
          source: string
          translated: string
        }
        Insert: {
          created_at?: string
          lang: string
          source: string
          translated: string
        }
        Update: {
          created_at?: string
          lang?: string
          source?: string
          translated?: string
        }
        Relationships: []
      }
      user_ai_keys: {
        Row: {
          created_at: string
          id: string
          key_encrypted: string
          key_hint: string
          provider: Database["public"]["Enums"]["ai_provider"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_encrypted: string
          key_hint: string
          provider: Database["public"]["Enums"]["ai_provider"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_encrypted?: string
          key_hint?: string
          provider?: Database["public"]["Enums"]["ai_provider"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_project: {
        Args: { _project: string; _user: string }
        Returns: boolean
      }
      can_view_project: {
        Args: { _project: string; _user: string }
        Returns: boolean
      }
      find_profile_by_username: {
        Args: { _username: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          username: string
        }[]
      }
      is_workspace_admin: {
        Args: { _user: string; _workspace: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user: string; _workspace: string }
        Returns: boolean
      }
      shares_workspace: { Args: { _a: string; _b: string }; Returns: boolean }
      team_workspace: { Args: { _team: string }; Returns: string }
      workspace_role_of: {
        Args: { _user: string; _workspace: string }
        Returns: Database["public"]["Enums"]["workspace_role"]
      }
    }
    Enums: {
      ai_provider: "openai" | "anthropic" | "google" | "openrouter"
      creation_kind: "script" | "vfx" | "model" | "tool" | "resource"
      skill_target: "claude_code" | "codex" | "gemini_cli"
      visibility: "public" | "private"
      workspace_role: "owner" | "admin" | "member" | "viewer"
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
      ai_provider: ["openai", "anthropic", "google", "openrouter"],
      creation_kind: ["script", "vfx", "model", "tool", "resource"],
      skill_target: ["claude_code", "codex", "gemini_cli"],
      visibility: ["public", "private"],
      workspace_role: ["owner", "admin", "member", "viewer"],
    },
  },
} as const
