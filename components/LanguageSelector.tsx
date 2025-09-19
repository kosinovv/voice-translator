import React from 'react';
import { Language } from '../types';

type TranslationKey = `lang_${string}` | 'autoDetect';

interface LanguageSelectorProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  languages: Language[];
  includeAuto?: boolean;
  t: (key: TranslationKey | string) => string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  id,
  label,
  value,
  onChange,
  languages,
  includeAuto = false,
  t,
}) => (
  <div className="flex flex-col w-full">
    <label htmlFor={id} className="mb-2 text-sm font-medium text-slate-600">
      {label}
    </label>
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
    >
      {includeAuto && <option value="auto">{t('autoDetect')}</option>}
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {t(`lang_${lang.code}`)}
        </option>
      ))}
    </select>
  </div>
);

export default LanguageSelector;