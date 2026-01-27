export interface Database {
  public: {
    Tables: {
      polls: {
        Row: {
          id: string;
          title: string;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      options: {
        Row: {
          id: string;
          poll_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          poll_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          poll_id: string;
          option_id: string;
          voter_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          option_id: string;
          voter_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          poll_id?: string;
          option_id?: string;
          voter_name?: string | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
    };
  };
}

export type Poll = Database['public']['Tables']['polls']['Row'];
export type Option = Database['public']['Tables']['options']['Row'];
export type Vote = Database['public']['Tables']['votes']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
