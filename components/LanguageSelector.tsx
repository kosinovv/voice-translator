
import React from 'react';
import { Language } from '../types';

interface LanguageSelectorProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  languages: Language[];
  includeAuto?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  id,
  label,
  value,
  onChange,
  languages,
  includeAuto = false,
}) => (
  <div className="flex flex-col w-full">
    <label htmlFor={id} className="mb-2 text-sm font-medium text-gray-400">
      {label}
    </label>
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 appearance-none"
    >
      {includeAuto && <option value="auto">Auto-detect</option>}
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  </div>
);

export default LanguageSelector;
