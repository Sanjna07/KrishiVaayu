import fs from 'fs';
import path from 'path';
import type { Listing, Offer, ListingStatus, StrawForm, MarketReport, CreateReportInput } from '@/types/market';
import { initialDemoListings, initialDemoOffers } from './seedData';
import { isMongoConfigured } from '@/lib/db/mongodb';
import { MongoMarketRepository } from './mongoMarketRepo';

export interface ListingFilter {
  district?: string;
  status?: ListingStatus;
  form?: StrawForm;
  minQty?: number;
}

export interface IMarketRepository {
  createListing(listing: Listing): Promise<Listing>;
  getListingById(id: string): Promise<Listing | null>;
  getListingByTokenHash(tokenHash: string): Promise<Listing | null>;
  listListings(filter?: ListingFilter): Promise<Listing[]>;
  updateListing(id: string, updates: Partial<Listing>): Promise<Listing>;

  createOffer(offer: Offer): Promise<Offer>;
  getOffersByListingId(listingId: string): Promise<Offer[]>;
  getOfferById(id: string): Promise<Offer | null>;
  updateOffer(id: string, updates: Partial<Offer>): Promise<Offer>;

  createReport(input: CreateReportInput): Promise<{ report: MarketReport; flagged: boolean; duplicate: boolean }>;
  getReportsByTargetId(targetId: string): Promise<MarketReport[]>;

  seed(listings: Listing[], offers: Offer[], replace?: boolean): Promise<{ listingCount: number; offerCount: number }>;
  clear(): Promise<void>;
}

class InMemoryMarketRepository implements IMarketRepository {
  private listings = new Map<string, Listing>();
  private offers = new Map<string, Offer>();
  private reports = new Map<string, MarketReport>();
  private initialized = false;

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized(): void {
    if (this.initialized) return;

    // Check if tmp or persistent file exists
    const storagePath = this.getStoragePath();
    if (storagePath && fs.existsSync(storagePath)) {
      try {
        const raw = fs.readFileSync(storagePath, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.listings) && Array.isArray(data.offers)) {
          this.listings.clear();
          this.offers.clear();
          this.reports.clear();
          for (const l of data.listings) this.listings.set(l.id, l);
          for (const o of data.offers) this.offers.set(o.id, o);
          if (Array.isArray(data.reports)) {
            for (const r of data.reports) this.reports.set(r.id, r);
          }
          this.initialized = true;
          return;
        }
      } catch (err) {
        console.warn('Failed to load persisted market data, falling back to seed data:', err);
      }
    }

