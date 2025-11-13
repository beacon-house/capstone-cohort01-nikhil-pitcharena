// TypeScript type definitions for Pitch Arena database schema
// Auto-generated types for type-safe database operations

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
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string
          avatar_url: string
          bio: string
          role: 'entrepreneur' | 'reviewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string
          avatar_url?: string
          bio?: string
          role?: 'entrepreneur' | 'reviewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          avatar_url?: string
          bio?: string
          role?: 'entrepreneur' | 'reviewer'
          created_at?: string
          updated_at?: string
        }
      }
      pitches: {
        Row: {
          id: string
          user_id: string
          title: string
          target_audience: string
          pain_point: string
          product_description: string
          elevator_pitch: string
          status: 'draft' | 'published'
          ai_processing_status: 'pending' | 'processing' | 'completed' | 'failed'
          ai_processing_started_at: string | null
          ai_processing_completed_at: string | null
          ai_processing_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          target_audience: string
          pain_point: string
          product_description: string
          elevator_pitch: string
          status?: 'draft' | 'published'
          ai_processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          ai_processing_started_at?: string | null
          ai_processing_completed_at?: string | null
          ai_processing_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          target_audience?: string
          pain_point?: string
          product_description?: string
          elevator_pitch?: string
          status?: 'draft' | 'published'
          ai_processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          ai_processing_started_at?: string | null
          ai_processing_completed_at?: string | null
          ai_processing_error?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_feedback: {
        Row: {
          id: string
          pitch_id: string
          strengths: Json
          weaknesses: Json
          recommendations: Json
          overall_score: number
          created_at: string
        }
        Insert: {
          id?: string
          pitch_id: string
          strengths?: Json
          weaknesses?: Json
          recommendations?: Json
          overall_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          pitch_id?: string
          strengths?: Json
          weaknesses?: Json
          recommendations?: Json
          overall_score?: number
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          pitch_id: string
          user_id: string
          vote_type: 'interesting' | 'needs_work'
          created_at: string
        }
        Insert: {
          id?: string
          pitch_id: string
          user_id: string
          vote_type: 'interesting' | 'needs_work'
          created_at?: string
        }
        Update: {
          id?: string
          pitch_id?: string
          user_id?: string
          vote_type?: 'interesting' | 'needs_work'
          created_at?: string
        }
      }
    }
  }
}
