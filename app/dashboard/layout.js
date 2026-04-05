'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './layout.module.css';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [channelTab, setChannelTab] = useState('parent');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for sessionToken cookie
    const cookies = document.cookie.split(';');
    const hasSession = cookies.some(cookie =>
      cookie.trim().startsWith('sessionToken=')
    );

    if (!hasSession) {
      router.push('/');
    }
  }, [router]);

  if (!mounted) return null;

  const navItems = [
    { href: '/dashboard', label: 'Inbox', icon: '📬' },
    { href: '/dashboard/briefs', label: 'Briefs', icon: '📋' },
    { href: '/dashboard/analytics', label: 'Analytics', icon: '📊' },
    { href: '/dashboard/team', label: 'Team', icon: '👥' },
  ];

  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/inbox');
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.logo}>Shorewatch</h1>
        </div>

        <div className={styles.channelTabs}>
          <button
            className={`${styles.tab} ${channelTab === 'parent' ? styles.active : ''}`}
            onClick={() => setChannelTab('parent')}
          >
            Parent
          </button>
          <button
            className={`${styles.tab} ${channelTab === 'provider' ? styles.active : ''}`}
            onClick={() => setChannelTab('provider')}
          >
            Provider
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            className={styles.logoutButton}
            onClick={() => {
              document.cookie = 'sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
              router.push('/');
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.topBar}>
          <div className={styles.channelLabel}>
            {channelTab === 'parent' ? 'Parent Channel' : 'Provider Channel'}
          </div>
          <div className={styles.topBarActions}>
            {/* Future: notifications, user menu */}
          </div>
        </div>
        <div className={styles.contentArea}>{children}</div>
      </main>
    </div>
  );
}