    // Default to initial synthetic demo dataset
    for (const l of initialDemoListings) {
      this.listings.set(l.id, { ...l });
    }
    for (const o of initialDemoOffers) {
      this.offers.set(o.id, { ...o });
    }
    this.initialized = true;
    this.saveToStorage();
  }

  private getStoragePath(): string | null {
    // In Vercel serverless environment, only /tmp is writable
    if (process.env.VERCEL) {
      return path.join('/tmp', 'krishivayu_market.json');
    }
    const dataDir = path.join(process.cwd(), 'data');
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      return path.join(dataDir, 'market.json');
    } catch {
      return null;
    }
  }

  private saveToStorage(): void {
    try {
      const storagePath = this.getStoragePath();
      if (!storagePath) return;
      const data = {
        listings: Array.from(this.listings.values()),
        offers: Array.from(this.offers.values()),
        reports: Array.from(this.reports.values()),
      };
      fs.writeFileSync(storagePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // Ephemeral environments might restrict disk writes; in-memory map preserves state within runtime
    }
  }

  async createListing(listing: Listing): Promise<Listing> {
    this.ensureInitialized();
    const copy: Listing = {
      ...listing,
      createdAt: listing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.listings.set(copy.id, copy);
    this.saveToStorage();
    return { ...copy };
  }

  async getListingById(id: string): Promise<Listing | null> {
    this.ensureInitialized();
    const item = this.listings.get(id);
    return item ? { ...item } : null;
  }

  async getListingByTokenHash(tokenHash: string): Promise<Listing | null> {
    this.ensureInitialized();
    for (const item of this.listings.values()) {
      if (item.editTokenHash === tokenHash) {
        return { ...item };
      }
    }
    return null;
  }

  async listListings(filter?: ListingFilter): Promise<Listing[]> {
    this.ensureInitialized();
    let results = Array.from(this.listings.values());

    if (filter) {
      if (filter.district) {
        const d = filter.district.toLowerCase().trim();
        results = results.filter((l) => l.district.toLowerCase() === d);
      }
      if (filter.status) {
        results = results.filter((l) => l.status === filter.status);
      }
      if (filter.form) {
        results = results.filter((l) => l.form === filter.form);
      }
      if (typeof filter.minQty === 'number') {
        results = results.filter((l) => l.quantityQuintals >= (filter.minQty as number));
      }
    }

    // Sort newest first
    return results
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((l) => ({ ...l }));
  }

  async updateListing(id: string, updates: Partial<Listing>): Promise<Listing> {
    this.ensureInitialized();
    const existing = this.listings.get(id);
    if (!existing) {
      throw new Error(`Listing '${id}' not found`);
    }
    const updated: Listing = {
      ...existing,
      ...updates,
      id: existing.id, // Prevent ID override
      editTokenHash: existing.editTokenHash, // Prevent token hash corruption
      updatedAt: new Date().toISOString(),
    };
    this.listings.set(id, updated);
    this.saveToStorage();
    return { ...updated };
  }

  async createOffer(offer: Offer): Promise<Offer> {
    this.ensureInitialized();
    const copy: Offer = {
      ...offer,
      createdAt: offer.createdAt || new Date().toISOString(),
    };
    this.offers.set(copy.id, copy);
    this.saveToStorage();
    return { ...copy };
  }

  async getOffersByListingId(listingId: string): Promise<Offer[]> {
    this.ensureInitialized();
    const list: Offer[] = [];
    for (const o of this.offers.values()) {
      if (o.listingId === listingId) {
        list.push({ ...o });
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getOfferById(id: string): Promise<Offer | null> {
    this.ensureInitialized();
    const item = this.offers.get(id);
    return item ? { ...item } : null;
  }

  async updateOffer(id: string, updates: Partial<Offer>): Promise<Offer> {
    this.ensureInitialized();
    const existing = this.offers.get(id);
    if (!existing) {
      throw new Error(`Offer '${id}' not found`);
    }
    const updated: Offer = {
      ...existing,
      ...updates,
      id: existing.id,
      listingId: existing.listingId,
    };
    this.offers.set(id, updated);
    this.saveToStorage();
    return { ...updated };
  }

  async seed(listings: Listing[], offers: Offer[], replace = true): Promise<{ listingCount: number; offerCount: number }> {
    if (replace) {
      this.listings.clear();
      this.offers.clear();
    }
    for (const l of listings) {
      this.listings.set(l.id, { ...l });
    }
    for (const o of offers) {
      this.offers.set(o.id, { ...o });
    }
    this.initialized = true;
    this.saveToStorage();
    return {
      listingCount: this.listings.size,
      offerCount: this.offers.size,
    };
  }

  async createReport(input: CreateReportInput): Promise<{ report: MarketReport; flagged: boolean; duplicate: boolean }> {
    this.ensureInitialized();

    // Prevent duplicate reports: check if same reporter has already reported this target
    for (const existing of this.reports.values()) {
      if (existing.reporterId === input.reporterId && existing.targetId === input.targetId) {
        return { report: { ...existing }, flagged: false, duplicate: true };
      }
    }

    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newReport: MarketReport = {
      id: reportId,
      reporterType: input.reporterType,
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      targetName: input.targetName,
      reason: input.reason,
      notes: input.notes?.trim().slice(0, 500),
      createdAt: new Date().toISOString(),
    };

    this.reports.set(reportId, newReport);

    // Count reports for targetId
    const targetReports = Array.from(this.reports.values()).filter((r) => r.targetId === input.targetId);
    const count = targetReports.length;
    let flagged = false;

    // Rule: More than 3 valid reports (> 3) triggers automatic flagging for verification
    if (count > 3) {
      flagged = true;
      if (input.targetType === 'farmer') {
        const listing = this.listings.get(input.targetId);
        if (listing) {
          listing.isFlagged = true;
          listing.reportCount = count;
          this.listings.set(listing.id, { ...listing });
        }
      }
    }

    this.saveToStorage();
    return { report: { ...newReport }, flagged, duplicate: false };
  }

  async getReportsByTargetId(targetId: string): Promise<MarketReport[]> {
    this.ensureInitialized();
    return Array.from(this.reports.values())
      .filter((r) => r.targetId === targetId)
      .map((r) => ({ ...r }));
  }

  async clear(): Promise<void> {
    this.listings.clear();
    this.offers.clear();
    this.reports.clear();
    this.initialized = true;
    this.saveToStorage();
  }
}

class HybridMarketRepository implements IMarketRepository {
  private inMemoryRepo: InMemoryMarketRepository;
  private mongoRepo: MongoMarketRepository | null = null;

  constructor() {
    this.inMemoryRepo = new InMemoryMarketRepository();
  }

  private getActiveRepo(): IMarketRepository {
    if (isMongoConfigured()) {
      if (!this.mongoRepo) {
        this.mongoRepo = new MongoMarketRepository();
      }
      return this.mongoRepo;
    }
    return this.inMemoryRepo;
  }

  async createListing(listing: Listing): Promise<Listing> {
    try {
      return await this.getActiveRepo().createListing(listing);
    } catch (err) {
      if (this.mongoRepo) {
        console.warn('MongoDB operation failed, falling back to local memory repo:', err);
        return this.inMemoryRepo.createListing(listing);
      }
      throw err;
    }
  }

  async getListingById(id: string): Promise<Listing | null> {
    try {
      return await this.getActiveRepo().getListingById(id);
    } catch (err) {
      if (this.mongoRepo) {
        console.warn('MongoDB operation failed, falling back to local memory repo:', err);
        return this.inMemoryRepo.getListingById(id);
      }
      throw err;
    }
  }

  async getListingByTokenHash(tokenHash: string): Promise<Listing | null> {
    try {
      return await this.getActiveRepo().getListingByTokenHash(tokenHash);
    } catch (err) {
      if (this.mongoRepo) {
        console.warn('MongoDB operation failed, falling back to local memory repo:', err);
        return this.inMemoryRepo.getListingByTokenHash(tokenHash);
      }
      throw err;
    }
  }

  async listListings(filter?: ListingFilter): Promise<Listing[]> {
    try {
      return await this.getActiveRepo().listListings(filter);
    } catch (err) {
      if (this.mongoRepo) {
        console.warn('MongoDB operation failed, falling back to local memory repo:', err);
        return this.inMemoryRepo.listListings(filter);
      }
      throw err;
    }
  }

  async updateListing(id: string, updates: Partial<Listing>): Promise<Listing> {
    try {
      return await this.getActiveRepo().updateListing(id, updates);
    } catch (err) {
      if (this.mongoRepo) {
        console.warn('MongoDB operation failed, falling back to local memory repo:', err);
        return this.inMemoryRepo.updateListing(id, updates);
      }
      throw err;
    }
  }

  async createOffer(offer: Offer): Promise<Offer> {
    try {
      return await this.getActiveRepo().createOffer(offer);
    } catch (err) {
      if (this.mongoRepo) {
        console.warn('MongoDB operation failed, falling back to local memory repo:', err);
        return this.inMemoryRepo.createOffer(offer);
      }
      throw err;
    }
  }

  async getOffersByListingId(listingId: string): Promise<Offer[]> {
    try {
      return await this.getActiveRepo().getOffersByListingId(listingId);
    } catch (err) {
      if (this.mongoRepo) {
        console.warn('MongoDB operation failed, falling back to local memory repo:', err);
        return this.inMemoryRepo.getOffersByListingId(listingId);
      }
      throw err;
    }
  }

  async getOfferById(id: string): Promise<Offer | null> {
    try {
      return await this.getActiveRepo().getOfferById(id);
    } catch (err) {
      if (this.mongoRepo) {
        console.warn('MongoDB operation failed, falling back to local memory repo:', err);
        return this.inMemoryRepo.getOfferById(id);
      }
      throw err;
    }
  }

  async updateOffer(id: string, updates: Partial<Offer>): Promise<Offer> {
    try {
      return await this.getActiveRepo().updateOffer(id, updates);
    } catch (err) {
      if (this.mongoRepo) {
        console.warn('MongoDB operation failed, falling back to local memory repo:', err);
        return this.inMemoryRepo.updateOffer(id, updates);
      }
      throw err;
    }
  }

  async createReport(input: CreateReportInput): Promise<{ report: MarketReport; flagged: boolean; duplicate: boolean }> {
    try {
      return await this.getActiveRepo().createReport(input);
    } catch (err) {
      if (this.mongoRepo) {
        console.warn('MongoDB operation failed, falling back to local memory repo:', err);
        return this.inMemoryRepo.createReport(input);
      }
      throw err;
    }
  }

  async getReportsByTargetId(targetId: string): Promise<MarketReport[]> {
    try {
      return await this.getActiveRepo().getReportsByTargetId(targetId);
    } catch (err) {
      if (this.mongoRepo) {
        console.warn('MongoDB operation failed, falling back to local memory repo:', err);
        return this.inMemoryRepo.getReportsByTargetId(targetId);
      }
      throw err;
    }
  }

  async seed(listings: Listing[], offers: Offer[], replace?: boolean): Promise<{ listingCount: number; offerCount: number }> {
    return this.getActiveRepo().seed(listings, offers, replace);
  }

  async clear(): Promise<void> {
    return this.getActiveRepo().clear();
  }
}

// Global singleton to persist in memory across Next.js API requests
const globalForMarket = globalThis as unknown as {
  marketRepo: IMarketRepository | undefined;
};

export const marketRepo: IMarketRepository =
  globalForMarket.marketRepo ?? new HybridMarketRepository();

if (process.env.NODE_ENV !== 'production') {
  globalForMarket.marketRepo = marketRepo;
}
