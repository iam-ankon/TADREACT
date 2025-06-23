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
        setEmailLogs(response.data);
      } catch (error) {
        console.error('Error fetching email logs', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmailLogs();
  }, []);

  const handleDeleteAll = async () => {
    setDeleteLoading(true);
    try {
      await deleteAllEmailLogs();
      setEmailLogs([]);
      alert('All email logs have been deleted.');
    } catch (error) {
      console.error('Error deleting all email logs', error);
      alert('Error deleting all email logs.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex' }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Your page content here */}
        </div>
      </div>
      <div style={styles.content}>
        <div style={styles.headerContainer}>
          <h2 style={styles.heading}>Email Logs</h2>
          <button
            onClick={handleDeleteAll}
            style={styles.deleteAllBtn}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete All Emails'}
          </button>
        </div>

        {loading ? (
          <p style={styles.loading}>Loading email logs...</p>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Recipient</th>
                  <th style={styles.tableHeader}>Subject</th>
                  <th style={styles.tableHeader}>Sent At</th>
                </tr>
              </thead>
              <tbody>
                {emailLogs.length > 0 ? (
                  emailLogs.map((log) => (
                    <tr key={log.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>{log.recipient}</td>
                      <td style={styles.tableCell}>{log.subject}</td>
                      <td style={styles.tableCell}>{new Date(log.sent_at).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={styles.noLogs}>No email logs found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
  },
  sidebar: {
    width: '230px',
    backgroundColor: '#f3f6fb',
    height: '100vh',
    padding: '20px 15px',
    boxShadow: '2px 0 5px rgba(0, 0, 0, 0.05)',
  },
  sidebarHeader: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#0078d4',
  },
  sidebarLink: {
    display: 'block',
    padding: '10px',
    margin: '5px 0',
    textDecoration: 'none',
    color: '#333',
    borderRadius: '6px',
    transition: '0.3s',
  },
  content: {
    flex: 1,
    padding: '40px',
    backgroundColor: '#f9f9f9',
    display: 'flex',
    flexDirection: 'column',
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  heading: {
    fontSize: '2rem',
    color: '#0078d4',
  },
  deleteAllBtn: {
    backgroundColor: '#e53e3e',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '5px',
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  tableContainer: {
    backgroundColor: 'white',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    overflow: 'hidden',
    flex: 1,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    padding: '12px 15px',
    textAlign: 'left',
    fontWeight: '600',
    borderBottom: '1px solid #ddd',
  },
  tableRow: {
    '&:nth-child(even)': {
      backgroundColor: '#f8f8f8',
    },
  },
  tableCell: {
    padding: '12px 15px',
    textAlign: 'left',
    borderBottom: '1px solid #ddd',
  },
  noLogs: {
    textAlign: 'center',
    padding: '20px',
    color: '#999',
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
  },
};

export default EmailLog;