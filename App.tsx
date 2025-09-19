import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Language } from './types';
import { LANGUAGES } from './constants';
import { translateAndDetect, transcribeAndTranslate } from './services/geminiService';
import LanguageSelector from './components/LanguageSelector';
import RecordButton from './components/RecordButton';
import ResultDisplay from './components/ResultDisplay';
import SwapIcon from './components/icons/SwapIcon';
import UploadIcon from './components/icons/UploadIcon';

const en = {
  "appTitle": "Gemini Voice Translator",
  "interfaceLanguage": "Interface Language",
  "from": "From",
  "to": "To",
  "outputVoice": "Output Voice",
  "voiceAuto": "Auto",
  "voiceMale": "Male",
  "voiceFemale": "Female",
  "autoDetect": "Auto-detect",
  "original": "Original",
  "originalWithLang": "Original ({lang})",
  "translation": "Translation",
  "originalPlaceholder": "Your transcribed text will appear here...",
  "translationPlaceholder": "Translated text will appear here...",
  "processing": "Processing...",
  "errorFileTooLarge": "File is too large. Maximum size is 15MB.",
  "errorUnsupportedBrowser": "Speech recognition is not supported in this browser.",
  "errorSpeechRecognition": "Speech recognition error: {error}",
  "errorTranslation": "Failed to get translation from Gemini API.",
  "errorSpeechSynthesis": "Could not synthesize speech.",
  "errorUnknown": "An unknown error occurred.",
  "lang_en-US": "English",
  "lang_es-ES": "Spanish",
  "lang_fr-FR": "French",
  "lang_de-DE": "German",
  "lang_it-IT": "Italian",
  "lang_ja-JP": "Japanese",
  "lang_ko-KR": "Korean",
  "lang_pt-BR": "Portuguese",
  "lang_ru-RU": "Russian",
  "lang_zh-CN": "Chinese (Simplified)",
  "lang_ar-SA": "Arabic",
  "lang_hi-IN": "Hindi"
};

const ru = {
  "appTitle": "Голосовой переводчик Gemini",
  "interfaceLanguage": "Язык интерфейса",
  "from": "С языка",
  "to": "На язык",
  "outputVoice": "Голос озвучки",
  "voiceAuto": "Авто",
  "voiceMale": "Мужской",
  "voiceFemale": "Женский",
  "autoDetect": "Автоопределение",
  "original": "Оригинал",
  "originalWithLang": "Оригинал ({lang})",
  "translation": "Перевод",
  "originalPlaceholder": "Ваш распознанный текст появится здесь...",
  "translationPlaceholder": "Переведенный текст появится здесь...",
  "processing": "Обработка...",
  "errorFileTooLarge": "Файл слишком большой. Максимальный размер 15 МБ.",
  "errorUnsupportedBrowser": "Распознавание речи не поддерживается в этом браузере.",
  "errorSpeechRecognition": "Ошибка распознавания речи: {error}",
  "errorTranslation": "Не удалось получить перевод от Gemini API.",
  "errorSpeechSynthesis": "Не удалось синтезировать речь.",
  "errorUnknown": "Произошла неизвестная ошибка.",
  "lang_en-US": "Английский",
  "lang_es-ES": "Испанский",
  "lang_fr-FR": "Французский",
  "lang_de-DE": "Немецкий",
  "lang_it-IT": "Итальянский",
  "lang_ja-JP": "Японский",
  "lang_ko-KR": "Корейский",
  "lang_pt-BR": "Португальский",
  "lang_ru-RU": "Русский",
  "lang_zh-CN": "Китайский (упрощенный)",
  "lang_ar-SA": "Арабский",
  "lang_hi-IN": "Хинди"
};

const translations = { en, ru };
type Locale = keyof typeof translations;
type TranslationKey = keyof typeof en;

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

const getBrowserLanguageCode = (): string => {
    if (typeof navigator === 'undefined') return 'en-US';
    const browserLang = navigator.language;
    if (!browserLang) return 'en-US';
    const exactMatch = LANGUAGES.find(l => l.code === browserLang);
    if (exactMatch) return exactMatch.code;
    const langPrefix = browserLang.split('-')[0];
    const partialMatch = LANGUAGES.find(l => l.code.startsWith(langPrefix));
    if (partialMatch) return partialMatch.code;
    return 'en-US';
};

