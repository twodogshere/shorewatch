import Badge from '@/components/common/Badge';
import styles from './ThreadCard.module.css';

export default function ThreadCard({ thread }) {
  const getInitials = (name) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className={styles.card}>
      {thread.isUnread && <div className={styles.unreadDot} />}

      <div className={styles.avatar}>{getInitials(thread.authorName)}</div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.author}>{thread.authorName}</h3>
          <span className={styles.time}>{getTimeAgo(thread.timestamp)}</span>
        </div>

        <p className={styles.preview}>{thread.preview}</p>

        <div className={styles.footer}>
          <Badge type={thread.sentiment}>{thread.sentiment}</Badge>
          {thread.platform && (
            <span className={styles.platform}>{thread.platform}</span>
          )}
          {thread.aiDraftReady && (
            <span className={styles.draftIndicator}>✓ Draft ready</span>
          )}
        </div>
      </div>
    </div>
  );
}
