// src/components/TNAReminders.jsx
// FIXED: Sorts reminders by date - LATEST FIRST

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { FaBell, FaTimes, FaChevronDown, FaChevronUp, FaCheckCircle, FaSpinner } from 'react-icons/fa';

const getAuthToken = () =>
  localStorage.getItem('token') || sessionStorage.getItem('token');

const api = axios.create({
  baseURL: 'http://119.148.51.38:8000/api/merchandiser/api/',
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

// Helper function to sort reminders by date (latest first)
const sortRemindersByDate = (reminders) => {
  return [...reminders].sort((a, b) => {
    const dateA = new Date(a.reminder_date);
    const dateB = new Date(b.reminder_date);
    return dateB - dateA; // Descending - latest first
  });
};

export default function TNAReminders({ onReminderClick, autoFetch = true }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  const fetchRef = useRef(null);

  const fetchReminders = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      
      const response = await api.get('tna/reminders/', {
        params: { page: pageNum, page_size: 100 }
      });
      
      const data = response.data;
      const newReminders = data.results || [];
      
      // Sort new reminders by date (latest first)
      const sortedNewReminders = sortRemindersByDate(newReminders);
      
      if (append) {
        setReminders(prev => {
          const combined = [...prev, ...sortedNewReminders];
          return sortRemindersByDate(combined); // Resort combined list
        });
      } else {
        setReminders(sortedNewReminders);
      }
      
      setTotalCount(data.count || 0);
      setTotalPages(data.total_pages || 1);
      setHasMore(pageNum < (data.total_pages || 1));
      setPage(pageNum);
      setLastCheckTime(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError('Failed to load reminders');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Auto-fetch on mount and every 5 minutes
  useEffect(() => {
    if (!autoFetch) return;
    
    fetchReminders(1, false);
    
    const interval = setInterval(() => {
      fetchReminders(1, false);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [autoFetch, fetchReminders]);

  // Load more function
  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      fetchReminders(page + 1, true);
    }
  }, [hasMore, loadingMore, page, fetchReminders]);

  // Mark as read
  const markAsRead = async (reminderId) => {
    try {
      await api.post(`tna/reminders/${reminderId}/mark-read/`);
      setReminders(prev => prev.filter(r => r.id !== reminderId));
      setTotalCount(prev => prev - 1);
    } catch (err) {
      console.error('Error marking reminder as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.post('tna/reminders/mark-all-read/');
      setReminders([]);
      setTotalCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getUrgencyColor = (level) => {
    switch (level) {
      case 'overdue': return '#dc2626';
      case 'urgent':  return '#f59e0b';
      default:        return '#2563eb';
    }
  };

  const getUrgencyIcon = (level) => {
    switch (level) {
      case 'overdue': return '🔴';
      case 'urgent':  return '⚠️';
      default:        return '📅';
    }
  };

  const getTimeText = (daysUntil) => {
    if (daysUntil < 0)  return `${Math.abs(daysUntil)} days overdue`;
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    return `${daysUntil} days left`;
  };

  const urgentCount = reminders.filter(
    r => r.urgency_level === 'urgent' || r.urgency_level === 'overdue'
  ).length;

  // Empty state
  if (!loading && totalCount === 0 && !error) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <FaCheckCircle style={{ color: '#10b981', fontSize: '20px' }} />
          <span style={styles.emptyText}>All TNA dates are on track</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header / toggle */}
      <div style={styles.header} onClick={() => setExpanded(!expanded)}>
        <div style={styles.headerLeft}>
          <FaBell style={styles.bellIcon} />
          <span style={styles.headerTitle}>
            TNA Reminders
            {totalCount > 0 && (
              <span style={styles.badge}>
                {urgentCount > 0 ? `${urgentCount} urgent` : totalCount}
              </span>
            )}
          </span>
        </div>
        <div style={styles.headerRight}>
          {totalCount > 0 && (
            <button
              style={styles.markAllBtn}
              onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
            >
              Mark all read
            </button>
          )}
          {expanded ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
          <span style={styles.sortIndicator}>⬇️ Latest</span>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div style={styles.body}>
          {loading ? (
            <div style={styles.loading}>Loading reminders…</div>
          ) : error ? (
            <div style={styles.error}>{error}</div>
          ) : totalCount === 0 ? (
            <div style={styles.noReminders}>No upcoming reminders</div>
          ) : (
            <>
              <div style={styles.reminderList}>
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    style={{
                      ...styles.reminderItem,
                      borderLeftColor: getUrgencyColor(reminder.urgency_level),
                    }}
                    onClick={() => onReminderClick && onReminderClick(reminder.tna_id)}
                  >
                    <div style={styles.reminderIcon}>
                      {getUrgencyIcon(reminder.urgency_level)}
                    </div>
                    <div style={styles.reminderContent}>
                      <div style={styles.reminderTitle}>
                        {reminder.order_number || `TNA-${reminder.tna_id}`}
                        <span style={styles.reminderSupplier}>
                          {reminder.supplier ? ` • ${reminder.supplier}` : ''}
                        </span>
                        <span style={styles.reminderDateTag}>
                          {new Date(reminder.reminder_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={styles.reminderMessage}>{reminder.message}</div>
                      <div style={styles.reminderMeta}>
                        <span style={styles.reminderDays}>
                          {getTimeText(reminder.days_until)}
                        </span>
                        <span style={styles.reminderType}>
                          {reminder.reminder_type?.replace('_', ' ') || 'General'}
                        </span>
                      </div>
                    </div>
                    <button
                      style={styles.dismissBtn}
                      onClick={(e) => { e.stopPropagation(); markAsRead(reminder.id); }}
                      title="Dismiss"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Load More */}
              {hasMore && (
                <div style={styles.loadMoreContainer}>
                  <button
                    style={styles.loadMoreBtn}
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <FaSpinner style={styles.spinning} /> Loading more...
                      </>
                    ) : (
                      `Load more (${totalCount - reminders.length} remaining)`
                    )}
                  </button>
                </div>
              )}
              
              <div style={styles.footer}>
                Showing {reminders.length} of {totalCount} reminders
                {lastCheckTime && ` • Last checked: ${lastCheckTime.toLocaleTimeString()}`}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    marginBottom: '16px',
    overflow: 'hidden',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: '#f0fdf4',
    borderRadius: '12px',
  },
  emptyText: { color: '#10b981', fontSize: '14px', fontWeight: '500' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    transition: 'background 0.2s',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  bellIcon: { color: '#2563eb', fontSize: '18px' },
  headerTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    background: '#ef4444',
    color: 'white',
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  sortIndicator: {
    fontSize: '11px',
    color: '#64748b',
    background: '#f1f5f9',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  markAllBtn: {
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#2563eb',
    background: 'transparent',
    border: '1px solid #2563eb',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  body: { padding: '12px 16px' },
  loading: { textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' },
  error: { textAlign: 'center', padding: '20px', color: '#dc2626', fontSize: '13px' },
  noReminders: { textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' },
  reminderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  reminderItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    background: '#f8fafc',
    borderRadius: '8px',
    borderLeft: '4px solid #2563eb',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  reminderIcon: { fontSize: '18px', flexShrink: 0, marginTop: '2px' },
  reminderContent: { flex: 1, minWidth: 0 },
  reminderTitle: { 
    fontSize: '13px', 
    fontWeight: '600', 
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  reminderSupplier: { fontSize: '12px', fontWeight: '400', color: '#64748b' },
  reminderDateTag: {
    fontSize: '10px',
    fontWeight: '500',
    color: '#64748b',
    background: '#f1f5f9',
    padding: '1px 8px',
    borderRadius: '10px',
  },
  reminderMessage: { fontSize: '13px', color: '#334155', marginTop: '2px' },
  reminderMeta: {
    display: 'flex',
    gap: '12px',
    marginTop: '4px',
    fontSize: '11px',
    color: '#64748b',
    flexWrap: 'wrap',
  },
  reminderDate: { fontWeight: '500' },
  reminderDays: {
    padding: '2px 8px',
    borderRadius: '12px',
    background: '#e2e8f0',
    color: '#475569',
  },
  reminderType: {
    padding: '2px 8px',
    borderRadius: '12px',
    background: '#f1f5f9',
    color: '#64748b',
    textTransform: 'capitalize',
  },
  dismissBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    flexShrink: 0,
    marginTop: '2px',
  },
  loadMoreContainer: {
    textAlign: 'center',
    padding: '12px 0 8px 0',
  },
  loadMoreBtn: {
    padding: '8px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#2563eb',
    background: '#eff6ff',
    border: '1px solid #2563eb',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  spinning: { animation: 'spin 1s linear infinite' },
  footer: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e2e8f0',
    fontSize: '11px',
    color: '#94a3b8',
    textAlign: 'center',
  },
};

// Inject spin animation
const styleElement = document.createElement("style");
styleElement.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
`;
document.head.appendChild(styleElement);