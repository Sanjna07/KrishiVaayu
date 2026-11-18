'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Listing, Offer, ListingStatus } from '@/types/market';
import {
  ShieldCheck,
  CheckCircle,
  Clock,
  Phone,
  Truck,
  AlertCircle,
  Check,
  Copy,
  Share2,
} from 'lucide-react';

interface FarmerDashboardClientProps {
  token: string;
}

export default function FarmerDashboardClient({ token }: FarmerDashboardClientProps) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch(`/api/market/manage/${token}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load listing dashboard');
      }
      setListing(data.listing);
      setOffers(data.offers);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/market/manage/${token}`);
        const data = await res.json();
        if (ignore) return;
        if (!res.ok) throw new Error(data.error || 'Failed to load listing dashboard');
        setListing(data.listing);
        setOffers(data.offers);
        setLoading(false);
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard');
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [token]);

  // Handle Offer Acceptance or Decline
  const handleOfferAction = async (offerId: string, action: 'accept' | 'decline') => {
    setActionLoading(true);
    setActionSuccess(null);
    setError(null);

    try {
      const res = await fetch(`/api/market/offers/${offerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update offer');
      }

      setActionSuccess(
        action === 'accept'
          ? '✓ Offer accepted! Buyer contact is now unlocked below. Contact them to finalize pickup.'
          : '✓ Offer declined.'
      );
      await fetchDashboardData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Listing Lifecycle Updates (Schedule Pickup, Collected, Withdraw)
  const handleLifecycleAction = async (actionType: 'SCHEDULE_PICKUP' | 'CONFIRM_COLLECTED' | 'WITHDRAW') => {
    if (!listing) return;
    setActionLoading(true);
    setActionSuccess(null);
    setError(null);

    try {
      const res = await fetch(`/api/market/listings/${listing.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: { type: actionType } }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update listing status');
      }

      setActionSuccess(
        actionType === 'SCHEDULE_PICKUP'
          ? '✓ Pickup scheduled! Marked on the regional logistics dashboard.'
          : actionType === 'CONFIRM_COLLECTED'
          ? '✓ Residue collection completed! Farm cleared without open burning.'
          : '✓ Listing withdrawn from marketplace.'
      );
      await fetchDashboardData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getDashboardCanonicalUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/market/manage/${encodeURIComponent(token.trim())}`;
    }
    return `https://krishi-vaayu.vercel.app/market/manage/${encodeURIComponent(token.trim())}`;
  };

  const handleCopyLink = async () => {
    const url = getDashboardCanonicalUrl();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const handleShareWhatsApp = () => {
    const url = getDashboardCanonicalUrl();
    const shareText = encodeURIComponent(
      `🌾 KrishiVayu Farmer Dashboard · Listing #${listing?.id || ''}\nVillage: ${listing?.village || ''}, ${listing?.district || ''}\nQuantity: ${listing?.quantityQuintals || ''} Quintals\nManage & View Buyer Offers:\n${url}`
    );
    window.open(`https://wa.me/?text=${shareText}`, '_blank');
  };

  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case 'listed':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Open Listing (Awaiting Offers)</span>;
      case 'offered':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">Offers Received</span>;
      case 'accepted':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">Offer Accepted</span>;
      case 'pickup_scheduled':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">Pickup Scheduled</span>;
      case 'collected':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">Residue Collected</span>;
      case 'withdrawn':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">Withdrawn</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F5F7FA] text-[#5B6675] border border-[#D9DEE5]">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] text-[#5B6675] flex items-center justify-center p-4 text-xs font-medium">
        <p>Loading farmer management dashboard...</p>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] text-[#1B2430] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-lg p-6 text-center shadow-xs">
          <AlertCircle className="w-12 h-12 text-[#C62828] mx-auto mb-3" />
          <h1 className="text-lg font-bold text-[#1F3A5F] mb-2">Invalid or Expired Link</h1>
          <p className="text-xs text-[#5B6675] mb-6">{error}</p>
          <Link
            href="/market"
            className="inline-block px-4 py-2 bg-[#1F3A5F] hover:bg-[#162C49] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
          >
            Return to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1B2430] flex flex-col">

      {/* Header */}
      <header className="border-b border-[#D9DEE5] bg-white sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-[#1F3A5F] font-bold text-lg hover:text-[#162C49] transition-colors">
            <span className="text-xl">🌾</span> <span>KrishiVayu</span>
          </Link>
          <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
            Farmer Dashboard
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#1F3A5F] text-xs font-semibold rounded-md flex items-center gap-1.5 border border-[#D9DEE5] shadow-xs transition-colors min-h-[36px]"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied Link' : 'Copy Link'}</span>
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="px-3 py-1.5 bg-[#2E7D32] hover:bg-[#236327] text-white text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-xs transition-colors min-h-[36px]"
            title="Save or send this dashboard link to WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
          <Link
            href="/market"
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#1F3A5F] text-xs font-semibold rounded-md border border-[#D9DEE5] shadow-xs transition-colors min-h-[36px] flex items-center"
          >
            Browse Market
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Alerts / Feedback */}
        {actionSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-medium flex items-start gap-2.5 shadow-xs">
            <CheckCircle className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-900 text-xs font-medium flex items-start gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 text-[#C62828] shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Listing Overview Card */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A5F]">
                  {listing.village}, {listing.district}
                </h1>
              </div>
              <p className="text-xs text-[#5B6675] mt-0.5 font-mono">
                Listing ID: {listing.id}
              </p>
            </div>
            {getStatusBadge(listing.status)}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-[#D9DEE5] my-3 text-xs">
            <div>
              <span className="text-[#5B6675] block text-[11px]">Quantity</span>
              <span className="font-bold text-[#2E7D32] text-base">{listing.quantityQuintals} Quintals</span>
            </div>
            <div>
              <span className="text-[#5B6675] block text-[11px]">Residue Form</span>
              <span className="font-semibold text-[#1B2430] text-sm">
                {listing.form === 'baled' ? '📦 Baled Bundles' : '🌾 Loose Straw'}
              </span>
            </div>
            <div>
              <span className="text-[#5B6675] block text-[11px]">Asking Price</span>
              <span className="font-semibold text-[#1B2430] text-sm">
                {listing.askingPricePerQuintal ? `₹${listing.askingPricePerQuintal} / Qtl` : 'Negotiable'}
              </span>
            </div>
            <div>
              <span className="text-[#5B6675] block text-[11px]">Availability</span>
              <span className="font-semibold text-[#1B2430] text-sm">
                {listing.availability.startDate} to {listing.availability.endDate}
              </span>
            </div>
          </div>

          {/* Privacy confirmation badge */}
          <div className="mt-3 bg-[#F5F7FA] border border-[#D9DEE5] rounded-lg p-3 text-xs text-[#5B6675] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2E7D32] shrink-0" />
              <span>
                Registered Phone: <span className="font-mono font-semibold text-[#1B2430]">{listing.phone || 'None entered'}</span> (Protected & Hidden from Public)
              </span>
            </div>
            <span className="text-[11px] font-medium text-[#5B6675]">Encrypted Token Access</span>
          </div>

          {/* Lifecycle Action Buttons */}
          <div className="mt-5 pt-4 border-t border-[#D9DEE5] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {listing.status === 'accepted' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleLifecycleAction('SCHEDULE_PICKUP')}
                  className="px-4 py-2 bg-[#1F3A5F] hover:bg-[#162C49] disabled:opacity-50 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors shadow-xs min-h-[38px]"
                >
                  <Truck className="w-4 h-4" />
                  <span>Mark Pickup Scheduled</span>
                </button>
              )}

              {listing.status === 'pickup_scheduled' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleLifecycleAction('CONFIRM_COLLECTED')}
                  className="px-4 py-2 bg-[#2E7D32] hover:bg-[#236327] disabled:opacity-50 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors shadow-xs min-h-[38px]"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm Residue Collected</span>
                </button>
              )}
            </div>

            {['listed', 'offered', 'accepted'].includes(listing.status) && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  if (confirm('Are you sure you want to withdraw this listing from the marketplace?')) {
                    handleLifecycleAction('WITHDRAW');
                  }
                }}
                className="px-3.5 py-1.5 text-xs text-[#C62828] hover:bg-red-50 border border-red-200 rounded-md transition-colors min-h-[38px] flex items-center font-medium"
              >
                Withdraw Listing
              </button>
            )}
          </div>
        </div>

        {/* Incoming Offers Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-bold text-[#1F3A5F] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#1F3A5F]" />
              <span>Incoming Buyer Offers ({offers.length})</span>
            </h2>
            <span className="text-xs text-[#5B6675]">
              {listing.status === 'offered' ? 'Review & Accept an offer below' : 'Status: ' + listing.status}
            </span>
          </div>

          {offers.length === 0 ? (
            <div className="bg-white border border-[#D9DEE5] rounded-lg p-8 text-center text-[#5B6675] text-xs">
              <p className="font-semibold text-[#1B2430] text-sm">No offers received yet.</p>
              <p className="mt-1">
                When nearby plants or aggregators review your residue, their bids will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => {
                const isAccepted = offer.status === 'accepted';
                const totalEarning = offer.pricePerQuintal * listing.quantityQuintals;

                return (
                  <div
                    key={offer.id}
                    className={`p-5 rounded-lg border transition-all ${
                      isAccepted
                        ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300 shadow-xs'
                        : 'bg-white border-[#D9DEE5] shadow-xs'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#1B2430]">{offer.buyerName}</h3>
                          <span className="text-[10px] uppercase font-semibold bg-[#F5F7FA] border border-[#D9DEE5] text-[#5B6675] px-2 py-0.5 rounded">
                            {offer.buyerType.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-[#5B6675] mt-1">
                          Proposed Pickup Date: <span className="font-medium text-[#1B2430]">{offer.proposedPickupDate}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-[#5B6675] block">Offer Rate</span>
                        <span className="text-xl font-extrabold text-[#2E7D32]">
                          ₹{offer.pricePerQuintal}
                          <span className="text-xs font-normal text-[#5B6675]"> / Qtl</span>
                        </span>
                        <span className="block text-[11px] text-[#5B6675]">
                          Total: ~₹{totalEarning.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {offer.shortNote && (
                      <div className="bg-[#F5F7FA] border border-[#D9DEE5] rounded-md p-2.5 text-xs text-[#5B6675] mb-3 italic">
                        &ldquo;{offer.shortNote}&rdquo;
                      </div>
                    )}

                    {/* REVEALED BUYER CONTACT ONLY AFTER ACCEPTANCE */}
                    {isAccepted ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-emerald-900">
                          <Phone className="w-4 h-4 text-[#2E7D32] shrink-0" />
                          <span>
                            Buyer Contact Unlocked:{' '}
                            <strong className="font-mono text-[#1B2430] text-sm">
                              {offer.buyerContact || '98111-DEMO1'}
                            </strong>
                          </span>
                        </div>

                        <a
                          href={`tel:${offer.buyerContact || '9811100000'}`}
                          className="px-3 py-1.5 bg-[#2E7D32] hover:bg-[#236327] text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Buyer</span>
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-2 border-t border-[#D9DEE5]">
                        <span className="text-xs text-[#5B6675] capitalize">
                          Status: {offer.status}
                        </span>

                        {offer.status === 'pending' && listing.status === 'offered' && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleOfferAction(offer.id, 'decline')}
                              className="px-3 py-1.5 text-xs text-[#C62828] hover:bg-red-50 border border-red-200 rounded-md transition-colors font-medium"
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleOfferAction(offer.id, 'accept')}
                              className="px-4 py-1.5 bg-[#2E7D32] hover:bg-[#236327] disabled:opacity-50 text-white text-xs font-semibold rounded-md flex items-center gap-1 transition-colors shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept Offer</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
