export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      daily_xp_tracker: {
        Row: {
          date: string
          last_updated: string | null
          user_id: string
          workout_count: number | null
        }
        Insert: {
          date: string
          last_updated?: string | null
          user_id: string
          workout_count?: number | null
        }
        Update: {
          date?: string
          last_updated?: string | null
          user_id?: string
          workout_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_xp_tracker_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      category_progress: {
        Row: {
          id: string
          user_id: string
          name: string
          xp: number
          level: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          xp?: number
          level?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          xp?: number
          level?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      template_components: {
        Row: {
          created_at: string | null
          id: string
          is_sparring: boolean | null
          order_index: number
          technique_key: string
          template_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_sparring?: boolean | null
          order_index: number
          technique_key: string
          template_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_sparring?: boolean | null
          order_index?: number
          technique_key?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_components_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      user_progress: {
        Row: {
          body_part: string
          level: number | null
          updated_at: string | null
          user_id: string
          xp: number | null
        }
        Insert: {
          body_part: string
          level?: number | null
          updated_at?: string | null
          user_id: string
          xp?: number | null
        }
        Update: {
          body_part?: string
          level?: number | null
          updated_at?: string | null
          user_id?: string
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string;
          email: string;
          stance: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          stance: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          stance?: string;
          created_at?: string;
        };
      }
      workout_logs: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          id: string
          is_sparring: boolean | null
          order_index: number
          reps: number | null
          sparring_intensity: string | null
          technique_key: string
          workout_id: string | null
          xp_earned: number | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_sparring?: boolean | null
          order_index: number
          reps?: number | null
          sparring_intensity?: string | null
          technique_key: string
          workout_id?: string | null
          xp_earned?: number | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_sparring?: boolean | null
          order_index?: number
          reps?: number | null
          sparring_intensity?: string | null
          technique_key?: string
          workout_id?: string | null
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          }
        ]
      }
      workout_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workouts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          completed_at: string | null;
          total_xp: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
          completed_at?: string | null;
          total_xp?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
          completed_at?: string | null;
          total_xp?: number;
        };
      }
      user_levels: {
        Row: {
          user_id: string;
          punches_level: number;
          punches_xp: number;
          kicks_level: number;
          kicks_xp: number;
          elbows_level: number;
          elbows_xp: number;
          knees_level: number;
          knees_xp: number;
          footwork_level: number;
          footwork_xp: number;
          clinch_level: number;
          clinch_xp: number;
          defensive_level: number;
          defensive_xp: number;
          sweeps_level: number;
          sweeps_xp: number;
          feints_level: number;
          feints_xp: number;
        };
        Insert: {
          user_id: string;
          punches_level?: number;
          punches_xp?: number;
          kicks_level?: number;
          kicks_xp?: number;
          elbows_level?: number;
          elbows_xp?: number;
          knees_level?: number;
          knees_xp?: number;
          footwork_level?: number;
          footwork_xp?: number;
          clinch_level?: number;
          clinch_xp?: number;
          defensive_level?: number;
          defensive_xp?: number;
          sweeps_level?: number;
          sweeps_xp?: number;
          feints_level?: number;
          feints_xp?: number;
        };
        Update: {
          user_id?: string;
          punches_level?: number;
          punches_xp?: number;
          kicks_level?: number;
          kicks_xp?: number;
          elbows_level?: number;
          elbows_xp?: number;
          knees_level?: number;
          knees_xp?: number;
          footwork_level?: number;
          footwork_xp?: number;
          clinch_level?: number;
          clinch_xp?: number;
          defensive_level?: number;
          defensive_xp?: number;
          sweeps_level?: number;
          sweeps_xp?: number;
          feints_level?: number;
          feints_xp?: number;
        };
      }
      workout_combos: {
        Row: {
          id: string;
          workout_id: string;
          sequence_number: number;
          training_type: string;
          training_mode: string;
          sets: number | null;
          reps: number | null;
          duration_minutes: number | null;
          duration_seconds: number | null;
          rounds: number | null;
          round_minutes: number | null;
          round_seconds: number | null;
          techniques: string[] | null;
          xp: number;
          completed: boolean;
          distance: number | null;
          distance_unit: string | null;
        };
        Insert: {
          id?: string;
          workout_id: string;
          sequence_number: number;
          training_type: string;
          training_mode: string;
          sets?: number | null;
          reps?: number | null;
          duration_minutes?: number | null;
          duration_seconds?: number | null;
          rounds?: number | null;
          round_minutes?: number | null;
          round_seconds?: number | null;
          techniques?: string[] | null;
          xp?: number;
          completed?: boolean;
          distance?: number | null;
          distance_unit?: string | null;
        };
        Update: {
          id?: string;
          workout_id?: string;
          sequence_number?: number;
          training_type?: string;
          training_mode?: string;
          sets?: number | null;
          reps?: number | null;
          duration_minutes?: number | null;
          duration_seconds?: number | null;
          rounds?: number | null;
          round_minutes?: number | null;
          round_seconds?: number | null;
          techniques?: string[] | null;
          xp?: number;
          completed?: boolean;
          distance?: number | null;
          distance_unit?: string | null;
        };
      }
      xp_history: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          xp_gained: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          xp_gained: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          xp_gained?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "xp_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status: 'active' | 'inactive' | 'canceled' | 'trial'
          product_id: string
          created_at: string
          updated_at: string
          valid_until: string | null
          trial_end_date: string | null
        }
        Insert: {
          id?: string
          user_id: string
          status: 'active' | 'inactive' | 'canceled' | 'trial'
          product_id: string
          created_at?: string
          updated_at?: string
          valid_until?: string | null
          trial_end_date?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'active' | 'inactive' | 'canceled' | 'trial'
          product_id?: string
          created_at?: string
          updated_at?: string
          valid_until?: string | null
          trial_end_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
