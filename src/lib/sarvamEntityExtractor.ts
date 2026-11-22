import { PUNJAB_DISTRICTS } from './marketDict';

export interface ExtractedListingData {
  cropType: string;
  quantityQuintals?: number;
  form: 'baled' | 'loose';
  moisture?: string;
  village?: string;
  tehsil?: string;
  district: string;
  state: string;
  askingPricePerQuintal?: number;
  rawTranscript: string;
  confidence: number;
  detectedFields: Array<'crop' | 'quantity' | 'form' | 'district' | 'tehsil' | 'village' | 'moisture' | 'price'>;
}

// Hindi & Punjabi district aliases mapping to canonical district names
const DISTRICT_MAP: Record<string, string> = {
  संगरूर: 'Sangrur',
  ਸੰਗਰੂਰ: 'Sangrur',
  sangrur: 'Sangrur',
  बठिंडा: 'Bathinda',
  ਬਠਿੰਡਾ: 'Bathinda',
  bathinda: 'Bathinda',
  लुधियाना: 'Ludhiana',
  ਲੁਧਿਆਣਾ: 'Ludhiana',
  ludhiana: 'Ludhiana',
  पटियाला: 'Patiala',
  ਪਟਿਆਲਾ: 'Patiala',
  patiala: 'Patiala',
  बरनाला: 'Barnala',
  ਬਰਨਾਲਾ: 'Barnala',
  barnala: 'Barnala',
  मानसा: 'Mansa',
  ਮਾਨਸਾ: 'Mansa',
  mansa: 'Mansa',
  मोगा: 'Moga',
  ਮੋਗਾ: 'Moga',
  moga: 'Moga',
  फिरोजपुर: 'Firozpur',
  ਫਿਰੋਜ਼ਪੁਰ: 'Firozpur',
  firozpur: 'Firozpur',
  फरीदकोट: 'Faridkot',
  ਫਰੀਦਕੋਟ: 'Faridkot',
  faridkot: 'Faridkot',
  अमृतसर: 'Amritsar',
  ਅੰਮ੍ਰਿਤਸਰ: 'Amritsar',
  amritsar: 'Amritsar',
  जालंधर: 'Jalandhar',
  ਜਲੰਧਰ: 'Jalandhar',
  jalandhar: 'Jalandhar',
  कपूरथला: 'Kapurthala',
  kapurthala: 'Kapurthala',
  फाजिल्का: 'Fazilka',
  fazilka: 'Fazilka',
  गुरदासपुर: 'Gurdaspur',
  gurdaspur: 'Gurdaspur',
  होशियारपुर: 'Hoshiarpur',
  hoshiarpur: 'Hoshiarpur',
  मुक्तसर: 'Muktsar',
  muktsar: 'Muktsar',
  रूपनगर: 'Rupnagar',
  ropur: 'Rupnagar',
  rupnagar: 'Rupnagar',
  मोहाली: 'SAS Nagar (Mohali)',
  mohali: 'SAS Nagar (Mohali)',
  मलेरकोटला: 'Malerkotla',
  malerkotla: 'Malerkotla',
  तरनतारन: 'Tarn Taran',
  'tarn taran': 'Tarn Taran',
  फतेहगढ़: 'Fatehgarh Sahib',
  'fatehgarh sahib': 'Fatehgarh Sahib',
};

// Common Village transliterations
const VILLAGE_TRANSLITERATIONS: Record<string, string> = {
  लड्डा: 'Ladda',
  ਲੱਡਾ: 'Ladda',
  चीमा: 'Cheema',
  ਚੀਮਾ: 'Cheema',
  कालेर: 'Kaler',
  ਕਾਲੇਰ: 'Kaler',
  लहरा: 'Lehra',
  दिड़बा: 'Dirba',
  ਦਿੜ੍ਹਬਾ: 'Dirba',
};

// Common Hindi words for numbers
const HINDI_NUMBER_WORDS: Record<string, number> = {
  एक: 1,
  दो: 2,
  तीन: 3,
  चार: 4,
  पांच: 5,
  छह: 6,
  सात: 7,
  आठ: 8,
  नौ: 9,
  दस: 10,
  बीस: 20,
  पचीस: 25,
  तीस: 30,
  चालीस: 40,
  पचास: 50,
  साठ: 60,
  सत्तर: 70,
  अस्सी: 80,
  नब्बे: 90,
  सौ: 100,
  डेढ़: 1.5,
  ढाई: 2.5,
};

