import { Wedding, WeddingTask, WeddingGuest, BudgetItem, EventVendor } from "../types/premium";

export const MOCK_WEDDINGS: Wedding[] = [
  {
    id: "sangeet-night",
    name: "Sangeet Night",
    date: "2025-05-24",
    type: "sangeet" as any,
    ownerId: "mock-owner",
    coverUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200",
    watermarkEnabled: true,
    watermarkText: "Sangeet Purity",
    watermarkPosition: "center",
    watermarkOpacity: 0.45,
    sharingLimit: "unlimited",
    liquidGlassEnabled: true,
    photoBlur: 10
  },
  {
    id: "wedding-ceremony",
    name: "Wedding Ceremony",
    date: "2025-05-25",
    type: "wedding",
    ownerId: "mock-owner",
    coverUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200",
    watermarkEnabled: true,
    watermarkText: "Aisha & Kabir",
    watermarkPosition: "center",
    watermarkOpacity: 0.5,
    sharingLimit: "unlimited",
    liquidGlassEnabled: false,
    photoBlur: 0
  },
  {
    id: "reception-party",
    name: "Reception Party",
    date: "2025-05-25",
    type: "anniversary",
    ownerId: "mock-owner",
    coverUrl: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1200",
    watermarkEnabled: false,
    sharingLimit: "unlimited",
    liquidGlassEnabled: false,
    photoBlur: 0
  }
];

export const MOCK_TASKS: WeddingTask[] = [
  // Sangeet Night
  { id: "t1", weddingId: "sangeet-night", title: "Confirm venue decor themes", category: "Decor", status: "completed", dueDate: "2025-04-10" },
  { id: "t2", weddingId: "sangeet-night", title: "Choreography final rehearsals", category: "Entertainment", status: "completed", dueDate: "2025-05-15" },
  { id: "t3", weddingId: "sangeet-night", title: "Finalize catering buffet layout", category: "Catering", status: "completed", dueDate: "2025-05-20" },
  { id: "t4", weddingId: "sangeet-night", title: "Arrange welcome flower gate", category: "Decor", status: "pending", dueDate: "2025-05-23" },
  { id: "t5", weddingId: "sangeet-night", title: "Coordinate DJ lighting checklist", category: "Entertainment", status: "pending", dueDate: "2025-05-24" },
  
  // Wedding Ceremony
  { id: "t6", weddingId: "wedding-ceremony", title: "Procure ceremonial standard materials", category: "Other", status: "completed", dueDate: "2025-05-01" },
  { id: "t7", weddingId: "wedding-ceremony", title: "Confirm main altar flowers setup", category: "Decor", status: "pending", dueDate: "2025-05-24" },
  { id: "t8", weddingId: "wedding-ceremony", title: "Reserve guests transportation", category: "Coordinator", status: "pending", dueDate: "2025-05-24" },
  { id: "t9", weddingId: "wedding-ceremony", title: "Bridal outfits setup checks", category: "Attire", status: "completed", dueDate: "2025-05-22" },
  
  // Reception Party
  { id: "t10", weddingId: "reception-party", title: "Catering menu wine tasting", category: "Catering", status: "completed", dueDate: "2025-05-10" },
  { id: "t11", weddingId: "reception-party", title: "Check sound levels with DJ duo", category: "Entertainment", status: "pending", dueDate: "2025-05-24" }
];

