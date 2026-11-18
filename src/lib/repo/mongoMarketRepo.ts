import { getMongoDb } from '@/lib/db/mongodb';
import type { Listing, Offer, MarketReport, CreateReportInput } from '@/types/market';
import type { IMarketRepository, ListingFilter } from './marketRepo';

export class MongoMarketRepository implements IMarketRepository {
  private async getCollections() {
    const db = await getMongoDb();
    const listings = db.collection<Listing>('listings');
    const offers = db.collection<Offer>('offers');
    const reports = db.collection<MarketReport>('reports');
    return { listings, offers, reports };
  }

  async createListing(listing: Listing): Promise<Listing> {
    const { listings } = await this.getCollections();
    const doc: Listing = {
      ...listing,
      createdAt: listing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await listings.updateOne(
      { id: doc.id },
      { $set: doc },
      { upsert: true }
    );
    return { ...doc };
  }

  async getListingById(id: string): Promise<Listing | null> {
    const { listings } = await this.getCollections();
    const doc = await listings.findOne({ id }, { projection: { _id: 0 } });
    return doc || null;
  }

  async getListingByTokenHash(tokenHash: string): Promise<Listing | null> {
    const { listings } = await this.getCollections();
    const doc = await listings.findOne({ editTokenHash: tokenHash }, { projection: { _id: 0 } });
    return doc || null;
  }

  async listListings(filter?: ListingFilter): Promise<Listing[]> {
    const { listings } = await this.getCollections();
    const query: Record<string, unknown> = {};

    if (filter) {
      if (filter.district) {
        query.district = { $regex: new RegExp(`^${filter.district.trim()}$`, 'i') };
      }
      if (filter.status) {
        query.status = filter.status;
      }
      if (filter.form) {
        query.form = filter.form;
      }
      if (typeof filter.minQty === 'number') {
        query.quantityQuintals = { $gte: filter.minQty };
      }
    }

    const cursor = listings
      .find(query, { projection: { _id: 0 } })
      .sort({ createdAt: -1 });

    return cursor.toArray();
  }

  async updateListing(id: string, updates: Partial<Listing>): Promise<Listing> {
    const { listings } = await this.getCollections();
    const existing = await this.getListingById(id);
    if (!existing) {
      throw new Error(`Listing '${id}' not found`);
    }

    const { id: _ignoreId, editTokenHash: _ignoreHash, ...safeUpdates } = updates;
    void _ignoreId;
    void _ignoreHash;

    const updatedDoc: Listing = {
      ...existing,
      ...safeUpdates,
      id: existing.id,
      editTokenHash: existing.editTokenHash,
      updatedAt: new Date().toISOString(),
    };

    await listings.updateOne(
      { id },
      { $set: updatedDoc }
    );

    return updatedDoc;
  }

  async createOffer(offer: Offer): Promise<Offer> {
    const { offers } = await this.getCollections();
    const doc: Offer = {
      ...offer,
      createdAt: offer.createdAt || new Date().toISOString(),
    };
    await offers.updateOne(
      { id: doc.id },
      { $set: doc },
      { upsert: true }
    );
    return { ...doc };
  }

  async getOffersByListingId(listingId: string): Promise<Offer[]> {
    const { offers } = await this.getCollections();
    return offers
      .find({ listingId }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getOfferById(id: string): Promise<Offer | null> {
    const { offers } = await this.getCollections();
    const doc = await offers.findOne({ id }, { projection: { _id: 0 } });
    return doc || null;
  }

  async updateOffer(id: string, updates: Partial<Offer>): Promise<Offer> {
    const { offers } = await this.getCollections();
    const existing = await this.getOfferById(id);
    if (!existing) {
      throw new Error(`Offer '${id}' not found`);
    }

    const { id: _ignoreId, listingId: _ignoreListingId, ...safeUpdates } = updates;
    void _ignoreId;
    void _ignoreListingId;

    const updatedDoc: Offer = {
      ...existing,
      ...safeUpdates,
      id: existing.id,
      listingId: existing.listingId,
    };

    await offers.updateOne({ id }, { $set: updatedDoc });
    return updatedDoc;
  }

  async createReport(input: CreateReportInput): Promise<{ report: MarketReport; flagged: boolean; duplicate: boolean }> {
    const { listings, reports } = await this.getCollections();

    // Check duplicate: same reporter reporting same target
    const existing = await reports.findOne(
      { reporterId: input.reporterId, targetId: input.targetId },
      { projection: { _id: 0 } }
    );

    if (existing) {
      return { report: existing, flagged: false, duplicate: true };
    }

    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const doc: MarketReport = {
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

    await reports.updateOne(
      { id: doc.id },
      { $set: doc },
      { upsert: true }
    );

    const count = await reports.countDocuments({ targetId: input.targetId });
    let flagged = false;

    // Rule: More than 3 valid reports (> 3) triggers automatic flagging for verification
    if (count > 3) {
      flagged = true;
      if (input.targetType === 'farmer') {
        await listings.updateOne(
          { id: input.targetId },
          { $set: { isFlagged: true, reportCount: count } }
        );
      }
    }

    return { report: doc, flagged, duplicate: false };
  }

  async getReportsByTargetId(targetId: string): Promise<MarketReport[]> {
    const { reports } = await this.getCollections();
    return reports.find({ targetId }, { projection: { _id: 0 } }).toArray();
  }

  async seed(listingsData: Listing[], offersData: Offer[], replace = true): Promise<{ listingCount: number; offerCount: number }> {
    const { listings, offers } = await this.getCollections();
    if (replace) {
      await listings.deleteMany({});
      await offers.deleteMany({});
    }

    if (listingsData.length > 0) {
      await listings.insertMany(listingsData.map((l) => ({ ...l })));
    }
    if (offersData.length > 0) {
      await offers.insertMany(offersData.map((o) => ({ ...o })));
    }

    const listingCount = await listings.countDocuments();
    const offerCount = await offers.countDocuments();
    return { listingCount, offerCount };
  }

  async clear(): Promise<void> {
    const { listings, offers, reports } = await this.getCollections();
    await listings.deleteMany({});
    await offers.deleteMany({});
    await reports.deleteMany({});
  }
}
