'use client';

import styles from './ThreadFilters.module.css';

export default function ThreadFilters({ activeFilter, onFilterChange }) {
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'needs_attention', label: 'Needs Attention' },
    { id: 'unread', label: 'Unread' },
    { id: 'flagged', label: 'Flagged' },
    { id: 'positive', label: 'Positive' },
    { id: 'negative', label: 'Negative' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.filterGroup}>
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`${styles.pill} ${activeFilter === filter.id ? styles.active : ''}`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
