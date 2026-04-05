'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ThreadCard from '@/components/inbox/ThreadCard';
import ThreadFilters from '@/components/inbox/ThreadFilters';
import styles from './page.module.css';

export default function InboxPage() {
  const router = useRouter();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchThreads();
  }, [activeFilter]);

  const fetchThreads = async () => {
    setLoading(true);
    setError('');

    try {
      const filterParam = activeFilter !== 'all' ? `&filter=${activeFilter}` : '';
      const response = await fetch(`/api/v1/inbox?limit=50${filterParam}`, {
        headers: {
          Authorization: `Bearer ${getCookie('sessionToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch threads');

      const data = await response.json();
      setThreads(data.threads || []);
    } catch (err) {
      setError('Failed to load inbox');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
  };

  const handleThreadClick = (threadId) => {
    router.push(`/dashboard/inbox/${threadId}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Inbox</h1>
        <p className={styles.subtitle}>
          {threads.length} {threads.length === 1 ? 'conversation' : 'conversations'}
        </p>
      </div>

      <ThreadFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading conversations...</p>
        </div>
      ) : threads.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <h2>No conversations</h2>
          <p>You&apos;re all caught up! There are no conversations matching this filter.</p>
        </div>
      ) : (
        <div className={styles.threadList}>
          {threads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => handleThreadClick(thread.id)}
              className={styles.threadWrapper}
            >
              <ThreadCard thread={thread} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
