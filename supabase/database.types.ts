export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string;
          user_id: string;
          platform: "instagram" | "linkedin" | "twitter";
          title: string | null;
          caption: string;
          image_url: string | null;
          status: "draft" | "planned" | "posted";
          scheduled_date: string | null;
          scheduled_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: "instagram" | "linkedin" | "twitter";
          title?: string | null;
          caption: string;
          image_url?: string | null;
          status?: "draft" | "planned" | "posted";
          scheduled_date?: string | null;
          scheduled_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          platform?: "instagram" | "linkedin" | "twitter";
          title?: string | null;
          caption?: string;
          image_url?: string | null;
          status?: "draft" | "planned" | "posted";
          scheduled_date?: string | null;
          scheduled_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
