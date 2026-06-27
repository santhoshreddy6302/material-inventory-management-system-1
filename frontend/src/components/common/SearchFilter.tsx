import { useState, useEffect, useRef } from 'react';
import { Search, X, Filter } from 'lucide-react';

interface FilterDef {
  key: string;
  label: string;
  type?: string;
  options?: { value: string; label: string }[];
}

interface SearchFilterProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  filters?: FilterDef[];
  onFilterChange?: (k: string, v: string) => void;
  filterValues?: Record<string, string>;
}

export default function SearchFilter({ value, onChange, placeholder = 'Search…', filters, onFilterChange, filterValues = {} }: SearchFilterProps) {
  const [showFilters, setShowFilters] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setShowFilters(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasActiveFilters = filters && Object.values(filterValues).some(v => v && v !== '');

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0" ref={ref}>
      <div className="relative flex-1 max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="form-input pl-9 pr-8"
        />
        {value && (
          <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {filters && (
        <div className="relative">
          <button
            onClick={() => setShowFilters(o => !o)}
            className={`btn-secondary relative ${hasActiveFilters ? 'border-primary-500 text-primary-600' : ''}`}
          >
            <Filter size={15} />
            <span className="hidden sm:inline">Filter</span>
            {hasActiveFilters && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary-500 rounded-full" />}
          </button>
          {showFilters && (
            <div className="absolute right-0 mt-2 w-64 card shadow-lg p-4 z-20 space-y-3">
              {filters.map(f => (
                <div key={f.key}>
                  <label className="form-label">{f.label}</label>
                  {f.type === 'select'
                    ? <select className="form-select" value={filterValues[f.key] || ''} onChange={e => onFilterChange && onFilterChange(f.key, e.target.value)}>
                        <option value="">All</option>
                        {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    : <input type={f.type || 'text'} className="form-input" value={filterValues[f.key] || ''} onChange={e => onFilterChange && onFilterChange(f.key, e.target.value)} />
                  }
                </div>
              ))}
              <button onClick={() => { Object.keys(filterValues).forEach(k => onFilterChange && onFilterChange(k, '')); setShowFilters(false); }} className="text-xs text-red-500 hover:text-red-700">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
