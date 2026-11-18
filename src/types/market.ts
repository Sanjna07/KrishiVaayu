/**
 * KrishiVayu Residue Marketplace Contracts & Domain Types
 */

export type StrawForm = 'loose' | 'baled';

export type ListingStatus =
  | 'listed'
  | 'offered'
  | 'accepted'
  | 'pickup_scheduled'
  | 'collected'
  | 'withdrawn'
  | 'expired';

export type OfferStatus = 'pending' | 'accepted' | 'declined';

export interface AvailabilityWindow {
  startDate: string; // ISO Date YYYY-MM-DD
  endDate: string;   // ISO Date YYYY-MM-DD
}

export interface Listing {
  id: string;
  village: string;
  district: string;
  state: string;
  quantityQuintals: number;
  form: StrawForm;
  availability: AvailabilityWindow;
  askingPricePerQuintal?: number; // Optional farmer asking price in INR
  phone?: string;                 // Stored encrypted/private, revealed only upon offer acceptance
  editTokenHash: string;          // SHA-256 hash of farmer's private edit token
  status: ListingStatus;
  isDemo: boolean;
  acceptedOfferId?: string;
  isFlagged?: boolean;            // Automatically flagged when verified report threshold (>3) is exceeded
  reportCount?: number;           // Total count of reports submitted against this listing
  createdAt: string;              // ISO timestamp
  updatedAt: string;              // ISO timestamp
}

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  buyerType: 'cbg_plant' | 'biomass_plant' | 'residue_buyer' | 'pellet_unit' | 'aggregator';
  buyerContact?: string;          // Revealed to farmer upon acceptance; fake for demo buyers
  pricePerQuintal: number;        // INR per quintal
  proposedPickupDate: string;     // ISO Date YYYY-MM-DD
  shortNote?: string;
  status: OfferStatus;
  isDemo: boolean;
  createdAt: string;
}

export interface BuyerProfile {
  id: string;
  name: string;
  type: 'cbg_plant' | 'biomass_plant' | 'residue_buyer' | 'pellet_unit' | 'aggregator';
  district: string;
  state: string;
  contact: string;
  isDemo: boolean;
}

export type ListingAction =
  | { type: 'RECEIVE_OFFER'; offerId: string }
  | { type: 'ACCEPT_OFFER'; offerId: string }
  | { type: 'SCHEDULE_PICKUP' }
  | { type: 'CONFIRM_COLLECTED' }
  | { type: 'WITHDRAW' }
  | { type: 'EXPIRE' };

export interface CreateListingInput {
  village: string;
  district: string;
  state?: string;
  quantityQuintals: number;
  form: StrawForm;
  startDate: string;
  endDate: string;
  askingPricePerQuintal?: number;
  phone: string;
  isDemo?: boolean;
}

export interface CreateOfferInput {
  listingId: string;
  buyerId: string;
  buyerName: string;
  buyerType: Offer['buyerType'];
  buyerContact?: string;
  pricePerQuintal: number;
  proposedPickupDate: string;
  shortNote?: string;
  isDemo?: boolean;
}

export type ReporterType = 'farmer' | 'buyer';
export type ReportTargetType = 'farmer' | 'buyer';

export type ReportReason =
  | 'no_show_pickup'
  | 'incorrect_quantity_quality'
  | 'payment_issue'
  | 'unresponsive_contact'
  | 'fake_listing_or_bid'
  | 'inappropriate_behavior'
  | 'other';

export interface MarketReport {
  id: string;
  reporterType: ReporterType;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  targetName?: string;
  reason: ReportReason;
  notes?: string;
  createdAt: string;
}

export interface CreateReportInput {
  reporterType: ReporterType;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  targetName?: string;
  reason: ReportReason;
  notes?: string;
}
