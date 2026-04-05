'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const inviteToken = params.inviteToken;

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teamName, setTeamName] = useState('');

  useState(() => {
    // Fetch invite details
    const fetchInvite = async () => {
      try {
        const response = await fetch(`/api/v1/auth/invite/${inviteToken}`);
        if (!response.ok) throw new Error('Invalid invite');
        const data = await response.json();
        setTeamName(data.teamName || '');
      } catch (err) {
        setError('This invite is invalid or has expired.');
      }
    };
    fetchInvite();
  }, [inviteToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/invite-accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteToken,
          name,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept invite');
      }

      const data = await response.json();

      // Store session token
      document.cookie = `sessionToken=${data.sessionToken}; path=/; secure; samesite=strict`;

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to accept invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Welcome to Shorewatch</h1>
          <p className={styles.subtitle}>
            You&apos;ve been invited to join <strong>{teamName || 'a team'}</strong>
          </p>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              disabled={loading}
            />
            <p className={styles.hint}>Minimum 8 characters for security</p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Accept Invite & Create Account'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <a href="/">Sign in instead</a>
        </p>
      </div>
    </div>
  );
}
