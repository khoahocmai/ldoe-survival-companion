import React from 'react';
import { Search, X } from 'lucide-react';
import { controlClass } from './controlStyles';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  className = '',
}) => (
  <div className={`relative flex w-full items-center ${className}`}>
    <Search className="pointer-events-none absolute left-3 h-4 w-4 text-faint" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className={`${controlClass} h-control pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden`}
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Xóa tìm kiếm"
        className="absolute right-2 rounded p-1 text-faint hover:text-fg"
      >
        <X className="h-4 w-4" />
      </button>
    )}
  </div>
);
