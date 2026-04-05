'use client';

import { useEffect, useState } from 'react';
import InviteModal from '@/components/team/InviteModal';
import styles from './page.module.css';

export default function TeamPage() {
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const response = await fetch('/api/v1/team', {
        headers: {
          Authorization: `Bearer ${getCookie('sessionToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch team');

      const data = await response.json();
      setTeam(data.team);
      setMembers(data.members || []);
    } catch (err) {
      setError('Failed to load team data');
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

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(`/api/v1/team/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getCookie('sessionToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to remove member');

      setMembers(members.filter((m) => m.id !== memberId));
    } catch (err) {
      setError('Failed to remove member');
      console.error(err);
    }
  };

  const handleInviteSuccess = () => {
    setShowInviteModal(false);
    fetchTeamData();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Team Management</h1>
          <p className={styles.subtitle}>
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className={styles.inviteButton}
        >
          + Invite Member
        </button>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading team...</p>
        </div>
      ) : (
        <>
          <div className={styles.teamCard}>
            <h2>Team Information</h2>
            <div className={styles.teamInfo}>
              <div className={styles.infoRow}>
                <label>Team Name</label>
                <span>{team?.name || 'Unnamed Team'}</span>
              </div>
              <div className={styles.infoRow}>
                <label>Members</label>
                <span>{members.length}</span>
              </div>
              <div className={styles.infoRow}>
                <label>Created</label>
                <span>{formatDate(team?.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className={styles.membersSection}>
            <h2>Team Members</h2>
            {members.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No team members yet. Invite someone to get started!</p>
              </div>
            ) : (
              <div className={styles.membersList}>
                {members.map((member) => (
                  <div key={member.id} className={styles.memberCard}>
                    <div className={styles.memberAvatar}>
                      {getInitials(member.name)}
                    </div>
                    <div className={styles.memberDetails}>
                      <div className={styles.memberName}>{member.name}</div>
                      <div className={styles.memberEmail}>{member.email}</div>
                      <div className={styles.memberMeta}>
                        <span className={styles.roleBadge}>{member.role}</span>
                        <span className={styles.joinedDate}>
                          Joined {formatDate(member.joinedAt)}
                        </span>
                      </div>
                    </div>
                    <div className={styles.memberStatus}>
                      <span
                        className={`${styles.statusBadge} ${
                          member.isActive ? styles.active : styles.inactive
                        }`}
                      >
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className={styles.memberActions}>
                      <button
                        onClick={() => setEditingMemberId(member.id)}
                        className={styles.editButton}
                        disabled
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className={styles.removeButton}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={handleInviteSuccess}
        />
      )}
    </div>
  );
}

function getInitials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
