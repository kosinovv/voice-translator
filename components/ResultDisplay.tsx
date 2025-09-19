
import React from 'react';

interface ResultDisplayProps {
  originalText: string;
  translatedText: string;
  detectedLanguage: string;
  isProcessing: boolean;
}

const TextBox: React.FC<{ title: string; text: string; placeholder: string; }> = ({ title, text, placeholder }) => (
    <div className="bg-gray-800 p-4 rounded-lg flex-1 min-h-[120px] flex flex-col">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">{title}</h3>
        <p className="text-gray-200 flex-grow">
            {text || <span className="text-gray-500">{placeholder}</span>}
        </p>
    </div>
);

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  originalText,
  translatedText,
  detectedLanguage,
  isProcessing,
}) => {
  const sourceTitle = detectedLanguage 
    ? `Original (${detectedLanguage})` 
    : 'Original';

  return (
    <div className={`w-full max-w-2xl flex flex-col md:flex-row gap-4 transition-opacity duration-300 ${isProcessing && !originalText ? 'opacity-50' : 'opacity-100'}`}>
        <TextBox title={sourceTitle} text={originalText} placeholder="Your transcribed text will appear here..."/>
        <TextBox title="Translation" text={translatedText} placeholder="Translated text will appear here..."/>
    </div>
  );
};

export default ResultDisplay;
