export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string;
          title: string;
          body: string;
          caption: string | null;
          image_url: string | null;
          scheduled_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          caption?: string | null;
          image_url?: string | null;
          scheduled_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          caption?: string | null;
          image_url?: string | null;
          scheduled_date?: string | null;
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
