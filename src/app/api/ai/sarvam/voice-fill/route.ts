import { NextResponse } from 'next/server';
import { transcribeAudioWithSarvam } from '@/lib/services/sarvamService';
import { extractEntitiesFromTranscript } from '@/lib/sarvamEntityExtractor';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, 30);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many voice requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let transcript = '';
    let source: 'sarvam_api' | 'mock_simulation' = 'mock_simulation';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const langParam = (formData.get('lang') as string) || undefined;

      if (!file || typeof file === 'string') {
        return NextResponse.json(
          { error: 'No audio file provided in form data' },
          { status: 400 }
        );
      }

      const fileObj = file as File;
      const arrayBuffer = await fileObj.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const rawMime = fileObj.type || 'audio/webm';
      const mimeType = rawMime.split(';')[0].trim() || 'audio/webm';
      const filename = fileObj.name || 'voice_recording.webm';

      const sttResult = await transcribeAudioWithSarvam(buffer, mimeType, filename, langParam);
      transcript = sttResult.transcript;
      source = sttResult.source;
    } else {
      // JSON payload fallback (allows testing with direct transcript or pre-recorded text)
      const body = await request.json().catch(() => ({}));
      if (typeof body.transcript === 'string' && body.transcript.trim()) {
        transcript = body.transcript.trim();
        source = 'mock_simulation';
      } else {
        // Default demonstration transcript
        transcript =
          'मेरे पास 250 क्विंटल पराली की गांठें हैं। गांव लड्डा, तहसील धूरी, जिला संगरूर में। रेट दो सौ दस रुपये प्रति क्विंटल है और पराली सूखी है।';
        source = 'mock_simulation';
      }
    }

    if (!transcript) {
      return NextResponse.json(
        { error: 'No recognizable speech detected in audio. Please speak clearly into the microphone and try again.' },
        { status: 422 }
      );
    }

    const extracted = extractEntitiesFromTranscript(transcript);

    return NextResponse.json({
      success: true,
      transcript,
      extracted,
      source,
    });
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    console.error('Sarvam voice fill error:', rawMsg);

    let userFriendlyMsg = rawMsg;
    if (rawMsg.includes('Audio duration exceeds')) {
      userFriendlyMsg = 'Audio exceeds Sarvam AI limit of 30 seconds. Please keep your voice note under 25-30 seconds.';
    } else if (rawMsg.includes('Invalid API Key') || rawMsg.includes('401') || rawMsg.includes('403')) {
      userFriendlyMsg = 'Invalid Sarvam API Key. Please verify SARVAM_API_KEY in .env.local.';
    }

    return NextResponse.json({ error: userFriendlyMsg }, { status: 500 });
  }
}
