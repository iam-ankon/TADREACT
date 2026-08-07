import React, { useEffect, useState } from 'react';
import { getEmailLogs, deleteAllEmailLogs } from '../../api/employeeApi';
import Sidebars from './sidebars';

const EmailLog = () => {
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchEmailLogs = async () => {
      setLoading(true);
      try {
        const response = await getEmailLogs();
        setEmailLogs(response.data || []);
      } catch (error) {
        console.error('Error fetching email logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmailLogs();
  }, []);

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL email logs?')) return;

    setDeleteLoading(true);
    try {
      await deleteAllEmailLogs();
      setEmailLogs([]);
      alert('All email logs have been deleted.');
    } catch (error) {
      console.error('Error deleting email logs:', error);
      alert('Failed to delete email logs.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <Sidebars />

      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h1 style={styles.title}>Email Logs</h1>

          <button
            onClick={handleDeleteAll}
            disabled={deleteLoading || emailLogs.length === 0}
            style={{
              ...styles.dangerButton,
              opacity: deleteLoading || emailLogs.length === 0 ? 0.6 : 1,
              cursor:
                deleteLoading || emailLogs.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {deleteLoading ? 'Deleting...' : 'Delete All'}
          </button>
        </div>

        <div style={styles.tableWrapper}>
          {loading ? (
            <div style={styles.loadingWrapper}>
              <p style={styles.loadingText}>Loading email logs...</p>
            </div>
          ) : emailLogs.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>No email logs found</p>
            </div>
          ) : (
            <div style={styles.tableScrollContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Recipient</th>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map((log) => (
                    <tr key={log.id} style={styles.tr}>
                      <td style={styles.td}>{log.recipient}</td>
                      <td style={styles.td}>{log.subject}</td>
                      <td style={styles.td}>
                        {new Date(log.sent_at).toLocaleString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },

  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '32px 40px',
    overflow: 'hidden',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '16px',
  },

  title: {
    margin: 0,
    fontSize: '2.1rem',
    fontWeight: 600,
    color: '#1a365d',
  },

  dangerButton: {
    backgroundColor: '#e53e3e',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },

  tableWrapper: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },

  tableScrollContainer: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 180px)', // adjust based on your header + padding
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'auto',
  },

  th: {
    backgroundColor: '#edf2f7',
    color: '#4a5568',
    fontWeight: 600,
    textAlign: 'left',
    padding: '14px 20px',
    fontSize: '0.95rem',
    borderBottom: '2px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    background: '#edf2f7',
  },

  tr: {
    transition: 'background-color 0.15s ease',
  },

  td: {
    padding: '14px 20px',
    borderBottom: '1px solid #edf2f7',
    color: '#2d3748',
    fontSize: '0.95rem',
    lineHeight: 1.5,
  },

  // Hover effect on rows
  trHover: {
    '&:hover': {
      backgroundColor: '#f7fafc',
    },
  },

  loadingWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#718096',
    fontSize: '1.1rem',
  },

  emptyState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: {
    color: '#a0aec0',
    fontSize: '1.15rem',
    fontWeight: 500,
  },
};

// Tip: Add this to your global CSS or inside a <style> tag if you want hover to work with inline styles
// Or better → move most styles to proper CSS modules / styled-components / tailwind
const globalHoverFix = `
  tr:hover {
    background-color: #f7fafc !important;
  }
`;

export default EmailLog;