const App: React.FC = () => {
    const [locale, setLocale] = useState<Locale>('ru');
    const [sourceLang, setSourceLang] = useState<string>('auto');
    const [targetLang, setTargetLang] = useState<string>('en-US');
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [originalText, setOriginalText] = useState<string>('');
    const [translatedText, setTranslatedText] = useState<string>('');
    const [detectedLanguage, setDetectedLanguage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [voiceGender, setVoiceGender] = useState<'auto' | 'male' | 'female'>('auto');

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const audioFileRef = useRef<HTMLInputElement>(null);

    const t = useCallback((key: TranslationKey | string, params?: { [key: string]: string | number }) => {
        let text = translations[locale][key as TranslationKey] || key;
        if (params) {
            Object.keys(params).forEach(pKey => {
                text = text.replace(`{${pKey}}`, String(params[pKey]));
            });
        }
        return text;
    }, [locale]);
    
    useEffect(() => {
        const loadVoices = () => setVoices(speechSynthesis.getVoices());
        loadVoices();
        speechSynthesis.onvoiceschanged = loadVoices;
        return () => {
          speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const speak = useCallback((text: string, lang: string) => {
        if (!text || !window.speechSynthesis) {
            setIsProcessing(false);
            return;
        }
        
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const targetLangShort = lang.split('-')[0];
        const potentialVoices = voices.filter(v => v.lang === lang || v.lang.startsWith(targetLangShort));
        let selectedVoice: SpeechSynthesisVoice | undefined = undefined;

        if (potentialVoices.length > 0) {
            if (voiceGender !== 'auto') {
                const genderFilteredVoices = potentialVoices.filter(v => 
                    v.name.toLowerCase().includes(voiceGender)
                );
                if (genderFilteredVoices.length > 0) {
                    selectedVoice = genderFilteredVoices[0];
                }
            }
            if (!selectedVoice) {
                selectedVoice = potentialVoices[0];
            }
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        utterance.lang = lang;
        utterance.onend = () => setIsProcessing(false);
        utterance.onerror = () => {
            setError(t('errorSpeechSynthesis'));
            setIsProcessing(false);
        }
        speechSynthesis.speak(utterance);
    }, [voices, voiceGender, t]);

    const handleTextTranslation = useCallback(async (transcript: string) => {
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
            const detectedLangInfo = LANGUAGES.find(l => l.name === result.detectedLanguage);
            const detectedLangName = detectedLangInfo ? t(`lang_${detectedLangInfo.code}` as TranslationKey) : result.detectedLanguage;
            setDetectedLanguage(detectedLangName);
            speak(result.translatedText, targetLang);
        } catch (err) {
            setError(t('errorTranslation'));
            setIsProcessing(false);
        }
    }, [sourceLang, targetLang, speak, t]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError(t('errorUnsupportedBrowser'));
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = sourceLang === 'auto' ? getBrowserLanguageCode() : sourceLang;
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
                handleTextTranslation(transcript);
            }
        };
        recognition.onerror = (event) => {
            setError(t('errorSpeechRecognition', { error: event.error }));
            setIsProcessing(false);
            setIsRecording(false);
        };
        recognition.onend = () => {
            setIsRecording(false);
        };
        recognitionRef.current = recognition;
    }, [sourceLang, t, handleTextTranslation]);

    const startRecording = () => {
        if (isProcessing || isRecording || !recognitionRef.current) return;
        setIsRecording(true);
        setError(null);
        setOriginalText('');
        setTranslatedText('');
        setDetectedLanguage('');
        recognitionRef.current.start();
    };

    const stopRecording = () => {
        if (!isRecording || !recognitionRef.current) return;
        recognitionRef.current.stop();
    };
    
    const handleSwapLanguages = () => {
        if (sourceLang === 'auto') return;
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 15 * 1024 * 1024) { // 15 MB
            setError(t('errorFileTooLarge'));
            if(event.target) event.target.value = '';
            return;
        }

        setIsProcessing(true);
        setError(null);
        setOriginalText('');
        setTranslatedText('');
        setDetectedLanguage('');

        try {
            const base64Audio = await fileToBase64(file);
            const [meta, data] = base64Audio.split(',');

            if (!meta || !data) {
                throw new Error("Invalid file format");
            }
            
            const mimeType = meta.split(';')[0].split(':')[1];

            const result = await transcribeAndTranslate(
                { data, mimeType },
                sourceLang,
                targetLang
            );

            setOriginalText(result.transcribedText);
            setTranslatedText(result.translatedText);
            const detectedLangInfo = LANGUAGES.find(l => l.name === result.detectedLanguage);
            const detectedLangName = detectedLangInfo ? t(`lang_${detectedLangInfo.code}` as TranslationKey) : result.detectedLanguage;
            setDetectedLanguage(detectedLangName);

            speak(result.translatedText, targetLang);

        } catch (err) {
            setError(t('errorTranslation'));
            setIsProcessing(false);
        } finally {
            if (event.target) event.target.value = '';
        }
    };

    return (
        <div className="bg-slate-100 text-slate-800 min-h-screen flex flex-col items-center justify-center p-4 font-sans antialiased">
            <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-8">
                <header className="flex flex-col sm:flex-row justify-between items-center w-full">
                    <h1 className="text-3xl font-bold text-slate-800 mb-4 sm:mb-0">{t('appTitle')}</h1>
                    <div className="flex items-center space-x-2">
                        <label htmlFor="locale-selector" className="text-sm font-medium text-slate-600">{t('interfaceLanguage')}:</label>
                        <select
                            id="locale-selector"
                            value={locale}
                            onChange={(e) => setLocale(e.target.value as Locale)}
                            className="bg-slate-100 border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 shadow-sm"
                        >
                            <option value="ru">Русский</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                </header>

                <main className="w-full space-y-8">
                    <section className="space-y-4 border-b border-slate-200 pb-8">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div className="md:col-span-2">
                                <LanguageSelector
                                    id="source-lang"
                                    label={t('from')}
                                    value={sourceLang}
                                    onChange={(e) => setSourceLang(e.target.value)}
                                    languages={LANGUAGES}
                                    includeAuto={true}
                                    t={t}
                                />
                            </div>
                            <div className="flex items-center justify-center">
                                <button onClick={handleSwapLanguages} disabled={sourceLang === 'auto'} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                    <SwapIcon className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="md:col-span-2">
                                <LanguageSelector
                                    id="target-lang"
                                    label={t('to')}
                                    value={targetLang}
                                    onChange={(e) => setTargetLang(e.target.value)}
                                    languages={LANGUAGES.filter(l => l.code !== sourceLang)}
                                    t={t}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col w-full md:max-w-xs">
                            <label htmlFor="voice-gender" className="mb-2 text-sm font-medium text-slate-600">{t('outputVoice')}</label>
                            <select id="voice-gender" value={voiceGender} onChange={(e) => setVoiceGender(e.target.value as 'auto' | 'male' | 'female')} className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                                <option value="auto">{t('voiceAuto')}</option>
                                <option value="male">{t('voiceMale')}</option>
                                <option value="female">{t('voiceFemale')}</option>
                            </select>
                        </div>
                    </section>

                    <ResultDisplay
                        originalText={originalText}
                        translatedText={translatedText}
                        detectedLanguage={detectedLanguage}
                        isProcessing={isProcessing}
                        t={t}
                    />
                    
                    <div className="flex flex-col items-center justify-center pt-4 space-y-4">
                         <div className="flex items-center gap-6">
                            <RecordButton
                                isRecording={isRecording}
                                isProcessing={isProcessing}
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                onTouchStart={startRecording}
                                onTouchEnd={stopRecording}
                            />
                            <button
                                onClick={() => audioFileRef.current?.click()}
                                disabled={isProcessing || isRecording}
                                className="w-24 h-24 rounded-full flex items-center justify-center bg-white border-2 border-slate-300 text-slate-500 transition-all duration-200 ease-in-out shadow-sm hover:bg-slate-100 hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-300/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Upload audio file"
                            >
                                <UploadIcon className="w-10 h-10" />
                            </button>
                            <input
                                type="file"
                                ref={audioFileRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="audio/*"
                            />
                        </div>
                        {isProcessing && <p className="text-slate-500 animate-pulse">{t('processing')}</p>}
                        {error && <p className="text-red-700 font-medium mt-4 bg-red-50 border border-red-200 p-3 rounded-lg text-center">{error}</p>}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;