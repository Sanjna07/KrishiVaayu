/**
 * Sarvam AI Speech-to-Text Service Integration
 * Uses Sarvam's 'saaras:v4' speech-to-text model for Indian languages (Hindi / Punjabi / English).
 * Provides seamless fallback simulation when SARVAM_API_KEY is not yet configured.
 */

export interface SarvamTranscriptionResult {
  transcript: string;
  language_code: string;
  source: 'sarvam_api' | 'mock_simulation';
  durationSeconds?: number;
}

const DEFAULT_MOCK_TRANSCRIPT =
  'मेरे पास 250 क्विंटल पराली की गांठें हैं। गांव लड्डा, तहसील धूरी, जिला संगरूर में। रेट दो सौ दस रुपये प्रति क्विंटल है और पराली सूखी है।';

function isRealApiKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.length > 10 && trimmed !== 'your_sarvam_api_key_here';
}

/**
 * Sanitizes MIME types for Sarvam AI STT API.
 * Sarvam strictly requires clean MIME types without codec parameters:
 * e.g. "audio/webm;codecs=opus" -> "audio/webm"
 */
function cleanMimeType(rawMime = 'audio/webm'): string {
  const base = rawMime.split(';')[0].trim().toLowerCase();
  if (base.includes('webm')) return 'audio/webm';
  if (base.includes('wav')) return 'audio/wav';
  if (base.includes('ogg') || base.includes('opus')) return 'audio/ogg';
  if (base.includes('mp4') || base.includes('m4a')) return 'audio/mp4';
  if (base.includes('mp3') || base.includes('mpeg')) return 'audio/mpeg';
  if (base.includes('flac')) return 'audio/flac';
  if (base.includes('aac')) return 'audio/aac';
  return 'audio/webm';
}

export async function transcribeAudioWithSarvam(
  audioBuffer: Buffer,
  mimeType = 'audio/webm',
  filename = 'recording.webm',
  targetLang?: string
): Promise<SarvamTranscriptionResult> {
  const apiKey = process.env.SARVAM_API_KEY;

  if (!isRealApiKey(apiKey)) {
    console.warn('[SARVAM AI] SARVAM_API_KEY not configured in environment. Using resilient voice simulation.');
    return {
      transcript: DEFAULT_MOCK_TRANSCRIPT,
      language_code: 'hi-IN',
      source: 'mock_simulation',
      durationSeconds: 12,
    };
  }

  // Map app language to Sarvam BCP-47 language code
  let languageCode = 'unknown'; // default to auto-detection across 22 Indic languages
  if (targetLang === 'pa') languageCode = 'pa-IN';
  else if (targetLang === 'hi') languageCode = 'hi-IN';
  else if (targetLang === 'en') languageCode = 'en-IN';

  try {
    const sanitizedMime = cleanMimeType(mimeType);
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: sanitizedMime });
    formData.append('file', blob, filename);
    formData.append('model', 'saaras:v4');
    formData.append('language_code', languageCode);

    const res = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey!.trim(),
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[SARVAM AI ERROR] API status ${res.status}: ${errText}`);
      throw new Error(`Sarvam AI STT error (HTTP ${res.status}): ${errText}`);
    }

    const data = (await res.json()) as { transcript?: string; language_code?: string };
    const transcript = (data.transcript || '').trim();

    return {
      transcript,
      language_code: data.language_code || languageCode,
      source: 'sarvam_api',
    };
  } catch (err: unknown) {
    console.error('[SARVAM AI EXCEPTION]', err);
    // Re-throw so user gets actual feedback if key is invalid or audio exceeds 30s
    throw err;
  }
}
