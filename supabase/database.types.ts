export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      ai_logs: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string | null;
          action: string;
          input_text: string;
          output_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id?: string | null;
          action: string;
          input_text: string;
          output_text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workspace_id?: string | null;
          action?: string;
          input_text?: string;
          output_text?: string;
          created_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          title: string;
          body: string;
          caption: string;
          user_id: string;
          workspace_id: string | null;
          platform: Database["public"]["Enums"]["post_platform"];
          status: Database["public"]["Enums"]["post_status"];
          scheduled_date: string | null;
          scheduled_time: string | null;
          image_url: string | null;
          created_at: string;
          updated_at: string;
          published: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          caption?: string;
          user_id: string;
          workspace_id?: string | null;
          platform?: Database["public"]["Enums"]["post_platform"];
          status?: Database["public"]["Enums"]["post_status"];
          scheduled_date?: string | null;
          scheduled_time?: string | null;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
          published?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          caption?: string;
          user_id?: string;
          workspace_id?: string | null;
          platform?: Database["public"]["Enums"]["post_platform"];
          status?: Database["public"]["Enums"]["post_status"];
          scheduled_date?: string | null;
          scheduled_time?: string | null;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
          published?: boolean;
        };
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          created_at?: string;
        };
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string | null;
          email: string;
          role: Database["public"]["Enums"]["workspace_member_role"];
          status: Database["public"]["Enums"]["workspace_member_status"];
          invited_by: string;
          invited_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id?: string | null;
          email: string;
          role?: Database["public"]["Enums"]["workspace_member_role"];
          status?: Database["public"]["Enums"]["workspace_member_status"];
          invited_by: string;
          invited_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string | null;
          email?: string;
          role?: Database["public"]["Enums"]["workspace_member_role"];
          status?: Database["public"]["Enums"]["workspace_member_status"];
          invited_by?: string;
          invited_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          type: string;
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          type: string;
          created_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          title?: string;
          type?: string;
          created_at?: string;
          created_by?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          actor_id: string;
          workspace_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          workspace_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string;
          workspace_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      post_platform: "instagram" | "linkedin" | "twitter";
      post_status: "draft" | "planned" | "posted";
      workspace_member_role: "owner" | "admin" | "member";
      workspace_member_status: "pending" | "active";
    };
    CompositeTypes: Record<string, never>;
  };
}