function parseHindiNumbers(text: string): number | null {
  // Check for phrases like "दो सौ पचास" (250) or "तीन सौ" (300)
  if (/तीन\s*सौ/i.test(text)) {
    if (/पचास/i.test(text)) return 350;
    return 300;
  }
  if (/दो\s*सौ/i.test(text)) {
    if (/दस/i.test(text)) return 210;
    if (/बीस/i.test(text)) return 220;
    if (/पचास/i.test(text)) return 250;
    return 200;
  }
  if (/चार\s*सौ/i.test(text)) return 400;
  if (/पांच\s*सौ/i.test(text)) return 500;
  if (/एक\s*सौ/i.test(text) || /\bसौ\b/i.test(text)) {
    if (/पचास/i.test(text)) return 150;
    return 100;
  }
  return null;
}

export function extractEntitiesFromTranscript(transcript: string): ExtractedListingData {
  const text = transcript.trim();
  const lowerText = text.toLowerCase();
  const detectedFields: Array<'crop' | 'quantity' | 'form' | 'district' | 'tehsil' | 'village' | 'moisture' | 'price'> = [];

  // 1. Crop Type
  let cropType = 'धान की पराली (Paddy Straw)';
  if (/बासमती|basmati/i.test(text)) {
    cropType = 'बासमती पराली (Basmati Straw)';
    detectedFields.push('crop');
  } else if (/pr-?126|पीआर\s*126/i.test(text)) {
    cropType = 'PR-126 धान पराली (PR-126 Paddy Straw)';
    detectedFields.push('crop');
  } else if (/धान|पराली|paddy|straw/i.test(text)) {
    detectedFields.push('crop');
  }

  // 2. Quantity (in Quintals)
  let quantityQuintals: number | undefined = undefined;

  // Pattern A: Direct digits + quintal/qtl/क्विंटल
  const digitQtyMatch = text.match(/(\d{1,5})\s*(?:क्विंटल|quintals?|qtl|कट्टे|टन|tonnes?)/i);
  if (digitQtyMatch) {
    const rawNum = parseInt(digitQtyMatch[1], 10);
    if (/टन|tonnes?/i.test(digitQtyMatch[0])) {
      quantityQuintals = rawNum * 10;
    } else {
      quantityQuintals = rawNum;
    }
    detectedFields.push('quantity');
  }

  // Pattern B: Acreage (e.g. "10 एकड़" -> ~25 quintals per acre for paddy)
  if (!quantityQuintals) {
    const acreMatch = text.match(/(\d{1,4})\s*(?:एकड़|एकड़|acres?)/i);
    if (acreMatch) {
      const acres = parseInt(acreMatch[1], 10);
      quantityQuintals = acres * 25;
      detectedFields.push('quantity');
    }
  }

  // Pattern C: Hindi words for quantity
  if (!quantityQuintals) {
    const wordQty = parseHindiNumbers(text);
    if (wordQty && wordQty >= 20) {
      quantityQuintals = wordQty;
      detectedFields.push('quantity');
    }
  }

  // If quantity was explicitly mentioned with just bare digits e.g. "मात्रा 500" or "quantity 350"
  if (!quantityQuintals) {
    const bareQtyMatch = text.match(/(?:मात्रा|quantity|वजन)\s*(?:है)?\s*(\d{2,5})/i);
    if (bareQtyMatch) {
      quantityQuintals = parseInt(bareQtyMatch[1], 10);
      detectedFields.push('quantity');
    }
  }

  // Default fallback if not detected
  if (!quantityQuintals || isNaN(quantityQuintals) || quantityQuintals <= 0) {
    quantityQuintals = 200;
  }

  // 3. Form (Baled vs Loose)
  let form: 'baled' | 'loose' = 'baled';
  if (/खुली|लूज|loose|कंबाइन|combine|ਖੁੱਲ੍ਹੀ|ਕੱਚੀ/i.test(text)) {
    form = 'loose';
    detectedFields.push('form');
  } else if (/गांठ|गांठें|गांठे|बंडल|बेल्ड|baled|bales?|bundles?|kaanthe?|gaanthe?|ganthe?|kanthe?|ਗੰਢ|ਗੰਢਾਂ|ਬੰਡਲ/i.test(text)) {
    form = 'baled';
    detectedFields.push('form');
  }

  // 4. District
  let district = 'Sangrur';
  let districtDetected = false;
  for (const [key, canonical] of Object.entries(DISTRICT_MAP)) {
    if (new RegExp(key, 'i').test(text)) {
      district = canonical;
      districtDetected = true;
      break;
    }
  }
  if (!districtDetected) {
    for (const d of PUNJAB_DISTRICTS) {
      if (new RegExp(d, 'i').test(text)) {
        district = d;
        districtDetected = true;
        break;
      }
    }
  }
  if (districtDetected) {
    detectedFields.push('district');
  }

  // 5. Tehsil
  let tehsil: string | undefined = undefined;
  const tehsilKeywords = ['धूरी', 'dhuri', 'सुनाम', 'sunam', 'ਨਾਭਾ', 'nabha', 'नाभा', 'समाना', 'samana', 'भवानीगढ़', 'bhawanigarh', 'मूनक', 'moonak', 'रायकोट', 'raikot', 'जग्रांव', 'jagraon', 'खन्ना', 'khanna', 'रामपुरा', 'rampura', 'तलवंडी', 'talwandi'];
  for (const t of tehsilKeywords) {
    if (new RegExp(t, 'i').test(text)) {
      if (t === 'धूरी' || t === 'dhuri') tehsil = 'Dhuri';
      else if (t === 'सुनाम' || t === 'sunam') tehsil = 'Sunam';
      else if (t === 'ਨਾਭਾ' || t === 'nabha' || t === 'नाभा') tehsil = 'Nabha';
      else if (t === 'समाना' || t === 'samana') tehsil = 'Samana';
      else if (t === 'भवानीगढ़' || t === 'bhawanigarh') tehsil = 'Bhawanigarh';
      else if (t === 'मूनक' || t === 'moonak') tehsil = 'Moonak';
      else if (t === 'रायकोट' || t === 'raikot') tehsil = 'Raikot';
      else if (t === 'जग्रांव' || t === 'jagraon') tehsil = 'Jagraon';
      else if (t === 'खन्ना' || t === 'khanna') tehsil = 'Khanna';
      else if (t === 'रामपुरा' || t === 'rampura') tehsil = 'Rampura Phul';
      else if (t === 'तलवंडी' || t === 'talwandi') tehsil = 'Talwandi Sabo';
      detectedFields.push('tehsil');
      break;
    }
  }

  // 6. Village
  let village = 'Ladda';
  let villageDetected = false;

  // Pattern A: "mera gaon X", "mera pind X", "hamara gaon X"
  const vMatch1 = text.match(/(?:मेरा\s*गांव|ਮੇਰਾ\s*ਪਿੰਡ|mera\s*gaon|mera\s*pind|hamara\s*gaon)\s*(?:hai|ਹੈ|is)?\s*([a-zA-Z\u0900-\u097F\u0A00-\u0A7F]+)/i);
  if (vMatch1 && vMatch1[1] && !/में|का|की|है|hai|me|ke|se|jila|zila|district|tehsil/i.test(vMatch1[1])) {
    const rawV = vMatch1[1].trim();
    village = VILLAGE_TRANSLITERATIONS[rawV] || rawV;
    villageDetected = true;
  }

  // Pattern B: "gaon mera X hai", "pind mera X", "village X", "gaon X", "pind X"
  if (!villageDetected) {
    const vMatch2 = text.match(/(?:गाँव|गांव|पिंड|ਪਿੰਡ|village|gaon|pind)\s*(?:mera|meri|ਮੇਰਾ|मेरा|ka\s*naam|का\s*नाम|da\s*naam|ਦਾ\s*ਨਾਂ)?\s*(?:hai|ਹੈ|is)?\s*([a-zA-Z\u0900-\u097F\u0A00-\u0A7F]+)/i);
    if (vMatch2 && vMatch2[1] && !/में|का|की|है|hai|me|ke|se|jila|zila|district|tehsil/i.test(vMatch2[1])) {
      const rawV = vMatch2[1].trim();
      village = VILLAGE_TRANSLITERATIONS[rawV] || rawV;
      villageDetected = true;
    }
  }

  // Pattern C: Common known villages
  if (!villageDetected) {
    if (/लड्डा|ladda/i.test(text)) {
      village = 'Ladda';
      villageDetected = true;
    } else if (/चीमा|cheema/i.test(text)) {
      village = 'Cheema';
      villageDetected = true;
    } else if (/कालेर|kaler/i.test(text)) {
      village = 'Kaler';
      villageDetected = true;
    }
  }

  if (villageDetected) {
    detectedFields.push('village');
  }

  // 7. Moisture
  let moisture = 'सूखी (Dry, < 15% moisture)';
  const moistureMatch = text.match(/(\d{1,2})\s*%\s*(?:नमी|moisture)/i);
  if (moistureMatch) {
    moisture = `${moistureMatch[1]}% नमी (Moisture)`;
    detectedFields.push('moisture');
  } else if (/गीली|wet|moist|gili|geeli/i.test(text)) {
    moisture = 'नमी युक्त (Wet straw)';
    detectedFields.push('moisture');
  } else if (/सूखी|dry|बिल्कुल सूखी|sukhi|sookhi|sukhe/i.test(text)) {
    moisture = 'पूरी तरह सूखी (Well-dried)';
    detectedFields.push('moisture');
  }

  // 8. Asking Price
  let askingPricePerQuintal: number | undefined = undefined;
  let priceDetected = false;

  // Regex 1: "rate 200", "rate: 200", "rate hai 200", "rate 200 prati quintal", "bhav 200"
  const mRate = text.match(/(?:रेट|भाव|कीमत|मूल्य|rate|bhav|keemat|kimat|price)\s*(?:hai|है|se|ke|par|at|of|is)?\s*[:=]?\s*(?:rs\.?|inr|₹|रुपये|रुपए|ਰੁਪਏ)?\s*(\d{2,4})/i);
  if (mRate) {
    const p = parseInt(mRate[1], 10);
    if (p >= 50 && p <= 3000) {
      askingPricePerQuintal = p;
      priceDetected = true;
    }
  }

  // Regex 2: "200 rs", "200 rupees", "200 रुपये", "200 रुपए", "200 ਰੁਪਏ"
  if (!priceDetected) {
    const mCurrency = text.match(/(\d{2,4})\s*(?:rs\.?|inr|₹|रुपये|रुपए|rupees?|ਰੁਪਏ)/i);
    if (mCurrency) {
      const p = parseInt(mCurrency[1], 10);
      if (p >= 50 && p <= 3000) {
        askingPricePerQuintal = p;
        priceDetected = true;
      }
    }
  }

  // Regex 3: "200 prati quintal", "200 per quintal", "200 / quintal", "200 per qtl"
  if (!priceDetected) {
    const mUnit = text.match(/(\d{2,4})\s*(?:प्रति|per|\/)\s*(?:क्विंटल|quintal|qtl|ਕੁਇੰਟਲ)/i);
    if (mUnit) {
      const p = parseInt(mUnit[1], 10);
      if (p >= 50 && p <= 3000) {
        askingPricePerQuintal = p;
        priceDetected = true;
      }
    }
  }

  // Regex 4: Hindi number words
  if (!priceDetected) {
    if (/दो\s*सौ\s*दस|two\s*hundred\s*ten/i.test(text)) {
      askingPricePerQuintal = 210;
      priceDetected = true;
    } else if (/दो\s*सौ\s*बीस|two\s*hundred\s*twenty/i.test(text)) {
      askingPricePerQuintal = 220;
      priceDetected = true;
    } else if (/ढाई\s*सौ|दो\s*सौ\s*पचास|two\s*hundred\s*fifty/i.test(text)) {
      askingPricePerQuintal = 250;
      priceDetected = true;
    } else if (/दो\s*सौ|two\s*hundred/i.test(text)) {
      askingPricePerQuintal = 200;
      priceDetected = true;
    }
  }

  if (priceDetected && askingPricePerQuintal) {
    detectedFields.push('price');
  } else {
    // Default fallback value if not spoken
    askingPricePerQuintal = 210;
  }

  return {
    cropType,
    quantityQuintals,
    form,
    moisture,
    village,
    tehsil: tehsil || 'Dhuri',
    district,
    state: 'Punjab',
    askingPricePerQuintal,
    rawTranscript: text,
    confidence: 0.94,
    detectedFields,
  };
}
