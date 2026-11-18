export type Language = 'en' | 'hi' | 'pa';

export interface Translations {
  nav: {
    brandName: string;
    brandTagline: string;
    alertMatch: string;
    residueMarket: string;
    historicalTrends: string;
  };
  home: {
    hotspotsDetected: string;
    activeViirs: string;
    highThreatDistricts: string;
    scoreThreshold: string;
    prevailingWind: string;
    towardsNcr: string;
    cleanAlternatives: string;
    facilitiesCount: string;
    facilitiesType: string;
    cachedSnapshot: string;
    refreshTooltip: string;
    riskMapTab: string;
    districtRankingTab: string;
    searchPlaceholder: string;
    allDistricts: string;
    showingDistricts: string;
    districtsWord: string;
    exportCsv: string;
    noDistrictsFound: string;
    adjustSearch: string;
    fires: string;
    kmToNcr: string;
    downwind: string;
  };
  market: {
    title: string;
    subtitle: string;
    listStubbleBtn: string;
    filterFeed: string;
    allDistricts: string;
    allStrawForms: string;
    formBaled: string;
    formLoose: string;
    allStatuses: string;
    statusOpen: string;
    statusOffered: string;
    statusAccepted: string;
    statusScheduled: string;
    statusCollected: string;
    loadingListings: string;
    noListings: string;
    resetFilters: string;
    residueAvailable: string;
    residueForm: string;
    askingPrice: string;
    viewOffers: string;
    viewDetailsBid: string;
    cleanAlternativesSidebar: string;
    stateRegistry: string;
    openPrice: string;
    perQtl: string;
    approxDistance: string;
  };
  drawer: {
    riskAssessment: string;
    activeFires: string;
    plumeAlignment: string;
    distanceNcr: string;
    recommendedAlternatives: string;
    farmerAdvisory: string;
    sendWhatsApp: string;
    copyAdvisory: string;
    advisoryCopied: string;
    close: string;
    viewAlternativeDetails: string;
    availableEquipment: string;
    callFacility: string;
  };
  trends: {
    title: string;
    subtitle: string;
    paddySeason: string;
    wheatSeason: string;
    stateComparison: string;
    districtLeaderboard: string;
    exportCsv: string;
    totalFires: string;
    firesUnit: string;
    year: string;
    district: string;
    state: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      brandName: 'KrishiVayu',
      brandTagline: 'Burn Alert to Clean Residue Market',
      alertMatch: 'Alert & Match',
      residueMarket: 'Residue Market',
      historicalTrends: 'Historical Trends',
    },
    home: {
      hotspotsDetected: 'Hotspots Detected',
      activeViirs: 'Active VIIRS',
      highThreatDistricts: 'High Threat Districts',
      scoreThreshold: '(Score ≥ 51)',
      prevailingWind: 'Prevailing Wind (10m)',
      towardsNcr: '→ NCR',
      cleanAlternatives: 'Clean Alternatives',
      facilitiesCount: '29 Facilities',
      facilitiesType: 'CBG & CHCs',
      cachedSnapshot: 'Cached Snapshot',
      refreshTooltip: 'Refresh live data',
      riskMapTab: 'Risk Map',
      districtRankingTab: 'District Ranking',
      searchPlaceholder: 'Search district or state...',
      allDistricts: 'All Districts',
      showingDistricts: 'Showing',
      districtsWord: 'districts',
      exportCsv: 'Export CSV',
      noDistrictsFound: 'No matching districts found',
      adjustSearch: 'Adjust your search query or state filter.',
      fires: 'fires',
      kmToNcr: 'km to NCR',
      downwind: 'downwind',
    },
    market: {
      title: 'Paddy Straw Residue Market',
      subtitle: 'Discover farmer crop residue listings and connect with clean industrial off-takers across Punjab.',
      listStubbleBtn: 'List Stubble for Free',
      filterFeed: 'Filter Feed:',
      allDistricts: 'All Districts',
      allStrawForms: 'All Straw Forms',
      formBaled: '📦 Baled Bundles',
      formLoose: '🌾 Loose Straw',
      allStatuses: 'All Statuses',
      statusOpen: 'Open',
      statusOffered: 'Offered',
      statusAccepted: 'Accepted',
      statusScheduled: 'Scheduled',
      statusCollected: 'Collected',
      loadingListings: 'Loading marketplace listings...',
      noListings: 'No listings match the selected filters.',
      resetFilters: 'Reset Filters',
      residueAvailable: 'Residue Available',
      residueForm: 'Residue Form',
      askingPrice: 'Asking Price',
      viewOffers: 'buyer offers',
      viewDetailsBid: 'View Details & Bid',
      cleanAlternativesSidebar: 'Nearby Clean Alternatives',
      stateRegistry: 'State Registry',
      openPrice: 'Open',
      perQtl: 'Qtl',
      approxDistance: 'approx.',
    },
    drawer: {
      riskAssessment: 'District Risk Assessment',
      activeFires: 'Active Fire Hotspots',
      plumeAlignment: 'Smoke Plume Alignment',
      distanceNcr: 'Distance to NCR',
      recommendedAlternatives: 'Recommended Clean Alternatives',
      farmerAdvisory: 'Farmer WhatsApp Advisory',
      sendWhatsApp: 'Send via WhatsApp',
      copyAdvisory: 'Copy Advisory Text',
      advisoryCopied: 'Copied!',
      close: 'Close',
      viewAlternativeDetails: 'View Details',
      availableEquipment: 'Available Equipment',
      callFacility: 'Call Facility',
    },
    trends: {
      title: 'Historical Trends & Seasonal Fire Analytics',
      subtitle: 'Multi-year crop residue fire detections across Punjab, Haryana, and NCR airsheds.',
      paddySeason: 'Paddy (Kharif) · Sep–Nov',
      wheatSeason: 'Wheat (Rabi) · Apr–Jun',
      stateComparison: 'State-by-State Fire Progression',
      districtLeaderboard: 'District Multi-Year Leaderboard',
      exportCsv: 'Export Trends CSV',
      totalFires: 'Total Fires',
      firesUnit: 'fires',
      year: 'Year',
      district: 'District',
      state: 'State',
    },
  },
  hi: {
    nav: {
      brandName: 'कृषिवायु',
      brandTagline: 'पराली आग अलर्ट व स्वच्छ बाजार',
      alertMatch: 'अलर्ट व विकल्प',
      residueMarket: 'पराली बाजार',
      historicalTrends: 'ऐतिहासिक रुझान',
    },
    home: {
      hotspotsDetected: 'सक्रिय आग स्थल',
      activeViirs: 'सक्रिय उपग्रह ट्रैकिंग',
      highThreatDistricts: 'उच्च जोखिम जिले',
      scoreThreshold: '(स्कोर ≥ 51)',
      prevailingWind: 'हवा की गति व दिशा (10मी)',
      towardsNcr: '→ दिल्ली/एनसीआर',
      cleanAlternatives: 'स्वच्छ विकल्प केंद्र',
      facilitiesCount: '29 केंद्र',
      facilitiesType: 'बायो-सीएनजी व सीएचसी',
      cachedSnapshot: 'सुरक्षित डेटा स्नैपशॉट',
      refreshTooltip: 'लाइव डेटा रिफ्रेश करें',
      riskMapTab: 'जोखिम नक्शा',
      districtRankingTab: 'जिला रैंकिंग',
      searchPlaceholder: 'जिला या राज्य खोजें...',
      allDistricts: 'सभी जिले',
      showingDistricts: 'दिखा रहे हैं',
      districtsWord: 'जिले',
      exportCsv: 'सीएसवी निर्यात',
      noDistrictsFound: 'कोई जिला नहीं मिला',
      adjustSearch: 'कृपया खोज या राज्य फिल्टर बदलें।',
      fires: 'आग',
      kmToNcr: 'किमी एनसीआर से',
      downwind: 'हवा की दिशा में',
    },
    market: {
      title: 'धान पराली खरीद-बिक्री बाजार',
      subtitle: 'पंजाब भर के किसानों की पराली लिस्टिंग देखें और सीधे स्वच्छ उद्योगों व पेलेट इकाइयों से जुड़ें।',
      listStubbleBtn: 'पराली निःशुल्क लिस्ट करें',
      filterFeed: 'फिल्टर करें:',
      allDistricts: 'सभी जिले',
      allStrawForms: 'सभी प्रकार',
      formBaled: '📦 गांठें / बंडल',
      formLoose: '🌾 खुली पराली',
      allStatuses: 'सभी स्थितियां',
      statusOpen: 'उपलब्ध',
      statusOffered: 'प्रस्तावित',
      statusAccepted: 'स्वीकृत',
      statusScheduled: 'उठाव तय',
      statusCollected: 'उठाव संपन्न',
      loadingListings: 'पराली लिस्टिंग लोड हो रही है...',
      noListings: 'चयनित फिल्टर के अनुसार कोई लिस्टिंग नहीं मिली।',
      resetFilters: 'फिल्टर रीसेट करें',
      residueAvailable: 'उपलब्ध पराली',
      residueForm: 'पराली का प्रकार',
      askingPrice: 'अपेक्षित मूल्य',
      viewOffers: 'खरीदार प्रस्ताव',
      viewDetailsBid: 'विवरण देखें व बोली लगाएं',
      cleanAlternativesSidebar: 'नजदीकी स्वच्छ विकल्प',
      stateRegistry: 'सरकारी सूची',
      openPrice: 'खुला',
      perQtl: 'क्विंटल',
      approxDistance: 'लगभग',
    },
    drawer: {
      riskAssessment: 'जिला जोखिम विश्लेषण',
      activeFires: 'सक्रिय पराली आग स्थल',
      plumeAlignment: 'धुआं संरेखण (NCR की ओर)',
      distanceNcr: 'दिल्ली/एनसीआर से दूरी',
      recommendedAlternatives: 'नजदीकी स्वच्छ पराली खरीद केंद्र',
      farmerAdvisory: 'किसान व्हाट्सएप सलाहकारी',
      sendWhatsApp: 'व्हाट्सएप पर भेजें',
      copyAdvisory: 'सलाहकारी कॉपी करें',
      advisoryCopied: 'कॉपी हो गया!',
      close: 'बंद करें',
      viewAlternativeDetails: 'विवरण देखें',
      availableEquipment: 'उपलब्ध कृषि यंत्र',
      callFacility: 'केंद्र पर संपर्क करें',
    },
    trends: {
      title: 'ऐतिहासिक रुझान व मौसमी पराली विश्लेषण',
      subtitle: 'पंजाब, हरियाणा और एनसीआर क्षेत्र में कई वर्षों का उपग्रह पराली आग डेटा।',
      paddySeason: 'धान (खरीफ) · सित–नव',
      wheatSeason: 'गेहूं (रबी) · अप्रै–जून',
      stateComparison: 'राज्यवार पराली आग तुलना',
      districtLeaderboard: 'जिलावार बहु-वर्षीय तालिका',
      exportCsv: 'रुझान डेटा निर्यात करें',
      totalFires: 'कुल आग',
      firesUnit: 'आग',
      year: 'वर्ष',
      district: 'जिला',
      state: 'राज्य',
    },
  },
  pa: {
    nav: {
      brandName: 'ਕ੍ਰਿਸ਼ੀਵਾਯੂ',
      brandTagline: 'ਪਰਾਲੀ ਅੱਗ ਅਲਰਟ ਅਤੇ ਸਾਫ਼ ਬਾਜ਼ਾਰ',
      alertMatch: 'ਅਲਰਟ ਅਤੇ ਬਦਲ',
      residueMarket: 'ਪਰਾਲੀ ਬਾਜ਼ਾਰ',
      historicalTrends: 'ਇਤਿਹਾਸਕ ਰੁਝਾਨ',
    },
    home: {
      hotspotsDetected: 'ਸਰਗਰਮ ਅੱਗਾਂ',
      activeViirs: 'ਸਰਗਰਮ ਉਪਗ੍ਰਹਿ ਟਰੈਕਿੰਗ',
      highThreatDistricts: 'ਉੱਚ ਜੋਖਮ ਵਾਲੇ ਜ਼ਿਲ੍ਹੇ',
      scoreThreshold: '(ਸਕੋਰ ≥ 51)',
      prevailingWind: 'ਹਵਾ ਦੀ ਗਤੀ ਤੇ ਦਿਸ਼ਾ (10ਮੀ)',
      towardsNcr: '→ ਦਿੱਲੀ/ਐਨਸੀਆਰ',
      cleanAlternatives: 'ਸਾਫ਼ ਬਦਲ ਕੇਂਦਰ',
      facilitiesCount: '29 ਕੇਂਦਰ',
      facilitiesType: 'ਬਾਇਓ-ਸੀਐਨਜੀ ਤੇ ਸੀਐਚਸੀ',
      cachedSnapshot: 'ਸੁਰੱਖਿਅਤ ਡਾਟਾ ਸਨੈਪਸ਼ਾਟ',
      refreshTooltip: 'ਲਾਈਵ ਡਾਟਾ ਰਿਫ੍ਰੈਸ਼ ਕਰੋ',
      riskMapTab: 'ਜੋਖਮ ਨਕਸ਼ਾ',
      districtRankingTab: 'ਜ਼ਿਲ੍ਹਾ ਰੈਂਕਿੰਗ',
      searchPlaceholder: 'ਜ਼ਿਲ੍ਹਾ ਜਾਂ ਰਾਜ ਖੋਜੋ...',
      allDistricts: 'ਸਾਰੇ ਜ਼ਿਲ੍ਹੇ',
      showingDistricts: 'ਕੁੱਲ',
      districtsWord: 'ਜ਼ਿਲ੍ਹੇ',
      exportCsv: 'ਸੀਐਸਵੀ ਐਕਸਪੋਰਟ',
      noDistrictsFound: 'ਕੋਈ ਜ਼ਿਲ੍ਹਾ ਨਹੀਂ ਮਿਲਿਆ',
      adjustSearch: 'ਕਿਰਪਾ ਕਰਕੇ ਖੋਜ ਜਾਂ ਰਾਜ ਫਿਲਟਰ ਬਦਲੋ।',
      fires: 'ਅੱਗਾਂ',
      kmToNcr: 'ਕਿਮੀ ਐਨਸੀਆਰ ਤੋਂ',
      downwind: 'ਹਵਾ ਦੀ ਦਿਸ਼ਾ ਵੱਲ',
    },
    market: {
      title: 'ਝੋਨੇ ਦੀ ਪਰਾਲੀ ਖਰੀਦ-ਵੇਚ ਬਾਜ਼ਾਰ',
      subtitle: 'ਪੰਜਾਬ ਭਰ ਦੇ ਕਿਸਾਨਾਂ ਦੀ ਪਰਾਲੀ ਦੀਆਂ ਲਿਸਟਿੰਗਾਂ ਦੇਖੋ ਅਤੇ ਸਿੱਧੇ ਬਾਇਓ-ਗੈਸ ਤੇ ਪੈਲੇਟ ਪਲਾਂਟਾਂ ਨਾਲ ਜੁੜੋ।',
      listStubbleBtn: 'ਪਰਾਲੀ ਮੁਫ਼ਤ ਦਰਜ ਕਰੋ',
      filterFeed: 'ਫਿਲਟਰ ਕਰੋ:',
      allDistricts: 'ਸਾਰੇ ਜ਼ਿਲ੍ਹੇ',
      allStrawForms: 'ਸਾਰੇ ਰੂਪ',
      formBaled: '📦 ਗੱਠਾਂ / ਬੰਡਲ',
      formLoose: '🌾 ਖੁੱਲ੍ਹੀ ਪਰਾਲੀ',
      allStatuses: 'ਸਾਰੀਆਂ ਸਥਿਤੀਆਂ',
      statusOpen: 'ਉਪਲਬਧ',
      statusOffered: 'ਪ੍ਰਸਤਾਵਿਤ',
      statusAccepted: 'ਮਨਜ਼ੂਰ',
      statusScheduled: 'ਚੁੱਕਣ ਦਾ ਸਮਾਂ ਤੈਅ',
      statusCollected: 'ਚੁੱਕਿਆ ਗਿਆ',
      loadingListings: 'ਪਰਾਲੀ ਲਿਸਟਿੰਗਾਂ ਲੋਡ ਹੋ ਰਹੀਆਂ ਹਨ...',
      noListings: 'ਚੁਣੇ ਫਿਲਟਰ ਅਨੁਸਾਰ ਕੋਈ ਲਿਸਟਿੰਗ ਨਹੀਂ ਮਿਲੀ।',
      resetFilters: 'ਫਿਲਟਰ ਰੀਸੈੱਟ ਕਰੋ',
      residueAvailable: 'ਉਪਲਬਧ ਪਰਾਲੀ',
      residueForm: 'ਪਰਾਲੀ ਦਾ ਰੂਪ',
      askingPrice: 'ਮੰਗਿਆ ਮੁੱਲ',
      viewOffers: 'ਖਰੀਦਦਾਰ ਪੇਸ਼ਕਸ਼ਾਂ',
      viewDetailsBid: 'ਵੇਰਵੇ ਦੇਖੋ ਅਤੇ ਬੋਲੀ ਲਗਾਓ',
      cleanAlternativesSidebar: 'ਨੇੜਲੇ ਸਾਫ਼ ਬਦਲ',
      stateRegistry: 'ਸਰਕਾਰੀ ਸੂਚੀ',
      openPrice: 'ਖੁੱਲ੍ਹਾ',
      perQtl: 'ਕੁਇੰਟਲ',
      approxDistance: 'ਲਗਭਗ',
    },
    drawer: {
      riskAssessment: 'ਜ਼ਿਲ੍ਹਾ ਜੋਖਮ ਮੁਲਾਂਕਣ',
      activeFires: 'ਸਰਗਰਮ ਪਰਾਲੀ ਅੱਗਾਂ',
      plumeAlignment: 'ਧੂੰਏਂ ਦਾ ਰੁਖ (ਐਨਸੀਆਰ ਵੱਲ)',
      distanceNcr: 'ਦਿੱਲੀ/ਐਨਸੀਆਰ ਤੋਂ ਦੂਰੀ',
      recommendedAlternatives: 'ਸਿਫ਼ਾਰਸ਼ ਕੀਤੇ ਸਾਫ਼ ਬਦਲ ਕੇਂਦਰ',
      farmerAdvisory: 'ਕਿਸਾਨ ਵਟਸਐਪ ਸਲਾਹਕਾਰੀ',
      sendWhatsApp: 'ਵਟਸਐਪ ਤੇ ਭੇਜੋ',
      copyAdvisory: 'ਸਲਾਹਕਾਰੀ ਕਾਪੀ ਕਰੋ',
      advisoryCopied: 'ਕਾਪੀ ਹੋ ਗਿਆ!',
      close: 'ਬੰਦ ਕਰੋ',
      viewAlternativeDetails: 'ਵੇਰਵੇ ਦੇਖੋ',
      availableEquipment: 'ਉਪਲਬਧ ਖੇਤੀ ਮਸ਼ੀਨਰੀ',
      callFacility: 'ਕੇਂਦਰ ਨਾਲ ਸੰਪਰਕ ਕਰੋ',
    },
    trends: {
      title: 'ਇਤਿਹਾਸਕ ਰੁਝਾਨ ਅਤੇ ਮੌਸਮੀ ਪਰਾਲੀ ਵਿਸ਼ਲੇਸ਼ਣ',
      subtitle: 'ਪੰਜਾਬ, ਹਰਿਆਣਾ ਅਤੇ ਐਨਸੀਆਰ ਖੇਤਰ ਵਿੱਚ ਕਈ ਸਾਲਾਂ ਦਾ ਉਪਗ੍ਰਹਿ ਪਰਾਲੀ ਅੱਗ ਡਾਟਾ।',
      paddySeason: 'ਝੋਨਾ (ਖਰੀਫ) · ਸਤੰ-ਨਵੰ',
      wheatSeason: 'ਕਣਕ (ਹਾੜ੍ਹੀ) · ਅਪ੍ਰੈ-ਜੂਨ',
      stateComparison: 'ਰਾਜ-ਵਾਰ ਪਰਾਲੀ ਅੱਗ ਤੁਲਨਾ',
      districtLeaderboard: 'ਜ਼ਿਲ੍ਹਾ-ਵਾਰ ਬਹੁ-ਸਾਲਾ ਸੂਚੀ',
      exportCsv: 'ਰੁਝਾਨ ਡਾਟਾ ਐਕਸਪੋਰਟ ਕਰੋ',
      totalFires: 'ਕੁੱਲ ਅੱਗਾਂ',
      firesUnit: 'ਅੱਗਾਂ',
      year: 'ਸਾਲ',
      district: 'ਜ਼ਿਲ੍ਹਾ',
      state: 'ਰਾਜ',
    },
  },
};
