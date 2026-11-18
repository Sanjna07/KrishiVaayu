/**
 * Fast2SMS Gateway Service for KrishiVayu Marketplace Lifecycle Notifications.
 * Sends transactional SMS notifications to farmers and buyers on key events:
 * 1. Farmer Listing Created (Sends private dashboard recovery link)
 * 2. New Offer Received (Alerts farmer with offer rate & direct dashboard link)
 * 3. Offer Accepted (Alerts buyer with farmer phone number for pickup coordination)
 * 4. Offer Declined (Alerts buyer that offer was declined)
 * 5. Residue Collected / Order Confirmed (Alerts both farmer & buyer on completion)
 */

export interface SendSmsResult {
  success: boolean;
  isMock?: boolean;
  error?: string;
  requestId?: string;
}

/**
 * Normalizes Indian phone numbers into 10 digits starting with 6-9.
 */
export function normalizeIndianPhone(phone: unknown): string | null {
  if (typeof phone !== 'string' && typeof phone !== 'number') {
    return null;
  }
  const cleaned = String(phone).replace(/[\s\-\(\)\+]/g, '');
  const match = cleaned.match(/^(?:91|0)?([6-9]\d{9})$/);
  return match ? match[1] : null;
}

export function getSiteBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://krishi-vaayu.vercel.app';
}

/**
 * Dispatches a single SMS via Fast2SMS Quick Route ('q').
 * In development or when FAST2SMS_API_KEY is not set, safely falls back to mock console output.
 */
export async function sendFast2Sms(phone: string, message: string): Promise<SendSmsResult> {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) {
    return {
      success: false,
      error: `Invalid Indian mobile number: ${phone}`,
    };
  }

  const apiKey = process.env.FAST2SMS_API_KEY?.trim();

  // Mock fallback if API key is not configured (prevents blocking during local dev/tests)
  if (!apiKey) {
    console.log(`[FAST2SMS MOCK DISPATCH] -> To: +91 ${normalized} | Msg: "${message}"`);
    return {
      success: true,
      isMock: true,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        route: 'q',
        message,
        language: 'english',
        flash: 0,
        numbers: normalized,
      }),
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => null);

    if (!res.ok || data?.return === false) {
      const errMsg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message || `HTTP ${res.status}`;
      console.warn(`[FAST2SMS WARNING] Failed sending SMS to ${normalized}: ${errMsg}`);
      return {
        success: false,
        error: errMsg,
      };
    }

    console.log(`[FAST2SMS SUCCESS] Sent SMS to ${normalized} (Request ID: ${data?.request_id || 'ok'})`);
    return {
      success: true,
      requestId: data?.request_id,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error';
    console.warn(`[FAST2SMS ERROR] Exception sending SMS to ${normalized}: ${msg}`);
    return {
      success: false,
      error: msg,
    };
  }
}

// -------------------------------------------------------------
// Specialized Marketplace Lifecycle SMS Dispatchers
// -------------------------------------------------------------

/**
 * 1. Farmer creates listing -> Send dashboard link via SMS
 */
export async function sendFarmerListingCreatedSms(params: {
  phone: string;
  listingId: string;
  village: string;
  quantityQuintals: number;
  editToken: string;
}): Promise<SendSmsResult> {
  const baseUrl = getSiteBaseUrl();
  const manageUrl = `${baseUrl}/market/manage/${encodeURIComponent(params.editToken.trim())}`;
  const message = `KrishiVayu: Your stubble listing #${params.listingId} in ${params.village} (${params.quantityQuintals} Qtl) is active! View & manage buyer offers anytime at: ${manageUrl}`;
  return sendFast2Sms(params.phone, message);
}

/**
 * 2. Buyer submits new offer -> Send alert + dashboard link to Farmer
 */
export async function sendFarmerNewOfferSms(params: {
  farmerPhone: string;
  listingId: string;
  village: string;
  buyerName: string;
  pricePerQuintal: number;
  quantityQuintals: number;
  editToken?: string;
}): Promise<SendSmsResult> {
  const baseUrl = getSiteBaseUrl();
  const manageUrl = params.editToken
    ? `${baseUrl}/market/manage/${encodeURIComponent(params.editToken.trim())}`
    : `${baseUrl}/market`;
  const message = `KrishiVayu: New offer on listing #${params.listingId} (${params.village})! ${params.buyerName} offered Rs.${params.pricePerQuintal}/Qtl for ${params.quantityQuintals} Qtl. Review & accept: ${manageUrl}`;
  return sendFast2Sms(params.farmerPhone, message);
}

/**
 * 3. Farmer accepts offer -> Send Farmer Phone & pickup confirmation to Buyer
 */
export async function sendBuyerOfferAcceptedSms(params: {
  buyerPhone: string;
  listingId: string;
  village: string;
  pricePerQuintal: number;
  farmerPhone?: string;
}): Promise<SendSmsResult> {
  const phoneText = params.farmerPhone ? ` Ph: ${params.farmerPhone}` : '';
  const message = `KrishiVayu: Congratulations! Your offer of Rs.${params.pricePerQuintal}/Qtl for listing #${params.listingId} (${params.village}) was ACCEPTED by the farmer. Contact farmer:${phoneText} to coordinate pickup.`;
  return sendFast2Sms(params.buyerPhone, message);
}

/**
 * 4. Farmer declines offer -> Send notification to Buyer
 */
export async function sendBuyerOfferDeclinedSms(params: {
  buyerPhone: string;
  listingId: string;
  village: string;
  pricePerQuintal: number;
}): Promise<SendSmsResult> {
  const baseUrl = getSiteBaseUrl();
  const message = `KrishiVayu: Your offer of Rs.${params.pricePerQuintal}/Qtl for listing #${params.listingId} (${params.village}) was declined by the farmer. Browse available stubble: ${baseUrl}/market`;
  return sendFast2Sms(params.buyerPhone, message);
}

/**
 * 5. Order Confirmed / Residue Collected -> Send to BOTH Farmer and Buyer
 */
export async function sendResidueCollectedSms(params: {
  farmerPhone?: string;
  buyerPhone?: string;
  listingId: string;
  village: string;
  quantityQuintals: number;
}): Promise<{ farmerResult?: SendSmsResult; buyerResult?: SendSmsResult }> {
  const results: { farmerResult?: SendSmsResult; buyerResult?: SendSmsResult } = {};

  if (params.farmerPhone) {
    const farmerMsg = `KrishiVayu: Residue collection confirmed for listing #${params.listingId} in ${params.village} (${params.quantityQuintals} Qtl). Thank you for not burning stubble and keeping Punjab air clean!`;
    results.farmerResult = await sendFast2Sms(params.farmerPhone, farmerMsg);
  }

  if (params.buyerPhone) {
    const buyerMsg = `KrishiVayu: Residue collection confirmed for listing #${params.listingId} (${params.village}, ${params.quantityQuintals} Qtl). Thank you for partnering with clean off-take on KrishiVayu!`;
    results.buyerResult = await sendFast2Sms(params.buyerPhone, buyerMsg);
  }

  return results;
}
