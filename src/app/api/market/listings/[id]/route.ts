import { NextResponse } from 'next/server';
import { marketRepo } from '@/lib/repo/marketRepo';
import {
  transitionListingStatus,
  validateQuantity,
  validateDateRange,
  validatePrice,
  validatePhone,
} from '@/lib/market';
import {
  verifyListingToken,
  sanitizeListingForPublic,
  sanitizeOfferForPublic,
} from '@/lib/marketSanitizer';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import type { ListingAction, Listing } from '@/types/market';

function extractToken(request: Request, bodyToken?: unknown): string | null {
  if (typeof bodyToken === 'string' && bodyToken.trim()) {
    return bodyToken.trim();
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const url = new URL(request.url);
  const queryToken = url.searchParams.get('token');
  if (queryToken) {
    return queryToken.trim();
  }
  return null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const listing = await marketRepo.getListingById(id);
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const token = extractToken(request);
    const isFarmerOwner = verifyListingToken(listing, token);

    const offers = await marketRepo.getOffersByListingId(id);

    if (isFarmerOwner) {
      // Owner view: reveal phone and accepted buyer's contact
      const { editTokenHash, ...ownerListing } = listing;
      void editTokenHash;

      const ownerOffers = offers.map((offer) => {
        // Reveal contact if offer was accepted so farmer can coordinate pickup
        if (offer.status === 'accepted') {
          return offer;
        }
        return sanitizeOfferForPublic(offer);
      });

      return NextResponse.json({
        success: true,
        isOwner: true,
        listing: ownerListing,
        offers: ownerOffers,
      });
    }

    // Public / Buyer View
    // Anti-Hallucination & Privacy Rule:
    // Farmer phone is revealed ONLY after an offer is accepted
    const isAccepted = listing.status === 'accepted' || listing.status === 'pickup_scheduled' || listing.status === 'collected';
    const sanitizedListing = sanitizeListingForPublic(listing, offers.length);

    // If accepted and buyer query parameter matches accepted offer's buyer
    const url = new URL(request.url);
    const buyerId = url.searchParams.get('buyerId');
    const acceptedOffer = offers.find((o) => o.id === listing.acceptedOfferId);

    const revealFarmerPhoneToBuyer =
      isAccepted &&
      Boolean(buyerId) &&
      acceptedOffer?.buyerId === buyerId &&
      Boolean(listing.phone);

    if (revealFarmerPhoneToBuyer) {
      sanitizedListing.phone = listing.phone;
    }

    const sanitizedOffers = offers.map(sanitizeOfferForPublic);

    return NextResponse.json({
      success: true,
      isOwner: false,
      listing: sanitizedListing,
      offers: sanitizedOffers,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch listing';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, 30);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { id } = await context.params;
    const listing = await marketRepo.getListingById(id);
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const token = extractToken(request, body.token || body.editToken);
    const isAuthorized = verifyListingToken(listing, token);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid or missing edit token.' },
        { status: 401 }
      );
    }

    // Branch A: Farmer updates listing details
    if (body.updateDetails && typeof body.updateDetails === 'object') {
      if (listing.status === 'collected' || listing.status === 'withdrawn') {
        return NextResponse.json(
          { error: `Cannot edit listing details when status is '${listing.status}'` },
          { status: 400 }
        );
      }

      const details = body.updateDetails as Record<string, unknown>;
      const partialUpdate: Partial<Listing> = {};

      if (details.village !== undefined) {
        if (typeof details.village !== 'string' || !details.village.trim()) {
          return NextResponse.json({ error: 'Village name cannot be empty' }, { status: 400 });
        }
        partialUpdate.village = details.village.trim().slice(0, 100);
      }

      if (details.quantityQuintals !== undefined) {
        partialUpdate.quantityQuintals = validateQuantity(details.quantityQuintals);
      }

      if (details.form !== undefined) {
        if (details.form !== 'loose' && details.form !== 'baled') {
          return NextResponse.json({ error: "Form must be either 'loose' or 'baled'" }, { status: 400 });
        }
        partialUpdate.form = details.form;
      }

      if (details.startDate !== undefined || details.endDate !== undefined) {
        const start = details.startDate !== undefined ? details.startDate : listing.availability.startDate;
        const end = details.endDate !== undefined ? details.endDate : listing.availability.endDate;
        const dateRange = validateDateRange(start, end);
        partialUpdate.availability = dateRange;
      }

      if (details.askingPricePerQuintal !== undefined) {
        partialUpdate.askingPricePerQuintal = validatePrice(details.askingPricePerQuintal);
      }

      if (details.phone !== undefined) {
        partialUpdate.phone = validatePhone(details.phone, true);
      }

      const updated = await marketRepo.updateListing(id, partialUpdate);
      const { editTokenHash, ...sanitized } = updated;
      void editTokenHash;

      return NextResponse.json({
        success: true,
        listing: sanitized,
      });
    }

    // Branch B: Lifecycle action
    const action = body.action as ListingAction;
    if (!action || typeof action.type !== 'string') {
      return NextResponse.json(
        { error: "Missing or invalid payload. Must specify either 'updateDetails' or { action: { type: '...' } }" },
        { status: 400 }
      );
    }

    // Apply pure state transition machine
    const nextStatus = transitionListingStatus(listing.status, action);

    const updated = await marketRepo.updateListing(id, {
      status: nextStatus,
    });

    const { editTokenHash, ...sanitized } = updated;
    void editTokenHash;

    return NextResponse.json({
      success: true,
      listing: sanitized,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid transition request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
