export interface Category {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  color: string | null;
  slug: string;
  icon: string | null;
  create_at: string | null;
}