'use client';

import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import type { PublicListing } from '@/lib/marketSanitizer';
import type { Offer, BuyerProfile } from '@/types/market';
import {
  Calendar,
  Building2,
  Send,
  ShieldCheck,
  Lock,
  Check,
  Flag,
  AlertTriangle,
  AlertCircle,
  X,
} from 'lucide-react';

interface ListingModalProps {
  listing: PublicListing | null;
  isOpen: boolean;
  onClose: () => void;
  onOfferSubmitted: () => void;
  userRole?: 'public' | 'farmer' | 'buyer';
  onRoleChange?: (role: 'public' | 'farmer' | 'buyer') => void;
}

const DEMO_BUYERS: BuyerProfile[] = [
  {
    id: 'buyer_malwa_pellets',
    name: 'Malwa Green Energy Pellets',
    type: 'pellet_unit',
    district: 'Bathinda',
    state: 'Punjab',
    contact: '98111-DEMO1',
    isDemo: true,
  },
  {
    id: 'buyer_sangrur_cbg',
    name: 'Verbio Sangrur Bio-CNG Hub',
    type: 'cbg_plant',
    district: 'Sangrur',
    state: 'Punjab',
    contact: '98222-DEMO2',
    isDemo: true,
  },
  {
    id: 'buyer_patiala_fiber',
    name: 'Patiala Agro-Fiber Board Mill',
    type: 'residue_buyer',
    district: 'Patiala',
    state: 'Punjab',
    contact: '98333-DEMO3',
    isDemo: true,
  },
];

