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
      auth_audit_logs: {
        Row: {
          created_at: string
          email: string | null
          event: string
          id: string
          ip: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          event: string
          id?: string
          ip?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          event?: string
          id?: string
          ip?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      diplomas: {
        Row: {
          annee_academique: string | null
          created_at: string
          date_delivrance: string
          date_naissance: string | null
          date_obtention: string
          etablissement: string
          id: string
          is_valid: boolean
          mention: string | null
          nom_complet: string
          nom_diplome: string
          numero_diplome: string
          option: string | null
          pdf_url: string | null
          photo_url: string | null
          program_id: string | null
          qr_code: string | null
          student_id: string | null
          updated_at: string
        }
        Insert: {
          annee_academique?: string | null
          created_at?: string
          date_delivrance?: string
          date_naissance?: string | null
          date_obtention: string
          etablissement?: string
          id?: string
          is_valid?: boolean
          mention?: string | null
          nom_complet: string
          nom_diplome: string
          numero_diplome: string
          option?: string | null
          pdf_url?: string | null
          photo_url?: string | null
          program_id?: string | null
          qr_code?: string | null
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          annee_academique?: string | null
          created_at?: string
          date_delivrance?: string
          date_naissance?: string | null
          date_obtention?: string
          etablissement?: string
          id?: string
          is_valid?: boolean
          mention?: string | null
          nom_complet?: string
          nom_diplome?: string
          numero_diplome?: string
          option?: string | null
          pdf_url?: string | null
          photo_url?: string | null
          program_id?: string | null
          qr_code?: string | null
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diplomas_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diplomas_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          code: string
          created_at: string
          description: string | null
          duree_annees: number | null
          id: string
          niveau: string | null
          nom_filiere: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          duree_annees?: number | null
          id?: string
          niveau?: string | null
          nom_filiere: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          duree_annees?: number | null
          id?: string
          niveau?: string | null
          nom_filiere?: string
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          annee_inscription: number | null
          created_at: string
          date_naissance: string | null
          email: string | null
          genre: string | null
          id: string
          lieu_naissance: string | null
          matricule: string
          nom: string
          photo_url: string | null
          prenom: string
          program_id: string | null
          statut: string | null
          telephone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          annee_inscription?: number | null
          created_at?: string
          date_naissance?: string | null
          email?: string | null
          genre?: string | null
          id?: string
          lieu_naissance?: string | null
          matricule: string
          nom: string
          photo_url?: string | null
          prenom: string
          program_id?: string | null
          statut?: string | null
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          annee_inscription?: number | null
          created_at?: string
          date_naissance?: string | null
          email?: string | null
          genre?: string | null
          id?: string
          lieu_naissance?: string | null
          matricule?: string
          nom?: string
          photo_url?: string | null
          prenom?: string
          program_id?: string | null
          statut?: string | null
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          grade: string | null
          id: string
          matiere: string | null
          matricule: string | null
          nom: string
          photo_url: string | null
          prenom: string
          telephone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          grade?: string | null
          id?: string
          matiere?: string | null
          matricule?: string | null
          nom: string
          photo_url?: string | null
          prenom: string
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          grade?: string | null
          id?: string
          matiere?: string | null
          matricule?: string | null
          nom?: string
          photo_url?: string | null
          prenom?: string
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
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
      verification_logs: {
        Row: {
          date_verification: string
          id: string
          ip: string | null
          numero_diplome: string
          success: boolean
          user_agent: string | null
        }
        Insert: {
          date_verification?: string
          id?: string
          ip?: string | null
          numero_diplome: string
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          date_verification?: string
          id?: string
          ip?: string | null
          numero_diplome?: string
          success?: boolean
          user_agent?: string | null
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
      is_admin_level: { Args: { _user_id: string }; Returns: boolean }
      verify_diploma: {
        Args: { p_numero: string }
        Returns: {
          annee_academique: string
          date_delivrance: string
          date_naissance: string
          date_obtention: string
          etablissement: string
          mention: string
          nom_complet: string
          nom_diplome: string
          numero_diplome: string
          option: string
          photo_url: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "scolarite"
        | "verificateur"
        | "teacher"
        | "student"
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
      app_role: [
        "super_admin",
        "admin",
        "scolarite",
        "verificateur",
        "teacher",
        "student",
      ],
    },
  },
} as const
