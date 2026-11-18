'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  marketDict,
  PUNJAB_DISTRICTS,
  type MarketLang,
} from '@/lib/marketDict';
import type { StrawForm } from '@/types/market';
import {
  MapPin,
  Scale,
  Calendar,
  Phone,
  ShieldCheck,
  Check,
  Copy,
  Share2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Truck,
  CheckCircle2,
} from 'lucide-react';

function SellFlowForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Language state
  const [lang, setLang] = useState<MarketLang>('en');
  const t = marketDict[lang];

  // Pre-filled URL query parameters (from WhatsApp farmer alert deep link)
  const initialDistrict = searchParams.get('district') || 'Sangrur';
  const initialVillage = searchParams.get('village') || '';
  const refSource = searchParams.get('ref');

  // Multi-step wizard state (1, 2, 3, or 'success')
  const [step, setStep] = useState<1 | 2 | 3 | 'success'>(1);

  // Form fields
  const [village, setVillage] = useState(initialVillage);
  const [district, setDistrict] = useState(initialDistrict);
  const [state] = useState('Punjab');
  const [quantity, setQuantity] = useState<number | string>(200);
  const [form, setForm] = useState<StrawForm>('baled');

  // Dates initialized lazily
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });

  const [askingPrice, setAskingPrice] = useState<number | string>('210');
  const [phone, setPhone] = useState('');

  // Status & Validation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Created Listing results
  const [createdListingId, setCreatedListingId] = useState<string>('');
  const [createdEditToken, setCreatedEditToken] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Quick quantity chip helper
  const quickQuantities = [100, 200, 350, 500, 1000];

  // Step 1 validation
  const handleStep1Next = () => {
    setErrorMsg(null);
    if (!village.trim()) {
      setErrorMsg(lang === 'pa' ? 'ਕਿਰਪਾ ਕਰਕੇ ਪਿੰਡ ਦਾ ਨਾਂ ਦਰਜ ਕਰੋ।' : lang === 'hi' ? 'कृपया गांव का नाम दर्ज करें।' : 'Please enter your village name.');
      return;
    }
    setStep(2);
  };

  // Step 2 validation
  const handleStep2Next = () => {
    setErrorMsg(null);
    const qty = Number(quantity);
    if (isNaN(qty) || qty < 1) {
      setErrorMsg(lang === 'pa' ? 'ਘੱਟੋ-ਘੱਟ 1 ਕੁਇੰਟਲ ਮਾਤਰਾ ਦਰਜ ਕਰੋ।' : lang === 'hi' ? 'कम से कम 1 क्विंटल मात्रा दर्ज करें।' : 'Quantity must be at least 1 quintal.');
      return;
    }
    setStep(3);
  };

  // Step 3 submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const cleanPhone = phone.trim().replace(/[\s\-\(\)]/g, '');
      const phoneMatch = cleanPhone.match(/^(?:\+91|91|0)?([6-9]\d{9})$/);
      if (!phoneMatch) {
        setErrorMsg(
          lang === 'pa'
            ? 'ਕਿਰਪਾ ਕਰਕੇ 10 ਅੰਕਾਂ ਦਾ ਜਾਇਜ਼ ਭਾਰਤੀ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ (6-9 ਤੋਂ ਸ਼ੁਰੂ)।'
            : lang === 'hi'
            ? 'कृपया 10 अंकों का वैध भारतीय मोबाइल नंबर दर्ज करें (6-9 से शुरू)।'
            : 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'
        );
        setIsSubmitting(false);
        return;
      }

      const payload = {
        village: village.trim(),
        district: district.trim(),
        state,
        quantityQuintals: Number(quantity),
        form,
        startDate,
        endDate,
        askingPricePerQuintal: askingPrice ? Number(askingPrice) : undefined,
        phone: phoneMatch[1],
      };

      const res = await fetch('/api/market/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish listing');
      }

      setCreatedListingId(data.listing.id);
      setCreatedEditToken(data.editToken);
      setStep('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish listing';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Management URL generator
  // Canonical management URL generator
  const getManageUrl = () => {
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || 'https://krishi-vaayu.vercel.app';
    const cleanOrigin = origin.replace(/\/+$/, '');
    return `${cleanOrigin}/market/manage/${encodeURIComponent(createdEditToken.trim())}`;
  };

  const handleCopyLink = async () => {
    const url = getManageUrl();
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
      setTimeout(() => setCopiedLink(false), 2500);
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
        setTimeout(() => setCopiedLink(false), 2500);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const handleShareWhatsApp = () => {
    const manageUrl = getManageUrl();
    const shareText = encodeURIComponent(
      `🌾 KrishiVayu Listing #${createdListingId}\nVillage: ${village}, ${district}\nQuantity: ${quantity} Quintals (${form})\nManage Listing & View Buyer Offers:\n${manageUrl}`
    );
    window.open(`https://wa.me/?text=${shareText}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1B2430] flex flex-col">

      {/* Tricolor Government Portal Accent Bar */}
      <div className="h-1 w-full grid grid-cols-3">
        <div className="bg-[#FF9933]" />
        <div className="bg-[#FFFFFF]" />
        <div className="bg-[#138808]" />
      </div>

      {/* Header with Language Selector & Marketplace Branding */}
      <header className="border-b border-[#D9DEE5] bg-white sticky top-0 z-20 px-4 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/market"
            className="flex items-center gap-2 group focus-visible:ring-2 focus-visible:ring-[#1F3A5F] rounded-md transition-colors"
            title="Return to Residue Marketplace"
          >
            <span className="text-2xl" role="img" aria-label="Rice Paddy">🌾</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-[#1F3A5F] group-hover:text-[#162C49] transition-colors">
                KrishiVayu
              </span>
              <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                Marketplace
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-[#F5F7FA] rounded-md p-0.5 border border-[#D9DEE5] text-xs">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  lang === 'en' ? 'bg-[#1F3A5F] text-white font-medium shadow-xs' : 'text-[#5B6675] hover:text-[#1B2430]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  lang === 'hi' ? 'bg-[#1F3A5F] text-white font-medium shadow-xs' : 'text-[#5B6675] hover:text-[#1B2430]'
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLang('pa')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  lang === 'pa' ? 'bg-[#1F3A5F] text-white font-medium shadow-xs' : 'text-[#5B6675] hover:text-[#1B2430]'
                }`}
              >
                ਪੰਜਾਬੀ
              </button>
            </div>

            <Link
              href="/market"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#1F3A5F] hover:bg-slate-50 font-semibold border border-[#D9DEE5] rounded-md transition-colors shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Browse Market</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumbs & Title Section */}
      <div className="max-w-2xl w-full mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center gap-2 text-xs text-[#5B6675] mb-2 font-medium">
          <Link href="/" className="hover:text-[#1F3A5F] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/market" className="hover:text-[#1F3A5F] transition-colors">Residue Marketplace</Link>
          <span>/</span>
          <span className="text-[#1F3A5F] font-semibold">List Stubble for Free</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9DEE5] pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A5F]">
              🌾 {lang === 'pa' ? 'ਪਰਾਲੀ ਮੁਫ਼ਤ ਦਰਜ ਕਰੋ' : lang === 'hi' ? 'पराली निःशुल्क लिस्ट करें' : 'List Paddy Stubble for Sale'}
            </h1>
            <p className="text-xs text-[#5B6675] mt-1">
              {lang === 'pa'
                ? 'ਨੇੜਲੇ ਬਾਇਓ-ਗੈਸ ਪਲਾਂਟਾਂ ਅਤੇ ਪੈਲੇਟ ਖਰੀਦਦਾਰਾਂ ਨਾਲ ਸਿੱਧਾ ਜੁੜੋ ਬਿਨਾਂ ਕਿਸੇ ਵਿਚੋਲੇ ਦੇ।'
                : lang === 'hi'
                ? 'नजदीकी बायो-सीएनजी व पेलेट खरीदारों से सीधे संपर्क करें, बिना किसी बिचौलिए के।'
                : 'Connect directly with certified bio-CNG plants, pellet units, and aggregators across Punjab & Haryana.'}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
            <span>100% Free Public Portal</span>
          </span>
        </div>
      </div>

      {/* Main Container: Centered Layout */}
      <main className="max-w-2xl w-full mx-auto px-4 py-6 flex-1">
        {/* Deep-link notification pill if arrived via WhatsApp alert */}
        {refSource === 'wa' && step !== 'success' && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2E7D32] shrink-0" />
            <span>
              Prefilled from your WhatsApp Crop Burn Advisory for District {district}.
            </span>
          </div>
        )}

        {/* Stepper Progress Bar (Portal style) */}
        {step !== 'success' && (
          <div className="mb-6 bg-white border border-[#D9DEE5] rounded-xl p-4 shadow-xs">
            <div className="grid grid-cols-3 gap-2">
              <div className={`flex items-center gap-2.5 pb-1 border-b-2 transition-colors ${step >= 1 ? 'border-[#2E7D32]' : 'border-transparent'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step > 1 ? 'bg-[#2E7D32] text-white' : step === 1 ? 'bg-[#1F3A5F] text-white' : 'bg-[#E5E9EE] text-[#5B6675]'
                }`}>
                  {step > 1 ? '✓' : '1'}
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${step >= 1 ? 'text-[#1F3A5F]' : 'text-[#8892A0]'}`}>
                    1. Location
                  </p>
                  <p className="text-[10px] text-[#5B6675] hidden sm:block truncate">Village & District</p>
                </div>
              </div>

              <div className={`flex items-center gap-2.5 pb-1 border-b-2 transition-colors ${step >= 2 ? 'border-[#2E7D32]' : 'border-transparent'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step > 2 ? 'bg-[#2E7D32] text-white' : step === 2 ? 'bg-[#1F3A5F] text-white' : 'bg-[#E5E9EE] text-[#5B6675]'
                }`}>
                  {step > 2 ? '✓' : '2'}
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${step >= 2 ? 'text-[#1F3A5F]' : 'text-[#8892A0]'}`}>
                    2. Quantity
                  </p>
                  <p className="text-[10px] text-[#5B6675] hidden sm:block truncate">Quintals & Form</p>
                </div>
              </div>

              <div className={`flex items-center gap-2.5 pb-1 border-b-2 transition-colors ${step >= 3 ? 'border-[#2E7D32]' : 'border-transparent'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step === 3 ? 'bg-[#1F3A5F] text-white' : 'bg-[#E5E9EE] text-[#5B6675]'
                }`}>
                  3
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${step === 3 ? 'text-[#1F3A5F]' : 'text-[#8892A0]'}`}>
                    3. Price & Alert
                  </p>
                  <p className="text-[10px] text-[#5B6675] hidden sm:block truncate">Timing & SMS Phone</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inline Error Alert */}
        {errorMsg && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-lg p-3.5 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Centered Form Wizard */}
        {step !== 'success' ? (
          <div className="space-y-6">
              {/* STEP 1: WHERE */}
              {step === 1 && (
                <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#D9DEE5]">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#2E7D32]">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-[#1F3A5F]">{t.step1Title}</h2>
                      <p className="text-xs text-[#5B6675]">{t.step1Desc}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1F3A5F] mb-1.5">
                        {t.districtLabel} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full min-h-[44px] bg-white border border-[#D9DEE5] rounded-md px-3.5 py-2 text-sm text-[#1B2430] focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]"
                      >
                        {PUNJAB_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1F3A5F] mb-1.5">
                        {t.villageLabel} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        placeholder={t.villagePlaceholder}
                        className="w-full min-h-[44px] bg-white border border-[#D9DEE5] rounded-md px-3.5 py-2 text-sm text-[#1B2430] placeholder-[#8892A0] focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]"
                      />
                    </div>

                    <div className="pt-4 flex justify-between items-center border-t border-[#D9DEE5]">
                      <Link
                        href="/market"
                        className="min-h-[40px] px-3.5 py-2 text-xs font-medium text-[#5B6675] hover:text-[#1F3A5F] flex items-center gap-1.5 transition-colors border border-[#D9DEE5] rounded-md bg-white hover:bg-slate-50"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Cancel
                      </Link>
                      <button
                        type="button"
                        onClick={handleStep1Next}
                        className="min-h-[40px] px-5 py-2 bg-[#2E7D32] hover:bg-[#236327] text-white text-xs font-semibold rounded-md flex items-center gap-2 transition-colors shadow-xs"
                      >
                        <span>{t.nextBtn}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: HOW MUCH */}
              {step === 2 && (
                <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#D9DEE5]">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#2E7D32]">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-[#1F3A5F]">{t.step2Title}</h2>
                      <p className="text-xs text-[#5B6675]">{t.step2Desc}</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* Quantity in Quintals */}
                    <div>
                      <label className="block text-xs font-semibold text-[#1F3A5F] mb-1.5">
                        {t.quantityLabel} <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="number"
                          min="1"
                          max="50000"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          className="w-full min-h-[44px] bg-white border border-[#D9DEE5] rounded-md px-3.5 py-2 text-base font-bold text-[#1B2430] focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]"
                        />
                        <span className="text-xs font-semibold text-[#5B6675] px-3 py-2.5 bg-[#F5F7FA] border border-[#D9DEE5] rounded-md shrink-0">
                          Quintals
                        </span>
                      </div>

                      {/* Quick Selection Chips */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {quickQuantities.map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setQuantity(q)}
                            className={`min-h-[32px] px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                              Number(quantity) === q
                                ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold'
                                : 'bg-white border-[#D9DEE5] text-[#5B6675] hover:border-[#1F3A5F] hover:text-[#1B2430]'
                            }`}
                          >
                            {q} Qtl
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Form of Straw */}
                    <div>
                      <label className="block text-xs font-semibold text-[#1F3A5F] mb-2">
                        {t.formLabel} <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setForm('baled')}
                          className={`p-3.5 rounded-lg border text-left min-h-[64px] transition-all flex flex-col justify-center ${
                            form === 'baled'
                              ? 'bg-emerald-50/70 border-[#2E7D32] ring-1 ring-[#2E7D32] text-[#1B2430]'
                              : 'bg-white border-[#D9DEE5] text-[#5B6675] hover:border-[#1F3A5F]'
                          }`}
                        >
                          <span className="font-bold text-xs text-[#1F3A5F]">📦 Baled Bundles</span>
                          <span className="text-[11px] text-[#5B6675] mt-0.5">{t.formBaled}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setForm('loose')}
                          className={`p-3.5 rounded-lg border text-left min-h-[64px] transition-all flex flex-col justify-center ${
                            form === 'loose'
                              ? 'bg-emerald-50/70 border-[#2E7D32] ring-1 ring-[#2E7D32] text-[#1B2430]'
                              : 'bg-white border-[#D9DEE5] text-[#5B6675] hover:border-[#1F3A5F]'
                          }`}
                        >
                          <span className="font-bold text-xs text-[#1F3A5F]">🌾 Loose Straw</span>
                          <span className="text-[11px] text-[#5B6675] mt-0.5">{t.formLoose}</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-between items-center border-t border-[#D9DEE5]">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="min-h-[40px] px-3.5 py-2 text-xs font-medium text-[#5B6675] hover:text-[#1F3A5F] flex items-center gap-1.5 transition-colors border border-[#D9DEE5] rounded-md bg-white hover:bg-slate-50"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> {t.backBtn}
                      </button>
                      <button
                        type="button"
                        onClick={handleStep2Next}
                        className="min-h-[40px] px-5 py-2 bg-[#2E7D32] hover:bg-[#236327] text-white text-xs font-semibold rounded-md flex items-center gap-2 transition-colors shadow-xs"
                      >
                        <span>{t.nextBtn}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: WHEN & PRICE */}
              {step === 3 && (
                <form
                  onSubmit={handleSubmit}
                  className="bg-white border border-[#D9DEE5] rounded-xl p-5 sm:p-6 shadow-xs"
                >
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#D9DEE5]">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#2E7D32]">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-[#1F3A5F]">{t.step3Title}</h2>
                      <p className="text-xs text-[#5B6675]">{t.step3Desc}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Availability Window */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#1F3A5F] mb-1">
                          {t.startAvailability}
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full min-h-[42px] bg-white border border-[#D9DEE5] rounded-md px-3 py-2 text-xs text-[#1B2430] focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#1F3A5F] mb-1">
                          {t.endAvailability}
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full min-h-[42px] bg-white border border-[#D9DEE5] rounded-md px-3 py-2 text-xs text-[#1B2430] focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]"
                        />
                      </div>
                    </div>

                    {/* Price & Benchmark Reference (Q4) */}
                    <div>
                      <label className="block text-xs font-semibold text-[#1F3A5F] mb-1">
                        {t.priceLabel}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-[#5B6675] font-semibold text-sm">₹</span>
                        <input
                          type="number"
                          min="1"
                          max="5000"
                          placeholder="e.g. 210"
                          value={askingPrice}
                          onChange={(e) => setAskingPrice(e.target.value)}
                          className="w-full min-h-[42px] bg-white border border-[#D9DEE5] rounded-md pl-8 pr-3.5 py-2 text-sm font-bold text-[#1B2430] focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]"
                        />
                      </div>
                      {/* Benchmark indicator */}
                      <div className="mt-1.5 text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-md p-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#2E7D32]" />
                        <span>{t.priceBenchmark}</span>
                      </div>
                    </div>

                    {/* Phone & Privacy Notice */}
                    <div>
                      <label className="block text-xs font-bold text-[#1F3A5F] mb-1">
                        {t.optionalPhoneLabel}
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#5B6675] absolute left-3 top-3" />
                        <span className="absolute left-8 top-2.5 text-xs font-semibold text-[#5B6675]">+91</span>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 9876543210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full min-h-[42px] bg-white border border-[#D9DEE5] rounded-md pl-16 pr-3.5 py-2 text-sm font-semibold text-[#1B2430] placeholder-[#8892A0] focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]"
                        />
                      </div>
                      <div className="mt-2 text-xs text-[#1F3A5F] bg-blue-50 border border-blue-200 rounded-md p-2.5 leading-relaxed">
                        <p className="font-semibold mb-0.5">🔒 SMS Alert & Privacy Guarantee:</p>
                        <p>{t.phonePrivacyNotice}</p>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-between items-center border-t border-[#D9DEE5]">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="min-h-[40px] px-3.5 py-2 text-xs font-medium text-[#5B6675] hover:text-[#1F3A5F] flex items-center gap-1.5 transition-colors border border-[#D9DEE5] rounded-md bg-white hover:bg-slate-50"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> {t.backBtn}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="min-h-[40px] px-6 py-2 bg-[#2E7D32] hover:bg-[#236327] disabled:bg-slate-300 text-white text-xs font-semibold rounded-md flex items-center gap-2 transition-colors shadow-xs"
                      >
                        {isSubmitting ? t.submittingBtn : t.submitBtn}
                      </button>
                    </div>
                  </div>
                </form>
              )}
          </div>
        ) : (
          /* SUCCESS SCREEN */
          <div className="max-w-2xl mx-auto bg-white border border-[#D9DEE5] rounded-xl p-6 sm:p-8 shadow-xs">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-[#2E7D32] flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-[#1F3A5F] mb-1.5">{t.successTitle}</h2>
              <p className="text-xs text-[#5B6675] max-w-md mx-auto mb-6">{t.successSub}</p>
            </div>

            {/* Listing Summary Card */}
            <div className="bg-[#F5F7FA] border border-[#D9DEE5] rounded-lg p-4 mb-4 text-xs space-y-2">
              <div className="flex justify-between items-center text-[#5B6675]">
                <span>Listing ID:</span>
                <span className="font-mono font-bold text-[#1F3A5F]">#{createdListingId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5B6675]">Location:</span>
                <span className="font-medium text-[#1B2430]">{village}, {district}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5B6675]">Residue Available:</span>
                <span className="font-bold text-[#2E7D32]">{quantity} Quintals ({form})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5B6675]">Asking Price:</span>
                <span className="font-bold text-[#1F3A5F]">₹{askingPrice || '210'} / Quintal</span>
              </div>
            </div>

            {/* Private Management Link Card */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2.5 mb-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-[#1F3A5F]">Your Private Farmer Dashboard Link</h3>
                  <p className="text-[11px] text-[#5B6675] mt-0.5 leading-relaxed">
                    {t.editLinkNotice} (A Fast2SMS alert has also been dispatched to your mobile number).
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="min-h-[40px] px-3.5 py-2 bg-white hover:bg-slate-50 text-[#1F3A5F] font-semibold text-xs rounded-md flex items-center justify-center gap-2 transition-colors border border-[#D9DEE5] shadow-xs"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                      <span className="text-[#2E7D32]">{t.copiedBtn}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t.copyLinkBtn}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="min-h-[40px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{t.saveToWhatsAppBtn}</span>
                </button>
              </div>
            </div>

            {/* Direct Dashboard & Browse Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => router.push(`/market/manage/${createdEditToken}`)}
                className="flex-1 min-h-[42px] px-4 py-2.5 bg-[#2E7D32] hover:bg-[#236327] text-white font-semibold text-xs rounded-md flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <span>{t.openDashboardBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <Link
                href="/market"
                className="min-h-[42px] px-4 py-2.5 bg-white hover:bg-[#F5F7FA] text-[#1F3A5F] font-semibold text-xs rounded-md flex items-center justify-center transition-colors border border-[#D9DEE5]"
              >
                {t.browseMarketBtn}
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SellPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F7FA] text-[#5B6675] p-8">Loading...</div>}>
      <SellFlowForm />
    </Suspense>
  );
}
