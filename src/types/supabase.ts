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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
  public: {
    Tables: {
      change_requests: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          client_approval_at: string | null
          created_at: string | null
          description: string
          extra_cost: number | null
          final_deliverables: string | null
          id: string
          included_revisions: string | null
          is_in_scope: boolean | null
          is_within_scope: boolean | null
          not_included: string | null
          project_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          client_approval_at?: string | null
          created_at?: string | null
          description: string
          extra_cost?: number | null
          final_deliverables?: string | null
          id?: string
          included_revisions?: string | null
          is_in_scope?: boolean | null
          is_within_scope?: boolean | null
          not_included?: string | null
          project_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          client_approval_at?: string | null
          created_at?: string | null
          description?: string
          extra_cost?: number | null
          final_deliverables?: string | null
          id?: string
          included_revisions?: string | null
          is_in_scope?: boolean | null
          is_within_scope?: boolean | null
          not_included?: string | null
          project_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company: string | null
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          subject: string
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          subject: string
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_paid: number | null
          client_id: string | null
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          invoice_url: string | null
          issue_date: string | null
          items: Json | null
          notes: string | null
          receipt_url: string | null
          status: string | null
          total_amount: number | null
        }
        Insert: {
          amount_paid?: number | null
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          issue_date?: string | null
          items?: Json | null
          notes?: string | null
          receipt_url?: string | null
          status?: string | null
          total_amount?: number | null
        }
        Update: {
          amount_paid?: number | null
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          issue_date?: string | null
          items?: Json | null
          notes?: string | null
          receipt_url?: string | null
          status?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string
          created_by: string | null
          drop_comment: string | null
          drop_reason: string | null
          drop_stage: string | null
          email: string
          id: string
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          priority: string | null
          source: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          drop_comment?: string | null
          drop_reason?: string | null
          drop_stage?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          drop_comment?: string | null
          drop_reason?: string | null
          drop_stage?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          category: string
          client: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          published: boolean | null
          tags: string[] | null
          title: string
        }
        Insert: {
          category: string
          client?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          published?: boolean | null
          tags?: string[] | null
          title: string
        }
        Update: {
          category?: string
          client?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          published?: boolean | null
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          full_name: string | null
          avatar_url: string | null
          role: string | null
          status: string | null
          phone: string | null
          welcome_sent: boolean
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          status?: string | null
          phone?: string | null
          welcome_sent?: boolean
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          status?: string | null
          phone?: string | null
          welcome_sent?: boolean
        }
        Relationships: []
      }
      project_scopes: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          deliverables: Json | null
          exclusions: Json | null
          id: string
          project_id: string | null
          revisions_included: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          deliverables?: Json | null
          exclusions?: Json | null
          id?: string
          project_id?: string | null
          revisions_included?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          deliverables?: Json | null
          exclusions?: Json | null
          id?: string
          project_id?: string | null
          revisions_included?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_scopes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          client_feedback: string | null
          client_feedback_at: string | null
          client_status: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          project_id: string | null
          title: string
        }
        Insert: {
          client_feedback?: string | null
          client_feedback_at?: string | null
          client_status?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          project_id?: string | null
          title: string
        }
        Update: {
          client_feedback?: string | null
          client_feedback_at?: string | null
          client_status?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          project_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          categories: string[] | null
          category: string | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          domain_url: string | null
          due_date: string | null
          id: string
          image_url: string | null
          notes: string | null
          priority: string | null
          published: boolean | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          title: string
          upcoming_work: string | null
        }
        Insert: {
          budget?: number | null
          categories?: string[] | null
          category?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          domain_url?: string | null
          due_date?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          priority?: string | null
          published?: boolean | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          upcoming_work?: string | null
        }
        Update: {
          budget?: number | null
          categories?: string[] | null
          category?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          domain_url?: string | null
          due_date?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          priority?: string | null
          published?: boolean | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          upcoming_work?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          color: string | null
          created_at: string | null
          description: string
          icon: string | null
          id: string
          order: number | null
          title: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description: string
          icon?: string | null
          id?: string
          order?: number | null
          title: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string
          icon?: string | null
          id?: string
          order?: number | null
          title?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          description: string | null
          key: string
          title: string | null
          value: string | null
        }
        Insert: {
          description?: string | null
          key: string
          title?: string | null
          value?: string | null
        }
        Update: {
          description?: string | null
          key?: string
          title?: string | null
          value?: string | null
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string | null
          device_type: string | null
          id: string
          page_path: string
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          page_path: string
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          page_path?: string
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