export const MOCK_GUESTS: WeddingGuest[] = [
  // Sangeet Night
  { id: "g1", weddingId: "sangeet-night", name: "Anil & Sunita Sharma", rsvp: "attending", phone: "+91 98765 43210", email: "anil@sharmas.com" },
  { id: "g2", weddingId: "sangeet-night", name: "Vikram & Priya Kapoor", rsvp: "attending", phone: "+91 98722 11001", email: "vikram@kappor.com" },
  { id: "g3", weddingId: "sangeet-night", name: "Arjun Khanna", rsvp: "pending", phone: "+91 99887 76655", email: "arjun@khanna.me" },
  { id: "g4", weddingId: "sangeet-night", name: "Dr. Meera Patel", rsvp: "declined", phone: "+91 95432 12345", email: "meera.patel@health.org" },
  
  // Wedding Ceremony
  { id: "g5", weddingId: "wedding-ceremony", name: "Ananya Sharma", rsvp: "attending", phone: "+91 92233 44556" },
  { id: "g6", weddingId: "wedding-ceremony", name: "Kabir Khan", rsvp: "attending", phone: "+91 93344 55667" },
  { id: "g7", weddingId: "wedding-ceremony", name: "Dadi & Dadaji", rsvp: "attending" },
  { id: "g8", weddingId: "wedding-ceremony", name: "Farhan Malik", rsvp: "pending", phone: "+91 98877 66554", email: "farhan@malik.co" }
];

export const MOCK_BUDGET: BudgetItem[] = [
  // Sangeet Night
  { id: "b1", weddingId: "sangeet-night", name: "Grand Palace Ballroom Booking", category: "Venue", amount: 450000, paid: true },
  { id: "b2", weddingId: "sangeet-night", name: "Traditional Buffet for 150 pax", category: "Catering", amount: 250000, paid: true },
  { id: "b3", weddingId: "sangeet-night", name: "Flower Cascades and Lighting", category: "Decor", amount: 150000, paid: false },
  { id: "b4", weddingId: "sangeet-night", name: "Choreographed DJ & Sound Array", category: "Entertainment", amount: 100000, paid: true },
  { id: "b5", weddingId: "sangeet-night", name: "Floral Bridal Hair Accents", category: "Attire", amount: 50000, paid: false },
  
  // Wedding Ceremony
  { id: "b6", weddingId: "wedding-ceremony", name: "Ceremonial Altar Setup", category: "Venue", amount: 300000, paid: true },
  { id: "b7", weddingId: "wedding-ceremony", name: "Flower Garlands", category: "Decor", amount: 80000, paid: true },
  
  // Reception Party
  { id: "b8", weddingId: "reception-party", name: "Live Acoustic Band Duo", category: "Entertainment", amount: 120000, paid: false }
];

export const MOCK_VENDORS: EventVendor[] = [
  // Sangeet Night
  { id: "v1", weddingId: "sangeet-night", name: "The Grand Palace", category: "Venue", phone: "+91 141 228800", contactPerson: "Rajendar Singh", status: "booked" },
  { id: "v2", weddingId: "sangeet-night", name: "Decor by Elegance", category: "Decor", phone: "+91 98290 12345", contactPerson: "Sanjay Mehra", status: "booked" },
  { id: "v3", weddingId: "sangeet-night", name: "Rhythm Events (DJ & Sound)", category: "Entertainment", phone: "+91 90011 22334", contactPerson: "DJ Kabir", status: "booked" },
  { id: "v4", weddingId: "sangeet-night", name: "Gourmet Tastes", category: "Catering", phone: "+91 91122 33445", contactPerson: "Chef Anand", status: "shortlisted" }
];

export const MOCK_ACTIVITY_FEED = [
  { id: "a1", eventId: "sangeet-night", message: "Guest list updated with RSVP details", timestamp: "2m ago" },
  { id: "a2", eventId: "sangeet-night", message: "Payment to vendor (The Grand Palace) completed", timestamp: "1h ago" },
  { id: "a3", eventId: "sangeet-night", message: "New task arranged: Coordinate DJ lighting checklist", timestamp: "3h ago" },
  { id: "a4", eventId: "sangeet-night", message: "Event details modified by Aisha Khan", timestamp: "5h ago" },
  { id: "a5", eventId: "sangeet-night", message: "Watermark watermark configured to 'Sangeet Purity'", timestamp: "1d ago" }
];
