'use client';

import { useState } from 'react';

type DateFilter = 'today' | '7days' | 'all';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  escaladesOnly: boolean;
  onEscaladesOnlyChange: (only: boolean) => void;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  escaladesOnly,
  onEscaladesOnlyChange,
}: FilterBarProps) {
  return (
    <div className="px-6 py-4 bg-[var(--bg)] border-b border-[var(--border)]">
      <div className="flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Rechercher par numéro..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="px-3 py-2 bg-white border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text)] placeholder-[var(--text3)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
        />
        <select
          value={dateFilter}
          onChange={(e) => onDateFilterChange(e.target.value as DateFilter)}
          className="px-3 py-2 bg-white border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
        >
          <option value="today">Aujourd'hui</option>
          <option value="7days">7 derniers jours</option>
          <option value="all">Tout</option>
        </select>
        <label className="flex items-center gap-2 text-[var(--text)] cursor-pointer">
          <input
            type="checkbox"
            checked={escaladesOnly}
            onChange={(e) => onEscaladesOnlyChange(e.target.checked)}
            className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          Escalades uniquement
        </label>
      </div>
    </div>
  );
}