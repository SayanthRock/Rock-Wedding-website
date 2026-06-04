export type EventType = "wedding" | "anniversary" | "birthday" | "corporate" | "gala" | "sangeet" | "other";

export interface Wedding {
  id: string;
  name: string;
  date: string;
  type?: EventType;
  ownerId: string;
  watermarkEnabled: boolean;
  watermarkType?: "text" | "image";
  watermarkText?: string;
  watermarkPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  watermarkOpacity?: number;
  watermarkBg?: string;
  watermarkTextSize?: number;
  watermarkUrl?: string;
  watermarkScale?: number;
  watermarkOffsetX?: number;
  watermarkOffsetY?: number;
  liquidGlassEnabled?: boolean;
  photoBlur?: number;
  coverUrl?: string;
  sharingLimit: "1h" | "2h" | "5h" | "15h" | "1d" | "2d" | "3d" | "unlimited";
}

export interface WeddingTask {
  id: string;
  weddingId: string;
  title: string;
  category: "Venue" | "Catering" | "Decor" | "Entertainment" | "Attire" | "Coordinator" | "Other";
  status: "pending" | "completed";
  dueDate?: string;
}

export interface WeddingGuest {
  id: string;
  weddingId: string;
  name: string;
  rsvp: "attending" | "declined" | "pending";
  phone?: string;
  email?: string;
}

export interface BudgetItem {
  id: string;
  weddingId: string;
  name: string;
  category: "Venue" | "Catering" | "Decor" | "Entertainment" | "Attire" | "Other";
  amount: number;
  paid: boolean;
}

export interface EventVendor {
  id: string;
  weddingId: string;
  name: string;
  category: "Venue" | "Decor" | "Catering" | "Entertainment" | "Photography" | "Makeup" | "Other";
  phone: string;
  contactPerson?: string;
  status: "booked" | "shortlisted";
}
