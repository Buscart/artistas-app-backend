// Tipo local para evitar dependencia circular
export type EventType = 'concert' | 'exhibition' | 'workshop' | 'festival' | 'conference' | 'theater' | 'dance' | 'other';

export interface CreateEventInput {
  title: string;
  description: string;
  shortDescription?: string;
  startDate: string | Date;
  endDate?: string | Date;
  timezone?: string;
  isRecurring?: boolean;
  recurrencePattern?: any;
  locationType: 'physical' | 'online' | 'hybrid';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  coordinates?: { lat: number; lng: number };
  lat?: number;
  lng?: number;
  onlineEventUrl?: string;
  venueName?: string;
  venueDescription?: string;
  isFree: boolean;
  ticketPrice?: number;
  ticketUrl?: string;
  capacity?: number;
  availableTickets?: number;
  featuredImage?: string;
  gallery?: string[];
  videoUrl?: string;
  status?: 'draft' | 'published' | 'cancelled' | 'postponed' | 'completed';
  isFeatured?: boolean;
  categoryId?: number;
  subcategories?: string[];
  tags?: string[];
  eventType: EventType;
  organizerId: string;
  companyId?: string; // ID de la empresa organizadora (opcional)
}

export interface UpdateEventInput extends Partial<Omit<CreateEventInput, 'organizerId'>> {
  id: number;
}

export interface EventFilterOptions {
  query?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  isFree?: boolean;
  location?: string;
  eventType?: string;
  limit?: number | string;
  offset?: number | string;
}

export interface EventResponse {
  id: number;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  startDate: Date;
  endDate: Date | null;
  timezone: string;
  locationType: 'physical' | 'online' | 'hybrid';
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  coordinates: { lat: number; lng: number } | null;
  lat: number;
  lng: number;
  onlineEventUrl: string | null;
  venueName: string | null;
  venueDescription: string | null;
  isFree: boolean;
  ticketPrice: number | null;
  ticketUrl: string | null;
  capacity: number | null;
  availableTickets: number | null;
  featuredImage: string | null;
  gallery: string[];
  videoUrl: string | null;
  status: 'draft' | 'published' | 'cancelled' | 'postponed' | 'completed';
  isFeatured: boolean;
  isRecurring: boolean;
  recurrencePattern: any;
  categoryId: number | null;
  subcategories: string[];
  tags: string[];
  eventType: EventType;
  viewCount: number;
  saveCount: number;
  shareCount: number;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
  organizer?: {
    id: string;
    displayName: string | null;
    profileImageUrl: string | null;
  };
}
