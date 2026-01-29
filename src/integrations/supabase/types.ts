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
      activity_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_payload: Json | null
          event_type: string
          id: string
          request_id: string | null
          workspace_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_payload?: Json | null
          event_type: string
          id?: string
          request_id?: string | null
          workspace_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_payload?: Json | null
          event_type?: string
          id?: string
          request_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          request_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_id: string
        }
        Update: {
          created_at?: string
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          category: Database["public"]["Enums"]["file_category"]
          created_at: string
          filename: string
          id: string
          request_id: string
          storage_url: string
          uploader_user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["file_category"]
          created_at?: string
          filename: string
          id?: string
          request_id: string
          storage_url: string
          uploader_user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["file_category"]
          created_at?: string
          filename?: string
          id?: string
          request_id?: string
          storage_url?: string
          uploader_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
          sender_user_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_user_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_user_id?: string
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
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      providers: {
        Row: {
          capabilities: string[] | null
          created_at: string
          description: string | null
          id: string
          name: string
          notes_internal: string | null
          regions: string[] | null
          typical_budget_band: Database["public"]["Enums"]["budget_band"] | null
          website: string | null
        }
        Insert: {
          capabilities?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          notes_internal?: string | null
          regions?: string[] | null
          typical_budget_band?:
            | Database["public"]["Enums"]["budget_band"]
            | null
          website?: string | null
        }
        Update: {
          capabilities?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          notes_internal?: string | null
          regions?: string[] | null
          typical_budget_band?:
            | Database["public"]["Enums"]["budget_band"]
            | null
          website?: string | null
        }
        Relationships: []
      }
      request_versions: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          id: string
          locked: boolean | null
          request_id: string
          summary_snapshot: Json | null
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          locked?: boolean | null
          request_id: string
          summary_snapshot?: Json | null
          version_number: number
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          locked?: boolean | null
          request_id?: string
          summary_snapshot?: Json | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "request_versions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          budget_band: Database["public"]["Enums"]["budget_band"] | null
          context: string | null
          created_at: string
          desired_outcome: string | null
          id: string
          owner_user_id: string | null
          sensitivity: Database["public"]["Enums"]["sensitivity_level"] | null
          status: Database["public"]["Enums"]["request_status"]
          timeline_urgency:
            | Database["public"]["Enums"]["timeline_urgency"]
            | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          budget_band?: Database["public"]["Enums"]["budget_band"] | null
          context?: string | null
          created_at?: string
          desired_outcome?: string | null
          id?: string
          owner_user_id?: string | null
          sensitivity?: Database["public"]["Enums"]["sensitivity_level"] | null
          status?: Database["public"]["Enums"]["request_status"]
          timeline_urgency?:
            | Database["public"]["Enums"]["timeline_urgency"]
            | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          budget_band?: Database["public"]["Enums"]["budget_band"] | null
          context?: string | null
          created_at?: string
          desired_outcome?: string | null
          id?: string
          owner_user_id?: string | null
          sensitivity?: Database["public"]["Enums"]["sensitivity_level"] | null
          status?: Database["public"]["Enums"]["request_status"]
          timeline_urgency?:
            | Database["public"]["Enums"]["timeline_urgency"]
            | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlist_entries: {
        Row: {
          created_at: string
          est_cost_band: Database["public"]["Enums"]["budget_band"] | null
          fit_notes: string | null
          id: string
          provider_id: string
          request_id: string
          status: Database["public"]["Enums"]["shortlist_status"]
        }
        Insert: {
          created_at?: string
          est_cost_band?: Database["public"]["Enums"]["budget_band"] | null
          fit_notes?: string | null
          id?: string
          provider_id: string
          request_id: string
          status?: Database["public"]["Enums"]["shortlist_status"]
        }
        Update: {
          created_at?: string
          est_cost_band?: Database["public"]["Enums"]["budget_band"] | null
          fit_notes?: string | null
          id?: string
          provider_id?: string
          request_id?: string
          status?: Database["public"]["Enums"]["shortlist_status"]
        }
        Relationships: [
          {
            foreignKeyName: "shortlist_entries_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlist_entries_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlist_entries_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      providers_public: {
        Row: {
          capabilities: string[] | null
          created_at: string | null
          description: string | null
          id: string | null
          name: string | null
          regions: string[] | null
          typical_budget_band: Database["public"]["Enums"]["budget_band"] | null
          website: string | null
        }
        Insert: {
          capabilities?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          regions?: string[] | null
          typical_budget_band?:
            | Database["public"]["Enums"]["budget_band"]
            | null
          website?: string | null
        }
        Update: {
          capabilities?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          regions?: string[] | null
          typical_budget_band?:
            | Database["public"]["Enums"]["budget_band"]
            | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_workspace_role: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_workspace_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
          _workspace_id: string
        }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "ops" | "client"
      budget_band:
        | "Under $10K"
        | "$10K-$50K"
        | "$50K-$150K"
        | "$150K-$500K"
        | "Over $500K"
      file_category: "Brief" | "Security" | "SOW" | "Other"
      request_status:
        | "Draft"
        | "Submitted"
        | "Scoping"
        | "Shortlisting"
        | "In Execution"
        | "Delivered"
        | "Closed"
      sensitivity_level: "Standard" | "Confidential" | "Highly Confidential"
      shortlist_status:
        | "Proposed"
        | "Contacted"
        | "Interested"
        | "Declined"
        | "Selected"
      timeline_urgency:
        | "Immediate"
        | "Within 2 weeks"
        | "Within 1 month"
        | "Within 3 months"
        | "Flexible"
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
      app_role: ["admin", "ops", "client"],
      budget_band: [
        "Under $10K",
        "$10K-$50K",
        "$50K-$150K",
        "$150K-$500K",
        "Over $500K",
      ],
      file_category: ["Brief", "Security", "SOW", "Other"],
      request_status: [
        "Draft",
        "Submitted",
        "Scoping",
        "Shortlisting",
        "In Execution",
        "Delivered",
        "Closed",
      ],
      sensitivity_level: ["Standard", "Confidential", "Highly Confidential"],
      shortlist_status: [
        "Proposed",
        "Contacted",
        "Interested",
        "Declined",
        "Selected",
      ],
      timeline_urgency: [
        "Immediate",
        "Within 2 weeks",
        "Within 1 month",
        "Within 3 months",
        "Flexible",
      ],
    },
  },
} as const
