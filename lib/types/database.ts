export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: string;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workspaces"]["Insert"]>;
      };
      users: {
        Row: {
          id: string;
          workspace_id: string | null;
          email: string;
          role: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          workspace_id?: string | null;
          email: string;
          role?: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["users"]["Insert"], "id">>;
      };
      integrations: {
        Row: {
          id: string;
          workspace_id: string;
          provider: string;
          access_token_encrypted: string | null;
          refresh_token_encrypted: string | null;
          expires_at: string | null;
          status: string;
          store_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          provider: string;
          access_token_encrypted?: string | null;
          refresh_token_encrypted?: string | null;
          expires_at?: string | null;
          status?: string;
          store_id?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["integrations"]["Insert"]>;
      };
      tn_orders: {
        Row: {
          id: string;
          workspace_id: string;
          external_id: string;
          customer_name: string | null;
          customer_email: string | null;
          total: number;
          status: string | null;
          created_at: string | null;
          synced_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          external_id: string;
          customer_name?: string | null;
          customer_email?: string | null;
          total?: number;
          status?: string | null;
          created_at?: string | null;
          synced_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tn_orders"]["Insert"]>;
      };
      tn_products: {
        Row: {
          id: string;
          workspace_id: string;
          external_id: string;
          name: string;
          stock: number;
          price: number;
          cost: number;
          variants: Json;
          synced_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          external_id: string;
          name: string;
          stock?: number;
          price?: number;
          cost?: number;
          variants?: Json;
          synced_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tn_products"]["Insert"]>;
      };
      tn_customers: {
        Row: {
          id: string;
          workspace_id: string;
          external_id: string;
          name: string | null;
          email: string | null;
          orders_count: number;
          total_spent: number;
          synced_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          external_id: string;
          name?: string | null;
          email?: string | null;
          orders_count?: number;
          total_spent?: number;
          synced_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tn_customers"]["Insert"]>;
      };
      shopify_orders: {
        Row: {
          id: string;
          workspace_id: string;
          external_id: string;
          customer_name: string | null;
          customer_email: string | null;
          total: number;
          status: string | null;
          created_at: string | null;
          synced_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          external_id: string;
          customer_name?: string | null;
          customer_email?: string | null;
          total?: number;
          status?: string | null;
          created_at?: string | null;
          synced_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shopify_orders"]["Insert"]>;
      };
      shopify_products: {
        Row: {
          id: string;
          workspace_id: string;
          external_id: string;
          name: string;
          stock: number;
          price: number;
          cost: number;
          variants: Json;
          synced_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          external_id: string;
          name: string;
          stock?: number;
          price?: number;
          cost?: number;
          variants?: Json;
          synced_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shopify_products"]["Insert"]>;
      };
      shopify_customers: {
        Row: {
          id: string;
          workspace_id: string;
          external_id: string;
          name: string | null;
          email: string | null;
          orders_count: number;
          total_spent: number;
          synced_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          external_id: string;
          name?: string | null;
          email?: string | null;
          orders_count?: number;
          total_spent?: number;
          synced_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shopify_customers"]["Insert"]>;
      };
      financial_config: {
        Row: {
          id: string;
          workspace_id: string;
          usd_rate: number;
          tax_rate: number;
          platform_fee: number;
          agency_fee: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          usd_rate?: number;
          tax_rate?: number;
          platform_fee?: number;
          agency_fee?: number;
        };
        Update: Partial<Database["public"]["Tables"]["financial_config"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          workspace_id: string | null;
          user_id: string | null;
          action: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          workspace_id?: string | null;
          user_id?: string | null;
          action: string;
          metadata?: Json;
        };
        Update: never;
      };
      alerts: {
        Row: {
          id: string;
          workspace_id: string;
          type: string;
          title: string;
          body: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          type: string;
          title: string;
          body?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["alerts"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_workspace_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
