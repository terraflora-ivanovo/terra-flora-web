export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrderStatus = "new" | "in_progress" | "done" | "cancelled";

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          slug: string;
          name: string;
          city: string;
          phone: string;
          address: string;
          tagline: string;
          about: string;
          hero_image_path: string | null;
          steps: Json;
          brand: Json;
          owner_user_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tenants"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: Omit<Database["public"]["Tables"]["categories"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          tenant_id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string;
          price_rub: number;
          image_path: string | null;
          is_custom: boolean;
          in_stock: boolean;
          is_published: boolean;
          is_popular: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["products"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      product_tags: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          slug: string;
        };
        Insert: Omit<Database["public"]["Tables"]["product_tags"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["product_tags"]["Insert"]>;
      };
      product_tag_map: {
        Row: {
          tenant_id: string;
          product_id: string;
          tag_id: string;
        };
        Insert: Database["public"]["Tables"]["product_tag_map"]["Row"];
        Update: Partial<Database["public"]["Tables"]["product_tag_map"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          tenant_id: string;
          customer_name: string;
          customer_phone: string;
          comment: string | null;
          status: OrderStatus;
          is_custom_request: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "created_at" | "status"> & {
          id?: string;
          created_at?: string;
          status?: OrderStatus;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          tenant_id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          unit_price_rub: number;
          qty: number;
        };
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      push_subscriptions: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["push_subscriptions"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_tenant_owner: {
        Args: { p_tenant_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
};

export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type ProductTag = Database["public"]["Tables"]["product_tags"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

export type StorefrontProduct = Product & {
  tags: Pick<ProductTag, "id" | "name" | "slug">[];
};
