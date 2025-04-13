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
      companies: {
        Row: {
          id: string
          name: string
          website: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          website?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          website?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      content: {
        Row: {
          id: string
          name: string
          url: string | null
          description: string | null
          category: string
          company_ids: string[]
          search_terms: string[]
          settings: Json
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          url?: string | null
          description?: string | null
          category: string
          company_ids?: string[]
          search_terms?: string[]
          settings?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          url?: string | null
          description?: string | null
          category?: string
          company_ids?: string[]
          search_terms?: string[]
          settings?: Json
          created_at?: string | null
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          company_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      role_content_permissions: {
        Row: {
          id: string
          role_id: string
          content_id: string
          can_view: boolean
          can_edit: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          role_id: string
          content_id: string
          can_view?: boolean
          can_edit?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          role_id?: string
          content_id?: string
          can_view?: boolean
          can_edit?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }
      role_permissions: {
        Row: {
          id: string
          role_id: string
          permission_key: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          role_id: string
          permission_key: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          role_id?: string
          permission_key?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_users: {
        Args: {
          search_query?: string
          company_id?: string
        }
        Returns: {
          id: string
          full_name: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string | null
          updated_at: string | null
        }[]
      }
    }
  }
}