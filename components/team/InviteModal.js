'use client';

import { useState } from 'react';
import Modal from '@/components/common/Modal';
import styles from './InviteModal.module.css';

export default function InviteModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('content_creator');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getCookie('sessionToken')}`,
        },
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        throw new Error('Failed to send invite');
      }

      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to send invite');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Invite Team Member">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            required
            disabled={loading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="role">Role</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={loading}
          >
            <option value="content_creator">Content Creator</option>
            <option value="content_lead">Content Lead</option>
            <option value="analyst">Analyst</option>
          </select>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={onClose}
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.inviteButton}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
