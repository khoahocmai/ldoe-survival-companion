import React from 'react';
import { Search, X } from 'lucide-react';

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
      className="h-control w-full rounded-control border border-line bg-surface pl-9 pr-9 text-sm placeholder:text-faint focus:border-accent-solid focus:outline-none [&::-webkit-search-cancel-button]:hidden"
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
