import styles from './Badge.module.css';

export default function Badge({ type = 'neutral', children }) {
  return <span className={`${styles.badge} ${styles[type]}`}>{children}</span>;
}
