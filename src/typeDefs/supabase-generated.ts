export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      audit_logs: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type_enum"]
          id: string
          new_value: Json | null
          object_type: Database["public"]["Enums"]["object_type_enum"]
          old_value: Json | null
          schema_version: Database["public"]["Enums"]["schema_version_enum"]
          updated_by: string
          updated_date: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type_enum"]
          id?: string
          new_value?: Json | null
          object_type: Database["public"]["Enums"]["object_type_enum"]
          old_value?: Json | null
          schema_version: Database["public"]["Enums"]["schema_version_enum"]
          updated_by: string
          updated_date?: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type_enum"]
          id?: string
          new_value?: Json | null
          object_type?: Database["public"]["Enums"]["object_type_enum"]
          old_value?: Json | null
          schema_version?: Database["public"]["Enums"]["schema_version_enum"]
          updated_by?: string
          updated_date?: string
        }
        Relationships: []
      }
      facilities: {
        Row: {
          code: string | null
          contact: Json
          createdDate: string
          firestore_id: string | null
          id: string
          mapLatitude: number
          mapLongitude: number
          nameEn: string
          nameJa: string
          updatedDate: string
        }
        Insert: {
          code?: string | null
          contact: Json
          createdDate: string
          firestore_id?: string | null
          id?: string
          mapLatitude: number
          mapLongitude: number
          nameEn: string
          nameJa: string
          updatedDate: string
        }
        Update: {
          code?: string | null
          contact?: Json
          createdDate?: string
          firestore_id?: string | null
          id?: string
          mapLatitude?: number
          mapLongitude?: number
          nameEn?: string
          nameJa?: string
          updatedDate?: string
        }
        Relationships: []
      }
      hps: {
        Row: {
          acceptedInsurance: Json
          additionalInfoForPatients: string | null
          createdDate: string | null
          degrees: Json
          email: string | null
          firestore_id: string | null
          id: string
          names: Json
          specialties: Json
          spokenLanguages: Json
          updatedDate: string | null
        }
        Insert: {
          acceptedInsurance: Json
          additionalInfoForPatients?: string | null
          createdDate?: string | null
          degrees: Json
          email?: string | null
          firestore_id?: string | null
          id?: string
          names: Json
          specialties: Json
          spokenLanguages: Json
          updatedDate?: string | null
        }
        Update: {
          acceptedInsurance?: Json
          additionalInfoForPatients?: string | null
          createdDate?: string | null
          degrees?: Json
          email?: string | null
          firestore_id?: string | null
          id?: string
          names?: Json
          specialties?: Json
          spokenLanguages?: Json
          updatedDate?: string | null
        }
        Relationships: []
      }
      hps_facilities: {
        Row: {
          facilities_id: string
          hps_id: string
        }
        Insert: {
          facilities_id?: string
          hps_id?: string
        }
        Update: {
          facilities_id?: string
          hps_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hps_facilities_facilities_id_fkey"
            columns: ["facilities_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hps_facilities_hps_id_fkey"
            columns: ["hps_id"]
            isOneToOne: false
            referencedRelation: "hps"
            referencedColumns: ["id"]
          },
        ]
      }
      Reservation: {
        Row: {
          created_at: string
          id: string
          meeting_link: string | null
          slot_id: string | null
          status: Database["public"]["Enums"]["action_type_enum"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_link?: string | null
          slot_id?: string | null
          status?: Database["public"]["Enums"]["action_type_enum"] | null
          updated_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_link?: string | null
          slot_id?: string | null
          status?: Database["public"]["Enums"]["action_type_enum"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Reservation_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "ReservationSlot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Reservation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      ReservationSlot: {
        Row: {
          created_at: string
          end_time: string | null
          facility_id: string | null
          hp_id: string | null
          id: string
          is_booked: boolean | null
          start_time: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          facility_id?: string | null
          hp_id?: string | null
          id?: string
          is_booked?: boolean | null
          start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          end_time?: string | null
          facility_id?: string | null
          hp_id?: string | null
          id?: string
          is_booked?: boolean | null
          start_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ReservationSlot_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ReservationSlot_hp_id_fkey"
            columns: ["hp_id"]
            isOneToOne: false
            referencedRelation: "hps"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          autofillPlaceFromSubmissionUrl: boolean
          createdDate: string | null
          facilities_id: string | null
          facility_partial: Json | null
          firestore_id: string | null
          googleMapsUrl: string | null
          healthcare_professionals_partial: Json | null
          healthcareProfessionalName: string | null
          hps_id: string | null
          id: string
          notes: string | null
          spokenLanguages: Json | null
          status: string
          updatedDate: string | null
        }
        Insert: {
          autofillPlaceFromSubmissionUrl?: boolean
          createdDate?: string | null
          facilities_id?: string | null
          facility_partial?: Json | null
          firestore_id?: string | null
          googleMapsUrl?: string | null
          healthcare_professionals_partial?: Json | null
          healthcareProfessionalName?: string | null
          hps_id?: string | null
          id?: string
          notes?: string | null
          spokenLanguages?: Json | null
          status: string
          updatedDate?: string | null
        }
        Update: {
          autofillPlaceFromSubmissionUrl?: boolean
          createdDate?: string | null
          facilities_id?: string | null
          facility_partial?: Json | null
          firestore_id?: string | null
          googleMapsUrl?: string | null
          healthcare_professionals_partial?: Json | null
          healthcareProfessionalName?: string | null
          hps_id?: string | null
          id?: string
          notes?: string | null
          spokenLanguages?: Json | null
          status?: string
          updatedDate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_facilities_id_fkey"
            columns: ["facilities_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_hps_id_fkey"
            columns: ["hps_id"]
            isOneToOne: false
            referencedRelation: "hps"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          created_date: string
          display_name: string | null
          id: string
          profile_pic_url: string | null
          updated_date: string | null
        }
        Insert: {
          created_date?: string
          display_name?: string | null
          id?: string
          profile_pic_url?: string | null
          updated_date?: string | null
        }
        Update: {
          created_date?: string
          display_name?: string | null
          id?: string
          profile_pic_url?: string | null
          updated_date?: string | null
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
      action_type_enum: "CREATE" | "UPDATE" | "DELETE"
      object_type_enum: "Facility" | "HealthcareProfessional" | "Submission"
      schema_version_enum: "V1"
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
    Enums: {
      action_type_enum: ["CREATE", "UPDATE", "DELETE"],
      object_type_enum: ["Facility", "HealthcareProfessional", "Submission"],
      schema_version_enum: ["V1"],
    },
  },
} as const

