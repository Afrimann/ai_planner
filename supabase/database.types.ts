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
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          image_url?: string | null;
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
