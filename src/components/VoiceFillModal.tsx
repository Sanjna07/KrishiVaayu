'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Loader2,
  Check,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import { PUNJAB_DISTRICTS } from '@/lib/marketDict';
import type { StrawForm } from '@/types/market';
import type { ExtractedListingData } from '@/lib/sarvamEntityExtractor';

interface VoiceFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: {
    village: string;
    tehsil?: string;
    district: string;
    quantity: number;
    form: StrawForm;
    askingPrice?: number;
  }) => void;
  lang: 'en' | 'hi' | 'pa';
}

type ModalStage = 'instruction' | 'recording' | 'processing' | 'review' | 'error';

export function VoiceFillModal({ isOpen, onClose, onApply, lang }: VoiceFillModalProps) {
  const [stage, setStage] = useState<ModalStage>('instruction');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [bufferCountdown, setBufferCountdown] = useState<number | null>(null);
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  const [isUserAudioPlaying, setIsUserAudioPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTargetedMode, setIsTargetedMode] = useState(false); // incremental single-field mode
  const [transcriptionSource, setTranscriptionSource] = useState<'sarvam_api' | 'mock_simulation' | null>(null);

  // Review card editable state
  const [extractedData, setExtractedData] = useState<ExtractedListingData | null>(null);
  const [editVillage, setEditVillage] = useState('');
  const [editTehsil, setEditTehsil] = useState('');
  const [editDistrict, setEditDistrict] = useState('Sangrur');
  const [editQuantity, setEditQuantity] = useState<number | string>(200);
  const [editForm, setEditForm] = useState<StrawForm>('baled');
  const [editPrice, setEditPrice] = useState<number | string>(210);
  const [editMoisture, setEditMoisture] = useState('सूखी (Dry)');
  const [editCrop, setEditCrop] = useState('धान की पराली');
  const [recentlyUpdatedFields, setRecentlyUpdatedFields] = useState<string[]>([]);

  // MediaRecorder & Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const instructionAudioRef = useRef<HTMLAudioElement | null>(null);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bufferTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getInstructionAudioSrc = () => {
    if (lang === 'pa') {
      return '/audio/punjabi_instruction.mp3';
    }
    return '/audio/hindi_instruction.mp3';
  };

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setStage('instruction');
      setRecordingSeconds(0);
      setUserAudioUrl(null);
      setErrorMsg(null);
      setIsTargetedMode(false);
      setRecentlyUpdatedFields([]);
      setBufferCountdown(null);

      // Start localized instruction audio
      playInstructionAudio();
    } else {
      stopAllMedia();
    }
    return () => {
      stopAllMedia();
    };
  }, [isOpen, lang]);

  const stopAllMedia = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (bufferTimerRef.current) clearInterval(bufferTimerRef.current);
    setBufferCountdown(null);

    if (instructionAudioRef.current) {
      instructionAudioRef.current.pause();
      instructionAudioRef.current.currentTime = 0;
    }
    setIsAudioPlaying(false);

    if (userAudioPlayerRef.current) {
      userAudioPlayerRef.current.pause();
      userAudioPlayerRef.current.currentTime = 0;
    }
    setIsUserAudioPlaying(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
  };

  const playInstructionAudio = () => {
    if (typeof window !== 'undefined') {
      if (bufferTimerRef.current) clearInterval(bufferTimerRef.current);
      setBufferCountdown(null);

      if (instructionAudioRef.current) {
        instructionAudioRef.current.pause();
        instructionAudioRef.current.currentTime = 0;
      }

      const audioSrc = getInstructionAudioSrc();
      const audio = new Audio(audioSrc);
      instructionAudioRef.current = audio;

      audio.onplay = () => setIsAudioPlaying(true);
      audio.onpause = () => setIsAudioPlaying(false);
      
      // When audio finishes, give user a 2-second buffer window to replay or auto-start
      audio.onended = () => {
        setIsAudioPlaying(false);
        startPostAudioBuffer();
      };

      audio.play().catch(() => {
        setIsAudioPlaying(false);
        console.log(`[VoiceGuide] Notice: ${audioSrc} autoplay deferred.`);
      });
    }
  };

  const startPostAudioBuffer = () => {
    if (bufferTimerRef.current) clearInterval(bufferTimerRef.current);
    let secondsLeft = 2;
    setBufferCountdown(2);

    bufferTimerRef.current = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        if (bufferTimerRef.current) clearInterval(bufferTimerRef.current);
        setBufferCountdown(null);
        startRecording(false);
      } else {
        setBufferCountdown(secondsLeft);
      }
    }, 1000);
  };

  const handleReplayInstructions = () => {
    // Cancel the 2s buffer countdown immediately
    if (bufferTimerRef.current) {
      clearInterval(bufferTimerRef.current);
      bufferTimerRef.current = null;
    }
    setBufferCountdown(null);

    // Replay audio from start
    if (instructionAudioRef.current) {
      instructionAudioRef.current.currentTime = 0;
      instructionAudioRef.current.play().catch(() => {});
    } else {
      playInstructionAudio();
    }
  };

  const toggleInstructionAudio = () => {
    if (bufferCountdown !== null) {
      handleReplayInstructions();
      return;
    }

    if (instructionAudioRef.current) {
      if (isAudioPlaying) {
        instructionAudioRef.current.pause();
      } else {
        instructionAudioRef.current.play().catch(() => {});
      }
    } else {
      playInstructionAudio();
    }
  };

  const startRecording = async (targeted = false) => {
    stopAllMedia();
    setIsTargetedMode(targeted);
    setStage('recording');
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Strip codec parameters (e.g. "audio/webm;codecs=opus" -> "audio/webm") for Sarvam AI compatibility
        const rawMime = mediaRecorder.mimeType || 'audio/webm';
        const cleanType = rawMime.split(';')[0].trim() || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, {
          type: cleanType,
        });
        const url = URL.createObjectURL(audioBlob);
        setUserAudioUrl(url);

        // Stop media tracks
        stream.getTracks().forEach((track) => track.stop());

        // Process audio with Sarvam AI
        await processAudio(audioBlob, targeted);
      };

      mediaRecorder.start(250);

      let recSec = 0;
      recordingTimerRef.current = setInterval(() => {
        recSec += 1;
        setRecordingSeconds(recSec);
        if (recSec >= 28) {
          stopRecording();
        }
      }, 1000);
    } catch (err: unknown) {
      console.error('Mic access error:', err);
      const msg = err instanceof Error ? err.message : 'Microphone access denied';
      setErrorMsg(msg);
      setStage('error');
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleUserAudioPlayback = () => {
    if (!userAudioUrl) return;

    if (!userAudioPlayerRef.current) {
      userAudioPlayerRef.current = new Audio(userAudioUrl);
      userAudioPlayerRef.current.onplay = () => setIsUserAudioPlaying(true);
      userAudioPlayerRef.current.onpause = () => setIsUserAudioPlaying(false);
      userAudioPlayerRef.current.onended = () => setIsUserAudioPlaying(false);
    }

    if (isUserAudioPlaying) {
      userAudioPlayerRef.current.pause();
    } else {
      userAudioPlayerRef.current.currentTime = 0;
      userAudioPlayerRef.current.play().catch(() => {});
    }
  };

  const processAudio = async (audioBlob: Blob, targeted = false) => {
    setStage('processing');
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'farmer_voice.webm');
      formData.append('lang', lang);

      const res = await fetch('/api/ai/sarvam/voice-fill', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process voice with Sarvam AI');
      }

      setTranscriptionSource(data.source || null);

      const ext = data.extracted as ExtractedListingData;
      setExtractedData(ext);

      // INCREMENTAL / TARGETED MERGE:
      // If targeted or re-recording a missing field, update ONLY the detected fields!
      const updated: string[] = [];

      if (!targeted || ext.detectedFields?.includes('quantity')) {
        if (ext.quantityQuintals) {
          setEditQuantity(ext.quantityQuintals);
          if (ext.detectedFields?.includes('quantity')) updated.push('quantity');
        }
      }
      if (!targeted || ext.detectedFields?.includes('village')) {
        if (ext.village) {
          setEditVillage(ext.village);
          if (ext.detectedFields?.includes('village')) updated.push('village');
        }
      }
      if (!targeted || ext.detectedFields?.includes('tehsil')) {
        if (ext.tehsil) {
          setEditTehsil(ext.tehsil);
          if (ext.detectedFields?.includes('tehsil')) updated.push('tehsil');
        }
      }
      if (!targeted || ext.detectedFields?.includes('district')) {
        if (ext.district) {
          setEditDistrict(ext.district);
          if (ext.detectedFields?.includes('district')) updated.push('district');
        }
      }
      if (!targeted || ext.detectedFields?.includes('form')) {
        if (ext.form) {
          setEditForm(ext.form);
          if (ext.detectedFields?.includes('form')) updated.push('form');
        }
      }
      if (!targeted || ext.detectedFields?.includes('price')) {
        if (ext.askingPricePerQuintal) {
          setEditPrice(ext.askingPricePerQuintal);
          if (ext.detectedFields?.includes('price')) updated.push('price');
        }
      }
      if (!targeted || ext.detectedFields?.includes('crop')) {
        if (ext.cropType) {
          setEditCrop(ext.cropType);
          if (ext.detectedFields?.includes('crop')) updated.push('crop');
        }
      }
      if (!targeted || ext.detectedFields?.includes('moisture')) {
        if (ext.moisture) {
          setEditMoisture(ext.moisture);
          if (ext.detectedFields?.includes('moisture')) updated.push('moisture');
        }
      }

      setRecentlyUpdatedFields(updated);
      setStage('review');
    } catch (err: unknown) {
      console.error('Voice processing error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to extract form details';
      setErrorMsg(msg);
      setStage('error');
    }
  };

  // Quick fallback demo sample when mic is unavailable or for testing
  const runDemoVoiceSample = async (sampleText?: string, targeted = false) => {
    stopAllMedia();
    setStage('processing');
    try {
      const res = await fetch('/api/ai/sarvam/voice-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript:
            sampleText ||
            'मेरे पास 300 क्विंटल पराली की गांठें हैं। गांव लड्डा, तहसील धूरी, जिला संगरूर में। रेट 210 रुपये प्रति क्विंटल है और पराली सूखी है।',
        }),
      });
      const data = await res.json();
      const ext = data.extracted as ExtractedListingData;
      setExtractedData(ext);

      const updated: string[] = [];
      if (!targeted || ext.detectedFields?.includes('quantity')) {
        if (ext.quantityQuintals) {
          setEditQuantity(ext.quantityQuintals);
          updated.push('quantity');
        }
      }
      if (!targeted || ext.detectedFields?.includes('village')) {
        if (ext.village) {
          setEditVillage(ext.village);
          updated.push('village');
        }
      }
      if (!targeted || ext.detectedFields?.includes('tehsil')) {
        if (ext.tehsil) {
          setEditTehsil(ext.tehsil);
          updated.push('tehsil');
        }
      }
      if (!targeted || ext.detectedFields?.includes('district')) {
        if (ext.district) {
          setEditDistrict(ext.district);
          updated.push('district');
        }
      }
      if (!targeted || ext.detectedFields?.includes('form')) {
        if (ext.form) {
          setEditForm(ext.form);
          updated.push('form');
        }
      }
      if (!targeted || ext.detectedFields?.includes('price')) {
        if (ext.askingPricePerQuintal) {
          setEditPrice(ext.askingPricePerQuintal);
          updated.push('price');
        }
      }

      setRecentlyUpdatedFields(updated.length > 0 ? updated : ext.detectedFields || []);
      setStage('review');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed demo sample');
      setStage('error');
    }
  };

  const handleConfirmAndApply = () => {
    onApply({
      village: editVillage.trim(),
      tehsil: editTehsil.trim() || undefined,
      district: editDistrict.trim(),
      quantity: Number(editQuantity) || 200,
      form: editForm,
      askingPrice: editPrice ? Number(editPrice) : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#1F3A5F] px-4 py-3 sm:px-5 sm:py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">
                  {lang === 'pa' ? 'ਸਰਵਮ AI ਆਵਾਜ਼ ਸਹਾਇਕ' : lang === 'hi' ? 'सर्वम AI आवाज़ सहायक' : 'Sarvam AI Voice Assistant'}
                </h3>
                <span className="text-[10px] bg-emerald-500 text-white font-semibold px-2 py-0.5 rounded-full">
                  saaras:v2
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {lang === 'pa' ? 'ਬੋਲ ਕੇ ਪਰਾਲੀ ਦਾ ਫਾਰਮ ਭਰੋ' : lang === 'hi' ? 'बोलकर पराली की लिस्टिंग भरें' : 'Voice-assisted stubble listing in Hindi & Punjabi'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {/* STAGE 1: INSTRUCTION AUDIO & PREPARATION (NO FORCED RUSH) */}
          {stage === 'instruction' && (
            <div className="space-y-4">
              {/* Instructions banner with Replay button & 2s buffer alert */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${isAudioPlaying ? 'bg-emerald-100 border-emerald-300 text-emerald-800 animate-pulse' : 'bg-amber-100 border-amber-300 text-amber-800'}`}>
                    <Volume2 className="w-5 h-5" />
                  </div>
                </div>
                <h4 className="font-bold text-sm text-[#1F3A5F]">
                  {lang === 'pa' ? 'ਹਿਦਾਇਤਾਂ ਧਿਆਨ ਨਾਲ ਸੁਣੋ (ਪੰਜਾਬੀ ਆਡੀਓ)' : lang === 'hi' ? 'निर्देश ध्यान से सुनें (हिंदी ऑडियो)' : 'Listen to Audio Instructions'}
                </h4>
                <p className="text-xs text-[#5B6675] mt-1 max-w-sm mx-auto">
                  {lang === 'pa'
                    ? 'ਤੁਸੀਂ ਆਡੀਓ ਨੂੰ ਜਿੰਨੀ ਵਾਰ ਚਾਹੋ ਦੁਬਾਰਾ ਸੁਣ ਸਕਦੇ ਹੋ। ਆਡੀਓ ਖਤਮ ਹੋਣ ਦੇ 2 ਸਕਿੰਟ ਬਾਅਦ ਰਿਕਾਰਡਿੰਗ ਸ਼ੁਰੂ ਹੋਵੇਗੀ।'
                    : lang === 'hi'
                    ? 'आप ऑडियो जितनी बार चाहें दोबारा सुन सकते हैं। ऑडियो खत्म होने के 2 सेकंड बाद रिकॉर्डिंग शुरू होगी।'
                    : 'You can replay instructions anytime. Recording starts 2 seconds after audio finishes.'}
                </p>

                {/* 2-Second Buffer Alert Countdown */}
                {bufferCountdown !== null && (
                  <div className="mt-3 p-2.5 bg-red-100/80 border border-red-300 rounded-lg text-center animate-pulse">
                    <p className="text-xs font-bold text-red-900 flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                      <span>
                        {lang === 'pa'
                          ? `ਰਿਕਾਰਡਿੰਗ ${bufferCountdown} ਸਕਿੰਟਾਂ ਵਿੱਚ ਸ਼ੁਰੂ ਹੋਵੇਗੀ...`
                          : lang === 'hi'
                          ? `रिकॉर्डिंग ${bufferCountdown} सेकंड में शुरू होगी...`
                          : `Recording starts in ${bufferCountdown}s...`}
                      </span>
                    </p>
                    <p className="text-[10px] text-red-700 mt-0.5">
                      {lang === 'pa'
                        ? 'ਰੋਕਣ ਜਾਂ ਦੁਬਾਰਾ ਸੁਣਨ ਲਈ ਹੇਠਾਂ "ਦੁਬਾਰਾ ਸੁਣੋ" ਦਬਾਓ'
                        : lang === 'hi'
                        ? 'रोकने या दोबारा सुनने के लिए नीचे "निर्देश दोबारा सुनें" दबाएं'
                        : 'Click "Replay" below if you want to listen again'}
                    </p>
                  </div>
                )}

                {/* Replay Instructions Audio Control */}
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleReplayInstructions}
                    className="px-4 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-800" />
                    <span>
                      {lang === 'pa' ? 'ਦੁਬਾਰਾ ਸੁਣੋ (Replay Audio)' : lang === 'hi' ? 'निर्देश दोबारा सुनें (Replay Audio)' : 'Replay Instructions'}
                    </span>
                  </button>
                  {isAudioPlaying && (
                    <button
                      type="button"
                      onClick={toggleInstructionAudio}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Pause className="w-3 h-3" />
                      <span>Pause</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Order of speaking guidance cards */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <p className="font-bold text-[#1F3A5F] text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span>📌</span>
                  <span>{lang === 'pa' ? 'ਇਸ ਕ੍ਰਮ ਵਿੱਚ ਬੋਲੋ:' : lang === 'hi' ? 'इस क्रम में बोलें:' : 'Say in this order:'}</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#334155]">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                    <span><strong>फसल:</strong> धान या बासमती</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                    <span><strong>मात्रा:</strong> जैसे 250 क्विंटल या 10 एकड़</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                    <span><strong>प्रकार:</strong> गांठें (बेल्ड) या खुली</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">4</span>
                    <span><strong>स्थान:</strong> गांव, तहसील, जिला</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 sm:col-span-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">5</span>
                    <span><strong>रेट व नमी:</strong> ₹210 प्रति क्विंटल, सूखी पराली</span>
                  </div>
                </div>
              </div>

              {/* Ready to Record Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => runDemoVoiceSample()}
                  className="text-xs text-[#5B6675] hover:text-[#1F3A5F] underline"
                >
                  ⚡ Try demo sample
                </button>
                <button
                  type="button"
                  onClick={() => startRecording(false)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#2E7D32] hover:bg-[#236327] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>{lang === 'pa' ? 'ਹੁਣ ਬੋਲਣਾ ਸ਼ੁਰੂ ਕਰੋ' : lang === 'hi' ? 'अब बोलना शुरू करें (Start Speaking)' : 'Start Speaking Now'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: LIVE RECORDING */}
          {stage === 'recording' && (
            <div className="text-center py-6 space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <span className="absolute w-24 h-24 rounded-full bg-red-400/20 animate-ping" />
                <span className="absolute w-20 h-20 rounded-full bg-red-400/40 animate-pulse" />
                <div className="relative w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                  <Mic className="w-8 h-8 animate-bounce" />
                </div>
              </div>

              <div>
                <h4 className="font-bold text-base text-[#1F3A5F]">
                  {isTargetedMode
                    ? (lang === 'pa' ? 'ਛੂਟੀ ਹੋਈ ਜਾਣਕਾਰੀ ਬੋਲੋ' : lang === 'hi' ? 'सिर्फ छूटी हुई जानकारी बोलें...' : 'Speaking missing/single field...')
                    : (lang === 'pa' ? 'ਸੁਣ ਰਿਹਾ ਹੈ... ਹੁਣ ਬੋਲੋ' : lang === 'hi' ? 'सुन रहा है... अब बोलिए' : 'Listening... Speak now')}
                </h4>
                <p className="text-xs text-[#5B6675] mt-1">
                  {isTargetedMode
                    ? (lang === 'pa' ? 'ਜਿਵੇਂ ਸਿਰਫ਼ ਮਾਤਰਾ: 350 ਕੁਇੰਟਲ ਜਾਂ ਪਿੰਡ ਲੱਡਾ' : lang === 'hi' ? 'जैसे सिर्फ: "मात्रा 350 क्विंटल" या "रेट 200 रुपये"' : 'e.g. "Quantity 350 quintals" or "Rate 200 rupees"')
                    : (lang === 'pa'
                    ? 'ਆਪਣੀ ਪਰਾਲੀ ਦੀ ਮਾਤਰਾ, ਪਿੰਡ, ਤਹਿਸੀਲ ਅਤੇ ਰੇਟ ਬੋਲੋ'
                    : lang === 'hi'
                    ? 'अपनी पराली की मात्रा, गांव, तहसील, जिला और अपेक्षित रेट बताएं'
                    : 'State crop, quantity, village, tehsil, district, and rate in Hindi or Punjabi')}
                </p>
                <div className="mt-3 font-mono font-bold text-sm text-red-600 bg-red-50 border border-red-200 inline-block px-3 py-1 rounded-md">
                  🔴 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 01:00
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-md transition-colors cursor-pointer"
                >
                  <MicOff className="w-4 h-4" />
                  <span>{lang === 'pa' ? 'ਬੋਲਣਾ ਸਮਾਪਤ ਕਰੋ' : lang === 'hi' ? 'बोलना समाप्त करें (Done & Process)' : 'Stop & Process'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STAGE 3: PROCESSING */}
          {stage === 'processing' && (
            <div className="text-center py-10 space-y-3">
              <Loader2 className="w-10 h-10 text-[#1F3A5F] animate-spin mx-auto" />
              <h4 className="font-bold text-sm text-[#1F3A5F]">
                {lang === 'pa'
                  ? 'ਸਰਵਮ AI ਤੁਹਾਡੀ ਆਵਾਜ਼ ਨੂੰ ਸਮਝ ਰਿਹਾ ਹੈ...'
                  : lang === 'hi'
                  ? 'सर्वम AI आपकी आवाज़ को समझ रहा है...'
                  : 'Sarvam AI saaras:v2 is processing your voice...'}
              </h4>
              <p className="text-xs text-[#5B6675]">
                {isTargetedMode
                  ? 'छूटे हुए विवरण को पहचान कर फॉर्म में जोड़ा जा रहा है...'
                  : 'फसल, मात्रा, गांव, तहसील और रेट को निकाला जा रहा है...'}
              </p>
            </div>
          )}

          {/* STAGE 4: REVIEW & CONFIRMATION CARD (WITH REPLAY & TARGETED FILL) */}
          {stage === 'review' && extractedData && (
            <div className="space-y-4">
              {/* Notice banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold">
                    {lang === 'pa' ? 'ਵੇਰਵੇ ਸਫ਼ਲਤਾਪੂਰਵਕ ਕੱਢੇ ਗਏ!' : lang === 'hi' ? 'जानकारी सफलतापूर्वक प्राप्त हुई!' : 'Information Extracted Successfully!'}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {lang === 'pa'
                      ? 'ਆਪਣੀ ਰਿਕਾਰਡਿੰਗ ਸੁਣੋ ਜਾਂ ਹੇਠਾਂ ਵੇਰਵਿਆਂ ਦੀ ਜਾਂਚ ਕਰੋ। ਜੇ ਕੁਝ ਛੁੱਟ ਗਿਆ ਹੈ ਤਾਂ ਦੁਬਾਰਾ ਬੋਲੋ।'
                      : lang === 'hi'
                      ? 'अपनी रिकॉर्डिंग सुनें या विवरण की पुष्टि करें। यदि कुछ छूट गया है, तो सिर्फ छूटी हुई जानकारी दोबारा बोल सकते हैं।'
                      : 'Listen to your voice recording or verify details below. Speak missing fields if needed.'}
                  </p>
                </div>
              </div>

              {/* What AI Heard & Farmer Recording Replay Player */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-[#5B6675] uppercase tracking-wider">
                      🎙️ {lang === 'pa' ? 'ਤੁਸੀਂ ਕੀ ਬੋਲਿਆ (ਟ੍ਰਾਂਸਕ੍ਰਿਪਟ):' : lang === 'hi' ? 'आपने क्या बोला (ट्रांसक्रिप्ट):' : 'What you said (Transcript):'}
                    </p>
                    {transcriptionSource === 'sarvam_api' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ Sarvam AI Live (saaras:v4)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        ⚡ Demo Simulation
                      </span>
                    )}
                  </div>
                  {/* Replay User Recording Button */}
                  {userAudioUrl && (
                    <button
                      type="button"
                      onClick={toggleUserAudioPlayback}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#1F3A5F] border border-slate-300 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      {isUserAudioPlaying ? (
                        <>
                          <Pause className="w-3 h-3 text-[#1F3A5F]" />
                          <span>{lang === 'pa' ? 'ਰੋਕੋ' : lang === 'hi' ? 'रोकें' : 'Pause'}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-[#2E7D32]" />
                          <span>{lang === 'pa' ? 'ਆਪਣੀ ਆਵਾਜ਼ ਸੁਣੋ' : lang === 'hi' ? 'अपनी आवाज़ सुनें (Replay)' : 'Listen to Voice'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#1B2430] italic font-medium">
                  &ldquo;{extractedData.rawTranscript}&rdquo;
                </p>
              </div>

              {/* Editable Fields Grid */}
              <div className="space-y-3 bg-white border border-[#D9DEE5] rounded-xl p-3.5 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                  <span className="font-bold text-[#1F3A5F]">
                    📋 {lang === 'pa' ? 'ਦਰਜ ਕੀਤੇ ਵੇਰਵੇ (ਜਾਂਚੋ ਜਾਂ ਬਦਲੋ)' : lang === 'hi' ? 'निकाले गए विवरण (जांचें या बदलें)' : 'Extracted Parameters (Review/Edit)'}
                  </span>
                  <span className="text-[10px] text-[#5B6675]">
                    {lang === 'pa' ? 'ਕਿਸੇ ਵੀ ਖੇਤਰ ਨੂੰ ਸੋਧੋ' : lang === 'hi' ? 'किसी भी फ़ील्ड को हाथ से भी बदल सकते हैं' : 'Fully editable'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Crop & Form */}
                  <div>
                    <label className="block font-semibold text-[#1F3A5F] mb-1">
                      🌾 {lang === 'pa' ? 'ਫਸਲ ਦਾ ਨਾਂ' : lang === 'hi' ? 'फसल' : 'Crop Type'}
                    </label>
                    <input
                      type="text"
                      value={editCrop}
                      onChange={(e) => setEditCrop(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-[#1F3A5F]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1F3A5F] mb-1">
                      📦 {lang === 'pa' ? 'ਪਰਾਲੀ ਦਾ ਰੂਪ' : lang === 'hi' ? 'पराली का प्रकार' : 'Straw Form'}
                    </label>
                    <select
                      value={editForm}
                      onChange={(e) => setEditForm(e.target.value as StrawForm)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-medium bg-white focus:ring-2 focus:ring-[#1F3A5F]"
                    >
                      <option value="baled">📦 Baled Bundles (गांठें / बेल्ड)</option>
                      <option value="loose">🌾 Loose Straw (खुली पराली)</option>
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-[#1F3A5F]">
                        ⚖️ {lang === 'pa' ? 'ਮਾਤਰਾ (ਕੁਇੰਟਲ)' : lang === 'hi' ? 'मात्रा (क्विंटल)' : 'Quantity (Quintals)'}
                      </label>
                      {recentlyUpdatedFields.includes('quantity') && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">✓ Voice Updated</span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-bold text-[#2E7D32] focus:ring-2 focus:ring-[#1F3A5F]"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-[#1F3A5F]">
                        💰 {lang === 'pa' ? 'ਰੇਟ (₹/ਕੁਇੰਟਲ)' : lang === 'hi' ? 'अपेक्षित मूल्य (₹/क्विंटल)' : 'Asking Price (₹/Qtl)'}
                      </label>
                      {recentlyUpdatedFields.includes('price') && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">✓ Voice Updated</span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="50"
                      max="5000"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-bold text-[#1F3A5F] focus:ring-2 focus:ring-[#1F3A5F]"
                    />
                  </div>

                  {/* Location: District */}
                  <div>
                    <label className="block font-semibold text-[#1F3A5F] mb-1">
                      📍 {lang === 'pa' ? 'ਜ਼ਿਲ੍ਹਾ' : lang === 'hi' ? 'जिला' : 'District'}
                    </label>
                    <select
                      value={editDistrict}
                      onChange={(e) => setEditDistrict(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-medium bg-white focus:ring-2 focus:ring-[#1F3A5F]"
                    >
                      {PUNJAB_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tehsil */}
                  <div>
                    <label className="block font-semibold text-[#1F3A5F] mb-1">
                      📍 {lang === 'pa' ? 'ਤਹਿਸੀਲ' : lang === 'hi' ? 'तहसील' : 'Tehsil'}
                    </label>
                    <input
                      type="text"
                      value={editTehsil}
                      onChange={(e) => setEditTehsil(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-[#1F3A5F]"
                    />
                  </div>

                  {/* Village */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-[#1F3A5F]">
                        📍 {lang === 'pa' ? 'ਪਿੰਡ' : lang === 'hi' ? 'गांव / ग्राम पंचायत' : 'Village'}
                      </label>
                      {recentlyUpdatedFields.includes('village') && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">✓ Voice Updated</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={editVillage}
                      onChange={(e) => setEditVillage(e.target.value)}
                      className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-[#1F3A5F]"
                    />
                  </div>
                </div>
              </div>

              {/* TARGETED VOICE-FILL (RECORD MISSING FIELD ONLY) */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-[#1F3A5F] flex items-center gap-1.5">
                    <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>{lang === 'pa' ? 'ਕੋਈ ਜਾਣਕਾਰੀ ਰਹਿ ਗਈ ਹੈ?' : lang === 'hi' ? 'क्या कोई जानकारी छूट गई है?' : 'Forgot to mention a field?'}</span>
                  </p>
                  <p className="text-[11px] text-[#5B6675]">
                    {lang === 'pa'
                      ? 'ਸਿਰਫ਼ ਛੁੱਟਿਆ ਹੋਇਆ ਵੇਰਵਾ ਬੋਲੋ (ਜਿਵੇਂ ਸਿਰਫ਼ ਮਾਤਰਾ ਜਾਂ ਰੇਟ)'
                      : lang === 'hi'
                      ? 'सिर्फ छूटी हुई जानकारी बोलें (जैसे सिर्फ: "मात्रा 400 क्विंटल" या "गांव चीमा")'
                      : 'Speak just the missing field without re-doing the whole form'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startRecording(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1.5 text-xs shrink-0 cursor-pointer shadow-2xs"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{lang === 'pa' ? 'ਛੂਟੀ ਜਾਣਕਾਰੀ ਬੋਲੋ' : lang === 'hi' ? 'छूटी जानकारी बोलें' : 'Speak Missing Field'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row justify-between items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setStage('instruction')}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-[#5B6675] hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'pa' ? 'ਪੂਰਾ ਦੁਬਾਰਾ ਬੋਲੋ' : lang === 'hi' ? 'पूरा दोबारा बोलें' : 'Start Fresh'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndApply}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#2E7D32] hover:bg-[#236327] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {lang === 'pa'
                      ? 'ਫਾਰਮ ਵਿੱਚ ਭਰੋ ਅਤੇ ਜਾਂਚੋ'
                      : lang === 'hi'
                      ? 'पुष्टि करें और फॉर्म में भरें'
                      : 'Confirm & Apply to Form'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STAGE 5: ERROR */}
          {stage === 'error' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 border border-red-200 flex items-center justify-center mx-auto text-red-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#1F3A5F]">
                  {lang === 'pa' ? 'ਕੁਝ ਗਲਤ ਹੋ ਗਿਆ' : lang === 'hi' ? 'आवाज़ रिकॉर्ड करने में समस्या हुई' : 'Voice Processing Error'}
                </h4>
                <p className="text-xs text-red-600 mt-1 max-w-sm mx-auto">
                  {errorMsg || 'Please allow microphone access or try typing manually.'}
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => runDemoVoiceSample()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#1F3A5F] text-xs font-semibold rounded-lg cursor-pointer"
                >
                  ⚡ Use Demo Sample
                </button>
                <button
                  type="button"
                  onClick={() => setStage('instruction')}
                  className="px-4 py-2 bg-[#1F3A5F] hover:bg-[#162C49] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'pa' ? 'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ' : lang === 'hi' ? 'पुनः प्रयास करें' : 'Try Again'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
