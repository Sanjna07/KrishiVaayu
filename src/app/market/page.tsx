'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { MarketMap } from '@/components/MarketMap';
import { ListingModal } from '@/components/ListingModal';
import { PUNJAB_DISTRICTS } from '@/lib/marketDict';
import { useLanguage } from '@/context/LanguageContext';
import { useLocation } from '@/context/LocationContext';
import type { PublicListing } from '@/lib/marketSanitizer';
import {
  Filter,
  PlusCircle,
  ExternalLink,
  Navigation,
} from 'lucide-react';

export default function MarketBrowsePage() {
  const { t } = useLanguage();
  const { userLocation } = useLocation();
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters (auto-defaults to user's detected GPS district if available)
  const [filterDistrict, setFilterDistrict] = useState<string>('All');
  const [filterForm, setFilterForm] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [hasUserManuallyFiltered, setHasUserManuallyFiltered] = useState(false);

  // When GPS location is detected or changes, auto-select their district
  useEffect(() => {
    if (userLocation?.district && !hasUserManuallyFiltered) {
      setFilterDistrict(userLocation.district);
    }
  }, [userLocation, hasUserManuallyFiltered]);

  // Selected Listing & Modal State
  const [selectedListing, setSelectedListing] = useState<PublicListing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // User Role
  const [userRole, setUserRole] = useState<'public' | 'buyer' | 'farmer'>('public');

  const fetchMarketListings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterDistrict !== 'All') params.append('district', filterDistrict);
      if (filterForm !== 'All') params.append('form', filterForm);
      if (filterStatus !== 'All') params.append('status', filterStatus);

      const res = await fetch(`/api/market/listings?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load listings');

      setListings(data.listings);
      setLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching listings');
      setLoading(false);
    }
  }, [filterDistrict, filterForm, filterStatus]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const params = new URLSearchParams();
        if (filterDistrict !== 'All') params.append('district', filterDistrict);
        if (filterForm !== 'All') params.append('form', filterForm);
        if (filterStatus !== 'All') params.append('status', filterStatus);

        const res = await fetch(`/api/market/listings?${params.toString()}`);
        const data = await res.json();
        if (!ignore && res.ok) {
          setListings(data.listings);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Error fetching listings');
          setLoading(false);
        }
      }
    };
    run();
    return () => { ignore = true; };
  }, [filterDistrict, filterForm, filterStatus]);

  const handleOpenModal = (listing: PublicListing) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'listed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">{t.market.statusOpen}</span>;
      case 'offered':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">{t.market.statusOffered}</span>;
      case 'accepted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">{t.market.statusAccepted}</span>;
      case 'pickup_scheduled':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">{t.market.statusScheduled}</span>;
      case 'collected':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">{t.market.statusCollected}</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1B2430] flex flex-col">
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
        {/* Subheader & Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9DEE5] pb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1F3A5F]">{t.market.title}</h1>
            <p className="text-xs text-[#5B6675] mt-0.5">
              {t.market.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/market/sell"
              className="px-4 py-2 bg-[#2E7D32] hover:bg-[#236327] text-white text-xs sm:text-sm font-semibold rounded-md flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.market.listStubbleBtn}</span>
            </Link>
          </div>
        </div>

        {/* Filter Toolbar Card */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1F3A5F] uppercase tracking-wider">
              <Filter className="w-4 h-4 text-[#1F3A5F]" />
              <span>{t.market.filterFeed}</span>
            </div>

            {/* GPS Auto-selected Indicator pill */}
            {userLocation && filterDistrict === userLocation.district && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md text-xs font-semibold shadow-2xs">
                <Navigation className="w-3 h-3 text-[#2E7D32] fill-emerald-600" />
                <span>📍 {userLocation.district} ({userLocation.state})</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilterDistrict('All');
                    setHasUserManuallyFiltered(true);
                  }}
                  className="ml-1 text-emerald-700 hover:text-emerald-950 text-xs font-bold"
                  title="Show all districts"
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* District Filter (manual override enabled) */}
            <select
              value={filterDistrict}
              onChange={(e) => {
                setFilterDistrict(e.target.value);
                setHasUserManuallyFiltered(true);
              }}
              className="bg-white border border-[#D9DEE5] rounded-md px-3 py-1.5 text-xs text-[#1B2430] focus:ring-2 focus:ring-[#1F3A5F]"
            >
              <option value="All">{t.market.allDistricts}</option>
              {PUNJAB_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Form Filter */}
            <select
              value={filterForm}
              onChange={(e) => setFilterForm(e.target.value)}
              className="bg-white border border-[#D9DEE5] rounded-md px-3 py-1.5 text-xs text-[#1B2430] focus:ring-2 focus:ring-[#1F3A5F]"
            >
              <option value="All">{t.market.allStrawForms}</option>
              <option value="baled">{t.market.formBaled}</option>
              <option value="loose">{t.market.formLoose}</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-[#D9DEE5] rounded-md px-3 py-1.5 text-xs text-[#1B2430] focus:ring-2 focus:ring-[#1F3A5F]"
            >
              <option value="All">{t.market.allStatuses}</option>
              <option value="listed">{t.market.statusOpen}</option>
              <option value="offered">{t.market.statusOffered}</option>
              <option value="accepted">{t.market.statusAccepted}</option>
              <option value="pickup_scheduled">{t.market.statusScheduled}</option>
              <option value="collected">{t.market.statusCollected}</option>
            </select>
          </div>
        </div>

        {/* 2-Column Split: Listings Scrollable Feed (Left) + Synced Map (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Listings Feed (7 cols) - Scrollable with height calibrated for ~4 boxes */}
          <div className="lg:col-span-7">
            <div className="h-[620px] overflow-y-auto pr-2 space-y-3 rounded-lg scrollbar-thin">
              {loading && (
                <div className="text-center py-12 text-[#5B6675] text-xs">Loading marketplace listings...</div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-xs">
                  {error}
                </div>
              )}

              {!loading && listings.length === 0 && (
                <div className="bg-white border border-[#D9DEE5] rounded-lg p-8 text-center text-xs space-y-2">
                  <p className="font-semibold text-[#1B2430]">{t.market.noListings}</p>
                  <p className="text-[#5B6675]">{t.market.resetFilters}</p>
                  <button
                    onClick={() => { setFilterDistrict('All'); setFilterForm('All'); setFilterStatus('All'); }}
                    className="mt-2 px-3 py-1.5 bg-[#1F3A5F] text-white rounded text-xs font-semibold"
                  >
                    {t.market.resetFilters}
                  </button>
                </div>
              )}

              {listings.map((l) => (
                <div
                  key={l.id}
                  onClick={() => handleOpenModal(l)}
                  className="bg-white border border-[#D9DEE5] hover:border-[#1F3A5F] rounded-lg p-4 cursor-pointer transition-all shadow-xs hover:shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-[#1B2430]">
                          {l.village}, <span className="text-[#5B6675] font-normal">{l.district}</span>
                        </h2>
                        {l.isDemo && (
                          <span className="text-[10px] uppercase font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded">
                            Demo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#5B6675] mt-0.5">
                        {l.availability.startDate} — {l.availability.endDate}
                      </p>
                    </div>
                    {getStatusBadge(l.status)}
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#E5E9F0] text-xs">
                    <div>
                      <span className="text-[#5B6675] block text-[11px]">{t.market.residueAvailable}</span>
                      <span className="font-bold text-emerald-800 text-sm">{l.quantityQuintals} {t.market.perQtl}</span>
                    </div>
                    <div>
                      <span className="text-[#5B6675] block text-[11px]">{t.market.residueForm}</span>
                      <span className="font-semibold text-[#1B2430]">
                        {l.form === 'baled' ? t.market.formBaled : t.market.formLoose}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#5B6675] block text-[11px]">{t.market.askingPrice}</span>
                      <span className="font-semibold text-[#1F3A5F]">
                        {l.askingPricePerQuintal ? `₹${l.askingPricePerQuintal} / ${t.market.perQtl}` : t.market.openPrice}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[#5B6675] text-[11px]">
                      {l.offersCount !== undefined ? `${l.offersCount} ${t.market.viewOffers}` : t.market.viewOffers}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(l);
                      }}
                      className="px-4 py-1.5 bg-[#2E7D32] hover:bg-[#236327] active:scale-98 text-white text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <span>Buy</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Synced Map (5 cols) - Matches Listings Height Exactly */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#D9DEE5] rounded-lg overflow-hidden shadow-xs h-[620px]">
              <MarketMap
                listings={listings}
                selectedListing={selectedListing}
                onSelectListing={(l) => handleOpenModal(l as PublicListing)}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Role-Aware Listing Modal (Replaces old detail panel) */}
      <ListingModal
        listing={selectedListing}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userRole={userRole}
        onRoleChange={setUserRole}
        onOfferSubmitted={fetchMarketListings}
      />
    </div>
  );
}
