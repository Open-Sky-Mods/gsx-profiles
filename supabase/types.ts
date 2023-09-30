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
      contributors: {
        Row: {
          author: boolean
          name: string
          profileSlug: string
        }
        Insert: {
          author?: boolean
          name: string
          profileSlug: string
        }
        Update: {
          author?: boolean
          name?: string
          profileSlug?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributors_profileSlug_fkey"
            columns: ["profileSlug"]
            referencedRelation: "profiles"
            referencedColumns: ["slug"]
          }
        ]
      }
      files: {
        Row: {
          name: string
          profileSlug: string
          profileVariant: string
        }
        Insert: {
          name: string
          profileSlug: string
          profileVariant: string
        }
        Update: {
          name?: string
          profileSlug?: string
          profileVariant?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_profileSlug_fkey"
            columns: ["profileSlug"]
            referencedRelation: "profiles"
            referencedColumns: ["slug"]
          }
        ]
      }
      profiles: {
        Row: {
          airport: string
          airportCreator: string
          created_at: string
          description: string | null
          requiresAirportVersion: string | null
          slug: string
          updated_at: string
          version: string
        }
        Insert: {
          airport: string
          airportCreator: string
          created_at?: string
          description?: string | null
          requiresAirportVersion?: string | null
          slug: string
          updated_at?: string
          version: string
        }
        Update: {
          airport?: string
          airportCreator?: string
          created_at?: string
          description?: string | null
          requiresAirportVersion?: string | null
          slug?: string
          updated_at?: string
          version?: string
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
