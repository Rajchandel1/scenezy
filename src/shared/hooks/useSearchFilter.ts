import { useState, useMemo, useCallback } from 'react';

interface UseSearchFilterOptions<T> {
  data: T[];
  searchFields?: (keyof T)[];
  filterField?: keyof T;
}

export function useSearchFilter<T extends Record<string, any>>({
  data,
  searchFields = ['title', 'name', 'email'],
  filterField,
}: UseSearchFilterOptions<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          return typeof value === 'string' && value.toLowerCase().includes(query);
        })
      );
    }

    if (filterField && activeFilter !== 'all') {
      result = result.filter(item => item[filterField] === activeFilter);
    }

    return result;
  }, [data, searchQuery, activeFilter, searchFields, filterField]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setActiveFilter('all');
  }, []);

  const hasActiveFilters = searchQuery.trim() !== '' || activeFilter !== 'all';

  return {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filteredData,
    clearFilters,
    hasActiveFilters,
    totalCount: data.length,
    filteredCount: filteredData.length,
  };
}
