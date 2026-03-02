export interface Database {
  public: {
    Tables: {
      ai_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          input_text: string;
          output_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          input_text: string;
          output_text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      post_platform: "instagram" | "linkedin" | "twitter";
      post_status: "draft" | "planned" | "posted";
    };
    CompositeTypes: Record<string, never>;
  };
}