export function ListingModal({
  listing,
  isOpen,
  onClose,
  onOfferSubmitted,
  userRole,
  onRoleChange,
}: ListingModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'offers' | 'make_offer'>('details');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

  // Offer form state
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>(DEMO_BUYERS[0].id);
  const [customBuyerName, setCustomBuyerName] = useState<string>('');
  const [customBuyerType, setCustomBuyerType] = useState<Offer['buyerType']>('cbg_plant');
  const [customBuyerContact, setCustomBuyerContact] = useState<string>('');
  const [offerRate, setOfferRate] = useState<number>(200);
  const [pickupDate, setPickupDate] = useState<string>('');
  const [buyerNote, setBuyerNote] = useState<string>('');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

  // Report Listing State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<string>('fake_listing_or_bid');
  const [reportNotes, setReportNotes] = useState<string>('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  const handleReportListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    setReportSubmitting(true);
    setReportError(null);

    const reporterId = selectedBuyerId === 'custom'
      ? (customBuyerContact.trim() || 'buyer_custom')
      : selectedBuyerId;

    try {
      const res = await fetch('/api/market/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterType: 'buyer',
          reporterId,
          targetType: 'farmer',
          targetId: listing.id,
          targetName: `${listing.village}, ${listing.district} Listing`,
          reason: reportReason,
          notes: reportNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setReportSuccess(data.message || 'Report submitted successfully.');
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(null);
      }, 2500);
    } catch (err: unknown) {
      setReportError(err instanceof Error ? err.message : 'Error submitting report');
    } finally {
      setReportSubmitting(false);
    }
  };

  // Load offers when modal opens
  useEffect(() => {
    if (!listing || !isOpen) return;
    let ignore = false;

    const loadData = async () => {
      try {
        const lRes = await fetch(`/api/market/listings/${listing.id}`);
        if (ignore) return;
        const lJson = await lRes.json();
        if (lJson.offers) setOffers(lJson.offers);
        setLoadingOffers(false);
      } catch {
        if (!ignore) setLoadingOffers(false);
      }
    };

    loadData();
    return () => { ignore = true; };
  }, [listing, isOpen]);

  if (!listing) return null;

  const handleMakeOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOffer(true);
    setOfferError(null);

    let buyerId: string;
    let buyerName: string;
    let buyerType: Offer['buyerType'];
    let buyerContact: string;
    let isDemo = false;

    if (selectedBuyerId === 'custom') {
      if (!customBuyerName.trim()) {
        setOfferError('Please enter your Organization or Buyer Name');
        setSubmittingOffer(false);
        return;
      }
      const cleanPhone = customBuyerContact.trim().replace(/[\s\-\(\)]/g, '');
      const phoneMatch = cleanPhone.match(/^(?:\+91|91|0)?([6-9]\d{9})$/);
      if (!phoneMatch) {
        setOfferError('Please enter a valid 10-digit mobile contact number');
        setSubmittingOffer(false);
        return;
      }
      buyerId = `buyer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      buyerName = customBuyerName.trim();
      buyerType = customBuyerType;
      buyerContact = phoneMatch[1];
      isDemo = false;
    } else {
      const preset = DEMO_BUYERS.find((b) => b.id === selectedBuyerId) || DEMO_BUYERS[0];
      buyerId = preset.id;
      buyerName = preset.name;
      buyerType = preset.type;
      buyerContact = preset.contact;
      isDemo = true;
    }

    try {
      const res = await fetch('/api/market/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          buyerId,
          buyerName,
          buyerContact,
          buyerType,
          pricePerQuintal: Number(offerRate),
          proposedPickupDate: pickupDate,
          shortNote: buyerNote || 'Standard off-take purchase offer',
          isDemo,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit offer');
      }

      setOfferSuccess(true);
      onOfferSubmitted();
      setTimeout(() => {
        setActiveTab('offers');
      }, 1500);
    } catch (err) {
      setOfferError(err instanceof Error ? err.message : 'Error submitting offer');
    } finally {
      setSubmittingOffer(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'listed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">Open for Offers</span>;
      case 'offered':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Offers Pending</span>;
      case 'accepted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">Offer Accepted</span>;
      case 'pickup_scheduled':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Pickup Scheduled</span>;
      case 'collected':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">Collected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${listing.village}, ${listing.district}`}
      subtitle={`Listing #${listing.id} · ${listing.quantityQuintals} Quintals (${listing.form === 'baled' ? 'Baled' : 'Loose'})`}
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#D9DEE5] text-xs font-semibold gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-2 px-3 border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-[#1F3A5F] text-[#1F3A5F]'
                : 'border-transparent text-[#5B6675] hover:text-[#1B2430]'
            }`}
          >
            Listing Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('offers')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'offers'
                ? 'border-[#1F3A5F] text-[#1F3A5F]'
                : 'border-transparent text-[#5B6675] hover:text-[#1B2430]'
            }`}
          >
            <span>Offers</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-[#5B6675]">
              {offers.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('make_offer')}
            className={`py-2 px-3 border-b-2 transition-colors ${
              activeTab === 'make_offer'
                ? 'border-[#1F3A5F] text-[#1F3A5F]'
                : 'border-transparent text-[#5B6675] hover:text-[#1B2430]'
            }`}
          >
            Make an Offer
          </button>
        </div>

        {/* Tab 1: Listing Details */}
        {activeTab === 'details' && (
          <div className="space-y-4 text-xs">
            {listing.isFlagged && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C62828] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-xs">Notice: Under Administrative Review</strong>
                  <span className="text-[11px]">
                    This listing has received multiple community reports and is being verified by regional agricultural coordinators.
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-[#F5F7FA] border border-[#D9DEE5] rounded-lg">
              <div>
                <span className="text-[#5B6675] block text-[11px]">Current Status</span>
                {getStatusBadge(listing.status)}
              </div>
              <div className="text-right">
                <span className="text-[#5B6675] block text-[11px]">Residue Form</span>
                <span className="font-bold text-[#1B2430] text-sm">
                  {listing.form === 'baled' ? '📦 Baled Bundles' : '🌾 Loose Straw'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-[#D9DEE5] rounded-lg">
                <span className="text-[#5B6675] block text-[11px]">Residue Quantity</span>
                <span className="text-base font-bold text-emerald-800">{listing.quantityQuintals} Quintals</span>
                <span className="text-[10px] text-[#5B6675] block">≈ {(listing.quantityQuintals * 0.1).toFixed(1)} Metric Tonnes</span>
              </div>
              <div className="p-3 bg-white border border-[#D9DEE5] rounded-lg">
                <span className="text-[#5B6675] block text-[11px]">Farmer Asking Price</span>
                <span className="text-base font-bold text-[#1F3A5F]">
                  {listing.askingPricePerQuintal ? `₹${listing.askingPricePerQuintal} / Qtl` : 'Open for bids'}
                </span>
                <span className="text-[10px] text-[#5B6675] block">CPCB Benchmark: ₹180-₹220</span>
              </div>
            </div>

            <div className="p-3 bg-white border border-[#D9DEE5] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[#5B6675] block text-[11px]">Pickup Availability Window</span>
                <span className="font-semibold text-[#1B2430]">
                  {listing.availability.startDate} to {listing.availability.endDate}
                </span>
              </div>
              <Calendar className="w-4 h-4 text-[#5B6675]" />
            </div>

            {/* Privacy Shield Notice */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5 text-[11px] text-[#5B6675]">
              <Lock className="w-4 h-4 text-[#1F3A5F] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#1B2430] block">Farmer Contact is Protected</span>
                <p>
                  Farmer contact numbers are kept private and never exposed to the public. Phone numbers are unlocked only after an offer is explicitly accepted by the farmer.
                </p>
              </div>
            </div>

            {/* Report Listing Button */}
            <div className="pt-2 flex items-center justify-between border-t border-[#D9DEE5]">
              <span className="text-[11px] text-[#5B6675]">Found incorrect or fake details?</span>
              <button
                type="button"
                onClick={() => {
                  setShowReportModal(true);
                  setReportError(null);
                  setReportSuccess(null);
                }}
                className="text-[11px] text-[#5B6675] hover:text-[#C62828] font-medium flex items-center gap-1 transition-colors"
                title="Report this listing"
              >
                <Flag className="w-3 h-3" />
                <span>Report Listing</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Offers */}
        {activeTab === 'offers' && (
          <div className="space-y-3 text-xs">
            {loadingOffers ? (
              <div className="py-8 text-center text-[#5B6675]">Loading incoming offers...</div>
            ) : offers.length === 0 ? (
              <div className="py-8 text-center bg-[#F5F7FA] border border-[#D9DEE5] rounded-lg">
                <p className="font-semibold text-[#1B2430]">No offers submitted yet.</p>
                <p className="text-[#5B6675] text-[11px] mt-1">
                  Be the first bio-energy buyer or aggregator to submit a purchase offer.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('make_offer')}
                  className="mt-3 px-3 py-1.5 bg-[#1F3A5F] text-white rounded text-xs font-semibold"
                >
                  Submit an Offer
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {offers.map((off) => (
                  <div key={off.id} className="p-3 bg-white border border-[#D9DEE5] rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#1F3A5F]" />
                        <span className="font-bold text-xs text-[#1B2430]">{off.buyerName}</span>
                        {off.isDemo && (
                          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                            Demo
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-emerald-800 text-sm">₹{off.pricePerQuintal} / Qtl</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#5B6675] border-t border-[#F1F4F9] pt-2">
                      <div>
                        <span>Pickup Date: </span>
                        <strong className="text-[#1B2430]">{off.proposedPickupDate}</strong>
                      </div>
                      <div>
                        <span>Status: </span>
                        <strong className="capitalize text-[#1B2430]">{off.status}</strong>
                      </div>
                    </div>

                    {off.shortNote && (
                      <p className="text-[11px] text-[#5B6675] italic bg-[#F5F7FA] p-2 rounded">
                        &quot;{off.shortNote}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Make an Offer */}
        {activeTab === 'make_offer' && (
          <div className="space-y-3 text-xs">
            {offerSuccess ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center space-y-2 text-green-900">
                <Check className="w-6 h-6 text-green-700 mx-auto" />
                <p className="font-bold">Offer Submitted Successfully!</p>
                <p className="text-xs">
                  The farmer has received your offer. When accepted, contact details will be mutually unlocked.
                </p>
              </div>
            ) : (
              <form onSubmit={handleMakeOffer} className="space-y-3">
                {offerError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
                    {offerError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-[#5B6675] mb-1">
                    Select Buying Entity
                  </label>
                  <select
                    value={selectedBuyerId}
                    onChange={(e) => setSelectedBuyerId(e.target.value)}
                    className="w-full bg-white border border-[#D9DEE5] rounded-md p-2 text-xs text-[#1B2430] focus:ring-2 focus:ring-[#1F3A5F]"
                  >
                    <optgroup label="Preset Verified Plants / Buyers">
                      {DEMO_BUYERS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.district} · {b.type})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Direct / Custom Buyer">
                      <option value="custom">+ Enter Custom Organization / New Buyer</option>
                    </optgroup>
                  </select>
                </div>

                {selectedBuyerId === 'custom' && (
                  <div className="p-3 bg-[#F5F7FA] border border-[#D9DEE5] rounded-lg space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5B6675] mb-1">
                        Buyer / Organization Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Punjab Bio-Energy Pvt. Ltd."
                        value={customBuyerName}
                        onChange={(e) => setCustomBuyerName(e.target.value)}
                        className="w-full bg-white border border-[#D9DEE5] rounded-md p-2 text-xs text-[#1B2430] focus:ring-2 focus:ring-[#1F3A5F]"
                        required={selectedBuyerId === 'custom'}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5B6675] mb-1">
                          Buyer Type
                        </label>
                        <select
                          value={customBuyerType}
                          onChange={(e) => setCustomBuyerType(e.target.value as Offer['buyerType'])}
                          className="w-full bg-white border border-[#D9DEE5] rounded-md p-2 text-xs text-[#1B2430] focus:ring-2 focus:ring-[#1F3A5F]"
                        >
                          <option value="cbg_plant">Bio-CNG (CBG) Plant</option>
                          <option value="biomass_plant">Biomass Power Plant</option>
                          <option value="pellet_unit">Biomass Pellet Unit</option>
                          <option value="residue_buyer">Residue Off-Taker</option>
                          <option value="aggregator">Straw Aggregator</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#5B6675] mb-1">
                          Contact Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          placeholder="e.g. 9812345678"
                          value={customBuyerContact}
                          onChange={(e) => setCustomBuyerContact(e.target.value)}
                          className="w-full bg-white border border-[#D9DEE5] rounded-md p-2 text-xs text-[#1B2430] focus:ring-2 focus:ring-[#1F3A5F]"
                          required={selectedBuyerId === 'custom'}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5B6675] mb-1">
                      Offer Rate (₹ / Quintal)
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={1000}
                      value={offerRate}
                      onChange={(e) => setOfferRate(Number(e.target.value))}
                      className="w-full bg-white border border-[#D9DEE5] rounded-md p-2 text-xs text-[#1B2430] focus:ring-2 focus:ring-[#1F3A5F]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5B6675] mb-1">
                      Proposed Pickup Date
                    </label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full bg-white border border-[#D9DEE5] rounded-md p-2 text-xs text-[#1B2430] focus:ring-2 focus:ring-[#1F3A5F]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5B6675] mb-1">
                    Note for Farmer (e.g. baler loading requirements)
                  </label>
                  <textarea
                    rows={2}
                    value={buyerNote}
                    onChange={(e) => setBuyerNote(e.target.value)}
                    placeholder="We provide transport and baler loading within 48 hours..."
                    className="w-full bg-white border border-[#D9DEE5] rounded-md p-2 text-xs text-[#1B2430] focus:ring-2 focus:ring-[#1F3A5F]"
                  />
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Farmer contact is private and unlocked only after the farmer accepts.</span>
                </div>

                <button
                  type="submit"
                  disabled={submittingOffer}
                  className="w-full py-2.5 bg-[#1F3A5F] hover:bg-[#162C49] text-white rounded-md font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingOffer ? 'Submitting Offer...' : 'Submit Purchase Offer'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Report Listing Modal Popup */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#D9DEE5] rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[#D9DEE5] bg-[#F5F7FA] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1F3A5F] flex items-center gap-2">
                  <Flag className="w-4 h-4 text-[#C62828]" />
                  <span>Report Listing #{listing.id}</span>
                </h3>
                <p className="text-[11px] text-[#5B6675] mt-0.5">
                  {listing.village}, {listing.district}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                disabled={reportSubmitting}
                className="p-1.5 text-[#5B6675] hover:text-[#1B2430] hover:bg-slate-200/60 rounded-md transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReportListing} className="p-5 space-y-4 text-xs">
              {reportSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                  <span>{reportSuccess}</span>
                </div>
              )}

              {reportError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#C62828] shrink-0 mt-0.5" />
                  <span>{reportError}</span>
                </div>
              )}

              <div>
                <label className="block text-[#1B2430] font-semibold mb-1">
                  Reason for Complaint <span className="text-red-500">*</span>
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D9DEE5] rounded-md text-xs text-[#1B2430] bg-white focus:outline-none focus:ring-1 focus:ring-[#1F3A5F]"
                >
                  <option value="fake_listing_or_bid">Fake or non-existent stubble listing</option>
                  <option value="incorrect_quantity_quality">Inaccurate quantity or poor straw quality</option>
                  <option value="unresponsive_contact">Farmer unreachable after accepted offer</option>
                  <option value="no_show_pickup">Residue was already burnt or refused pickup</option>
                  <option value="inappropriate_behavior">Unprofessional or inappropriate conduct</option>
                  <option value="other">Other issue</option>
                </select>
              </div>

              <div>
                <label className="block text-[#1B2430] font-semibold mb-1">
                  Details <span className="text-[#5B6675] font-normal">(Optional, max 500 characters)</span>
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Provide details about the issue..."
                  className="w-full px-3 py-2 border border-[#D9DEE5] rounded-md text-xs text-[#1B2430] bg-white focus:outline-none focus:ring-1 focus:ring-[#1F3A5F]"
                />
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Listings receiving more than 3 valid reports are flagged for coordinator review and blacklisting.
                </span>
              </div>

              <div className="pt-2 border-t border-[#D9DEE5] flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={reportSubmitting}
                  onClick={() => setShowReportModal(false)}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-[#D9DEE5] text-[#5B6675] rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="px-4 py-1.5 bg-[#C62828] hover:bg-[#B71C1C] disabled:opacity-50 text-white rounded-md font-semibold"
                >
                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Modal>
  );
}
