import React from 'react';

type TranslationKey = 'original' | 'originalWithLang' | 'translation' | 'originalPlaceholder' | 'translationPlaceholder';

interface ResultDisplayProps {
  originalText: string;
  translatedText: string;
  detectedLanguage: string;
  isProcessing: boolean;
  t: (key: TranslationKey | string, params?: { [key: string]: string | number }) => string;
}

const TextBox: React.FC<{ title: string; text: string; placeholder: string; }> = ({ title, text, placeholder }) => (
    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex-1 min-h-[120px] flex flex-col">
        <h3 className="text-sm font-semibold text-slate-500 mb-2">{title}</h3>
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
  t
}) => {
  const sourceTitle = detectedLanguage
    ? t('originalWithLang', { lang: detectedLanguage })
    : t('original');

  return (
    <div className={`w-full flex flex-col md:flex-row gap-4 transition-opacity duration-300 ${isProcessing && !originalText ? 'opacity-50' : 'opacity-100'}`}>
        <TextBox title={sourceTitle} text={originalText} placeholder={t('originalPlaceholder')}/>
        <TextBox title={t('translation')} text={translatedText} placeholder={t('translationPlaceholder')}/>
    </div>
  );
};

export default ResultDisplay;