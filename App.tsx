import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Language } from './types';
import { LANGUAGES } from './constants';
import { translateAndDetect } from './services/geminiService';
import LanguageSelector from './components/LanguageSelector';
import RecordButton from './components/RecordButton';
import ResultDisplay from './components/ResultDisplay';
import SwapIcon from './components/icons/SwapIcon';

// FIX: Add type definitions for the Web Speech API to resolve TypeScript errors.
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  }
}

// Helper to get a best-guess language for speech recognition from browser settings
const getBrowserLanguageCode = (): string => {
    if (typeof navigator === 'undefined') return 'en-US';
    const browserLang = navigator.language;
    if (!browserLang) return 'en-US';

    // Check for an exact match (e.g., 'es-ES' === 'es-ES')
    const exactMatch = LANGUAGES.find(l => l.code === browserLang);
    if (exactMatch) return exactMatch.code;

    // Check for a language prefix match (e.g., 'en' for 'en-GB')
    const langPrefix = browserLang.split('-')[0];
    const partialMatch = LANGUAGES.find(l => l.code.startsWith(langPrefix));
    if (partialMatch) return partialMatch.code;
    
    return 'en-US'; // Fallback to English
};


const App: React.FC = () => {
  const [sourceLang, setSourceLang] = useState<string>('auto');
  const [targetLang, setTargetLang] = useState<string>('es-ES');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [originalText, setOriginalText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceGender, setVoiceGender] = useState<'auto' | 'male' | 'female'>('auto');

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const loadVoices = () => setVoices(speechSynthesis.getVoices());
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = sourceLang === 'auto' ? getBrowserLanguageCode() : sourceLang;
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleTranslation(transcript);
      };

      recognition.onerror = (event) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsProcessing(false);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        if (isRecording) { // If it stops unexpectedly
            setIsRecording(false);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setError("Speech recognition is not supported in this browser.");
    }

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, [sourceLang, isRecording]); // Re-create if sourceLang changes

  const speak = useCallback((text: string, lang: string) => {
    if (!text || !window.speechSynthesis) {
        setIsProcessing(false);
        return;
    }
    
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const targetLangShort = lang.split('-')[0];

    let selectedVoice: SpeechSynthesisVoice | undefined = undefined;

    // Find all voices for the target language
    const potentialVoices = voices.filter(v => 
        v.lang === lang || v.lang.startsWith(targetLangShort)
    );

    if (potentialVoices.length > 0) {
        // If a gender is specified, try to find a matching voice
        if (voiceGender !== 'auto') {
            const genderFilteredVoices = potentialVoices.filter(v => 
                v.name.toLowerCase().includes(voiceGender)
            );
            if (genderFilteredVoices.length > 0) {
                selectedVoice = genderFilteredVoices[0]; // Use the first match
            }
        }
        
        // Fallback: if no gender-specific voice was found, or if set to 'auto', use the first available voice.
        if (!selectedVoice) {
            selectedVoice = potentialVoices[0];
        }
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.lang = lang;
    utterance.pitch = 1;
    utterance.rate = 1;

    utterance.onend = () => setIsProcessing(false);
    utterance.onerror = () => {
        setError("Could not synthesize speech.");
        setIsProcessing(false);
    }
    
    speechSynthesis.speak(utterance);
  }, [voices, voiceGender]);

  const handleTranslation = useCallback(async (transcript: string) => {
    if (!transcript) {
        setIsProcessing(false);
        return;
    };
    setOriginalText(transcript);
    setIsProcessing(true);
    setError(null);
    setTranslatedText('');
    setDetectedLanguage('');

    try {
      const result = await translateAndDetect(transcript, sourceLang, targetLang);
      setTranslatedText(result.translatedText);
      setDetectedLanguage(result.detectedLanguage);
      speak(result.translatedText, targetLang);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setIsProcessing(false);
    }
  }, [sourceLang, targetLang, speak]);

  const handleRecordStart = () => {
    if (isProcessing || !recognitionRef.current) return;
    setIsRecording(true);
    setError(null);
    setOriginalText('');
    setTranslatedText('');
    setDetectedLanguage('');
    recognitionRef.current.start();
  };

  const handleRecordStop = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true); // Switch to processing state immediately
    }
  };

  const swapLanguages = () => {
    if (sourceLang === 'auto') return; // Cannot swap with auto-detect
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center p-4 font-sans">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8 my-auto">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Voice-to-Voice Translator
          </h1>
          <p className="text-gray-400 mt-2">Powered by Google Gemini</p>
        </header>

        <div className="w-full bg-gray-800/50 p-4 rounded-xl shadow-lg flex items-center gap-2 md:gap-4">
          <LanguageSelector
            id="source-lang"
            label="From"
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            languages={LANGUAGES}
            includeAuto
          />
          <button 
            onClick={swapLanguages} 
            disabled={sourceLang === 'auto'}
            className="p-2 rounded-full mt-6 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Swap languages"
          >
            <SwapIcon className="w-5 h-5 text-gray-300" />
          </button>
          <LanguageSelector
            id="target-lang"
            label="To"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            languages={LANGUAGES}
          />
        </div>
        
        <ResultDisplay 
          originalText={originalText}
          translatedText={translatedText}
          detectedLanguage={detectedLanguage}
          isProcessing={isProcessing}
        />

        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg w-full max-w-2xl text-center text-sm">{error}</div>}

        <div className="flex flex-col items-center gap-6 text-center mt-auto pt-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-400">Output Voice:</span>
            <div className="flex items-center p-1 rounded-full bg-gray-800">
              {(['auto', 'male', 'female'] as const).map((gender) => (
                <button
                  key={gender}
                  onClick={() => setVoiceGender(gender)}
                  className={`px-4 py-1 text-sm rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                    voiceGender === gender
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </button>
              ))}
            </div>
          </div>
        
          <div>
            <RecordButton 
              isRecording={isRecording}
              isProcessing={isProcessing}
              onMouseDown={handleRecordStart}
              onMouseUp={handleRecordStop}
              onTouchStart={handleRecordStart}
              onTouchEnd={handleRecordStop}
            />
            <p className="mt-4 text-gray-500 text-sm">
              {isProcessing ? "Processing..." : isRecording ? "Recording..." : "Press and hold to speak"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;