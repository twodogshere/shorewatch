'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.threadId;

  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [draftReady, setDraftReady] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchThreadData();
  }, [threadId]);

  const fetchThreadData = async () => {
    try {
      const response = await fetch(`/api/v1/inbox/threads/${threadId}`, {
        headers: {
          Authorization: `Bearer ${getCookie('sessionToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch thread');

      const data = await response.json();
      setThread(data.thread);
      setMessages(data.messages || []);
      setDraft(data.aiDraft?.content || '');
      setDraftReady(!!data.aiDraft?.id);

      // Mark as read
      await fetch(`/api/v1/inbox/threads/${threadId}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getCookie('sessionToken')}`,
        },
      }).catch(() => {});
    } catch (err) {
      setError('Failed to load thread');
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

  const handleSend = async () => {
    if (!draft.trim()) return;

    setSending(true);
    try {
      const draftId = thread?.aiDraft?.id || 'new';
      const response = await fetch(`/api/v1/drafts/${draftId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getCookie('sessionToken')}`,
        },
        body: JSON.stringify({
          threadId,
          content: draft,
        }),
      });

      if (!response.ok) throw new Error('Failed to send');

      // Refresh the thread
      await fetchThreadData();
      setDraft('');
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleRedraft = async () => {
    try {
      const response = await fetch(`/api/v1/inbox/threads/${threadId}/redraft`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getCookie('sessionToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to redraft');

      const data = await response.json();
      setDraft(data.aiDraft?.content || '');
    } catch (err) {
      setError('Failed to redraft');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading conversation...</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className={styles.errorContainer}>
        <h2>Conversation not found</h2>
        <p>The conversation you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
        <Link href="/dashboard/inbox" className={styles.backLink}>
          Back to Inbox
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/dashboard/inbox" className={styles.backLink}>
          ← Back to Inbox
        </Link>
        <div className={styles.threadInfo}>
          <h1>{thread.authorName}</h1>
          <div className={styles.metaInfo}>
            <span className={styles.platform}>{thread.platform}</span>
            <span className={`${styles.sentiment} ${styles[thread.sentiment]}`}>
              {thread.sentiment}
            </span>
          </div>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.noMessages}>No messages yet</div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`${styles.message} ${msg.isAuthor ? styles.outgoing : styles.incoming}`}
            >
              <div className={styles.messageAuthor}>{msg.authorName}</div>
              <div className={styles.messageContent}>{msg.content}</div>
              <div className={styles.messageTime}>{formatTime(msg.timestamp)}</div>
            </div>
          ))
        )}
      </div>

      {draftReady && (
        <div className={styles.draftBox}>
          <div className={styles.draftLabel}>AI-Generated Response Draft</div>
          <div className={styles.draftContent}>{draft}</div>
          <div className={styles.draftActions}>
            <button onClick={handleRedraft} className={styles.secondaryBtn}>
              Redraft
            </button>
            <button onClick={() => setDraft('')} className={styles.ghostBtn}>
              Edit
            </button>
          </div>
        </div>
      )}

      <div className={styles.replyComposer}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type your response here... (Cmd+Enter to send)"
          className={styles.composerTextarea}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              handleSend();
            }
          }}
        />
        <div className={styles.composerActions}>
          <button
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className={styles.primaryBtn}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(timestamp) {
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
}
