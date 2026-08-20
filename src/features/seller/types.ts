export interface SellerEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  category: string;
  sellerId: string;
  sellerName: string;
  status: string;
  passes: SellerPassType[];
  createdAt: string;
}

export interface SellerPassType {
  id: string;
  name: string;
  price: number;
  benefits: string;
  available: number;
  sold: number;
  transferAllowed: boolean;
}

export interface CreateEventInput {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  category: string;
  sellerId: string;
  sellerName: string;
  passes: { name: string; price: number; benefits: string; available: number; transferAllowed: boolean }[];
}
