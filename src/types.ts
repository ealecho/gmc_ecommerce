export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number | null;
  image: string;
  isNew: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'customer';
}
