'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    unreadThreads: 0,
    flaggedItems: 0,
    avgResponseTime: 0,
    sentimentScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/v1/inbox?limit=0', {
          headers: {
            Authorization: `Bearer ${getCookie('sessionToken')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch stats');

        const data = await response.json();

        setStats({
          unreadThreads: data.unreadCount || 0,
          flaggedItems: data.flaggedCount || 0,
          avgResponseTime: data.avgResponseTime || 0,
          sentimentScore: data.sentiment || 0,
        });
      } catch (err) {
        setError('Failed to load dashboard stats');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <p>Welcome back! Here&apos;s your social intelligence summary.</p>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading your dashboard...</p>
        </div>
      ) : (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Unread Threads</div>
            <div className={styles.statValue}>{stats.unreadThreads}</div>
            <div className={styles.statDescription}>Messages awaiting response</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Flagged Items</div>
            <div className={styles.statValue}>{stats.flaggedItems}</div>
            <div className={styles.statDescription}>High-priority conversations</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Avg Response Time</div>
            <div className={styles.statValue}>{stats.avgResponseTime}h</div>
            <div className={styles.statDescription}>Hours to first response</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Today&apos;s Sentiment</div>
            <div className={`${styles.statValue} ${getSentimentClass(stats.sentimentScore)}`}>
              {getSentimentLabel(stats.sentimentScore)}
            </div>
            <div className={styles.statDescription}>Overall conversation tone</div>
          </div>
        </div>
      )}

      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>
        <div className={styles.actionGrid}>
          <a href="/dashboard/inbox" className={styles.actionCard}>
            <div className={styles.actionIcon}>📬</div>
            <div className={styles.actionTitle}>Go to Inbox</div>
            <div className={styles.actionDesc}>Review all conversations</div>
          </a>
          <a href="/dashboard/briefs" className={styles.actionCard}>
            <div className={styles.actionIcon}>📋</div>
            <div className={styles.actionTitle}>View Briefs</div>
            <div className={styles.actionDesc}>Check AI-generated summaries</div>
          </a>
          <a href="/dashboard/analytics" className={styles.actionCard}>
            <div className={styles.actionIcon}>📊</div>
            <div className={styles.actionTitle}>Analytics</div>
            <div className={styles.actionDesc}>View performance metrics</div>
          </a>
          <a href="/dashboard/team" className={styles.actionCard}>
            <div className={styles.actionIcon}>👥</div>
            <div className={styles.actionTitle}>Team Settings</div>
            <div className={styles.actionDesc}>Manage team members</div>
          </a>
        </div>
      </div>
    </div>
  );
}

function getSentimentClass(score) {
  if (score > 0.3) return 'positive';
  if (score < -0.3) return 'negative';
  return 'neutral';
}

function getSentimentLabel(score) {
  if (score > 0.3) return 'Positive 😊';
  if (score < -0.3) return 'Negative 😞';
  return 'Neutral 😐';
}
