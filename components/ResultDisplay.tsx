import React from 'react';
import ReplayIcon from './icons/ReplayIcon';

type TranslationKey = 'original' | 'originalWithLang' | 'translation' | 'originalPlaceholder' | 'translationPlaceholder' | 'replayTranslation';

interface ResultDisplayProps {
  originalText: string;
  translatedText: string;
  detectedLanguage: string;
  isProcessing: boolean;
  isSpeaking: boolean;
  onReplay: () => void;
  t: (key: TranslationKey | string, params?: { [key: string]: string | number }) => string;
}

const TextBox: React.FC<{ title: string; text: string; placeholder: string; actionButton?: React.ReactNode; }> = ({ title, text, placeholder, actionButton }) => (
    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex-1 min-h-[120px] flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-500">{title}</h3>
          {actionButton}
        </div>
        <p className="text-slate-800 flex-grow whitespace-pre-wrap">
            {text || <span className="text-slate-400">{placeholder}</span>}
        </p>
    </div>
);

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  originalText,
  translatedText,
  detectedLanguage,
  isProcessing,
  isSpeaking,
  onReplay,
  t
}) => {
  const sourceTitle = detectedLanguage
    ? t('originalWithLang', { lang: detectedLanguage })
    : t('original');

  const replayButton = (
    <button
      onClick={onReplay}
      disabled={!translatedText || isProcessing || isSpeaking}
      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      aria-label={t('replayTranslation')}
    >
      <ReplayIcon className="w-5 h-5" />
    </button>
  );

  return (
    <div className={`w-full flex flex-col md:flex-row gap-4 transition-opacity duration-300 ${isProcessing && !originalText ? 'opacity-50' : 'opacity-100'}`}>
        <TextBox title={sourceTitle} text={originalText} placeholder={t('originalPlaceholder')}/>
        <TextBox title={t('translation')} text={translatedText} placeholder={t('translationPlaceholder')} actionButton={replayButton} />
    </div>
  );
};

export default ResultDisplay;
