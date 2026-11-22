'use client';

import React, { useState } from 'react';
import { useLocation } from '@/context/LocationContext';
import { useLanguage } from '@/context/LanguageContext';
import { Navigation, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function GpsButton() {
  const { userLocation, isGpsLoading, gpsError, gpsSuccess, requestGpsLocation } = useLocation();
  const { lang } = useLanguage();
  const [showToast, setShowToast] = useState(false);

  const handleClick = async () => {
    const loc = await requestGpsLocation(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const getLabel = () => {
    if (isGpsLoading) {
      return lang === 'pa' ? 'ਲੱਭ ਰਿਹਾ...' : lang === 'hi' ? 'खोज रहा...' : 'Locating...';
    }
    if (userLocation) {
      return userLocation.tehsil || userLocation.district;
    }
    return lang === 'pa' ? 'ਜੀ.ਪੀ.ਐਸ (GPS)' : lang === 'hi' ? 'जीपीएस (GPS)' : 'GPS';
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={isGpsLoading}
        title={
          userLocation
            ? `Current GPS: ${[userLocation.village, userLocation.tehsil, userLocation.district, userLocation.state].filter(Boolean).join(', ')} (Click to refresh)`
            : 'Click to detect your farm/district location via GPS'
        }
        className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer shadow-2xs ${
          userLocation
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
            : 'bg-[#F5F7FA] text-[#1F3A5F] border-[#D9DEE5] hover:bg-white hover:border-[#1F3A5F]'
        }`}
      >
        {isGpsLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1F3A5F]" />
        ) : userLocation ? (
          <Navigation className="w-3.5 h-3.5 text-[#2E7D32] fill-emerald-600 shrink-0" />
        ) : (
          <Navigation className="w-3.5 h-3.5 text-[#5B6675] shrink-0" />
        )}
        <span className="truncate max-w-[110px] sm:max-w-[140px]">
          {getLabel()}
        </span>
      </button>

      {/* Ephemeral Feedback Toast */}
      {showToast && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-[#D9DEE5] rounded-lg shadow-lg p-2.5 text-xs text-[#1B2430] w-64 animate-in fade-in slide-in-from-top-1 duration-200">
          {gpsSuccess ? (
            <div className="flex items-start gap-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[11px] text-emerald-950">
                  {lang === 'pa' ? 'ਸਥਾਨ ਮਿਲ ਗਿਆ!' : lang === 'hi' ? 'स्थान मिल गया!' : 'Location Detected!'}
                </p>
                <p className="text-[10px] text-emerald-800 mt-0.5 leading-tight">
                  📍 {gpsSuccess}
                </p>
                <p className="text-[9px] text-[#5B6675] mt-1">
                  {lang === 'pa'
                    ? 'ਫਾਰਮ ਅਤੇ ਮਾਰਕੀਟ ਫਿਲਟਰ ਆਪਣੇ ਆਪ ਚੁਣੇ ਗਏ ਹਨ।'
                    : lang === 'hi'
                    ? 'फॉर्म और मार्केट फ़िल्टर अपने आप सेट हो गए हैं।'
                    : 'Forms and market filters have been auto-configured.'}
                </p>
              </div>
            </div>
          ) : gpsError ? (
            <div className="flex items-start gap-2 text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[11px] text-red-950">
                  {lang === 'pa' ? 'ਜੀ.ਪੀ.ਐਸ ਗਲਤੀ' : lang === 'hi' ? 'जीपीएस त्रुटि' : 'Location Notice'}
                </p>
                <p className="text-[10px] text-red-700 mt-0.5 leading-tight">
                  {gpsError}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
