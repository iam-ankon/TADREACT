import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSuppliers } from '../../api/supplierApi'

const DashboardCSR = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    pendingAgreements: 0,
    expiredAgreements: 0,
    approvedSuppliers: 0,
    rejectedSuppliers: 0
  })

  const [recentSuppliers, setRecentSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quickStats, setQuickStats] = useState({
    totalInquiries: 0,
    confirmedInquiries: 0,
    pendingActions: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch suppliers data
      console.log('Fetching suppliers data...')
      const suppliersResponse = await getSuppliers()
      const suppliers = suppliersResponse.data || []
      
      console.log('Suppliers data received:', suppliers.length, 'items')
      
      // Calculate stats from suppliers data
      calculateStats(suppliers)
      
      // Get recent suppliers (last 5, sorted by ID or date)
      const recent = [...suppliers]
        .sort((a, b) => {
          // Sort by ID descending (newest first) or by created date
          if (b.id && a.id) return b.id - a.id
          return 0
        })
        .slice(0, 5)
        .map(supplier => ({
          id: supplier.id,
          name: supplier.name || supplier.company_name || 'Unnamed Supplier',
          vendor_id: supplier.vendor_id || supplier.vendor_code || 'N/A',
          email: supplier.email || supplier.contact_email || 'No email',
          agreement_status: supplier.agreement_status || supplier.status || 'pending',
          created_at: supplier.created_at || supplier.created_date || new Date().toISOString()
        }))
      
      setRecentSuppliers(recent)
      
      // Calculate quick stats
      calculateQuickStats(suppliers)
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError(`Failed to load dashboard data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (suppliers) => {
    try {
      const total = suppliers.length
      const active = suppliers.filter(s => 
        s.agreement_status === 'active' || 
        s.status === 'active'
      ).length
      
      const pending = suppliers.filter(s => 
        s.agreement_status === 'pending' || 
        s.status === 'pending'
      ).length
      
      const expired = suppliers.filter(s => 
        s.agreement_status === 'expired' || 
        s.status === 'expired'
      ).length
      
      const approved = suppliers.filter(s => 
        s.agreement_doc_status === 'approved' || 
        s.approval_status === 'approved'
      ).length
      
      const rejected = suppliers.filter(s => 
        s.agreement_doc_status === 'rejected' || 
        s.approval_status === 'rejected'
      ).length
      
      console.log('Calculated stats:', { total, active, pending, expired, approved, rejected })
      
      setStats({
        totalSuppliers: total,
        activeSuppliers: active,
        pendingAgreements: pending,
        expiredAgreements: expired,
        approvedSuppliers: approved,
        rejectedSuppliers: rejected
      })
    } catch (error) {
      console.error('Error calculating stats:', error)
    }
  }

  const calculateQuickStats = (suppliers) => {
    try {
      // These are sample calculations - adjust based on your actual data structure
      const totalInquiries = suppliers.reduce((sum, supplier) => 
        sum + (supplier.inquiry_count || supplier.total_inquiries || 0), 0
      )
      
      const confirmedInquiries = suppliers.reduce((sum, supplier) => 
        sum + (supplier.confirmed_inquiry_count || supplier.confirmed_inquiries || 0), 0
      )
      
      const pendingActions = suppliers.filter(s => 
        s.agreement_vendor_action_required || 
        s.action_required ||
        s.agreement_status === 'pending' ||
        s.status === 'pending'
      ).length
      
      setQuickStats({
        totalInquiries,
        confirmedInquiries,
        pendingActions
      })
    } catch (error) {
      console.error('Error calculating quick stats:', error)
    }
  }

  const getStatusColor = (status) => {
    if (!status) return { bg: '#f8f9fa', text: '#6c757d', border: '#e9ecef' }
    
    const statusLower = status.toLowerCase()
    switch(statusLower) {
      case 'active': 
      case 'approved': 
        return { bg: '#d4edda', text: '#155724', border: '#c3e6cb' }
      case 'pending': 
      case 'in_progress': 
        return { bg: '#fff3cd', text: '#856404', border: '#ffeaa7' }
      case 'expired': 
      case 'cancelled': 
      case 'terminated': 
        return { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' }
      case 'rejected': 
      case 'declined': 
        return { bg: '#f5c6cb', text: '#721c24', border: '#f1b0b7' }
      case 'draft': 
        return { bg: '#e2e3e5', text: '#383d41', border: '#d6d8db' }
      default: 
        return { bg: '#f8f9fa', text: '#6c757d', border: '#e9ecef' }
    }
  }

  const formatStatus = (status) => {
    if (!status) return 'UNKNOWN'
    return status.replace(/_/g, ' ').toUpperCase()
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading dashboard data...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Header with Title and Refresh Button */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Supplier Dashboard</h1>
          <p style={styles.subtitle}>Overview of all supplier activities and statistics</p>
        </div>
        <button 
          onClick={fetchDashboardData} 
          style={styles.refreshButton}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Data'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorAlert}>
          <span style={styles.errorIcon}>⚠️</span>
          <div style={styles.errorContent}>
            <p style={styles.errorText}>{error}</p>
            <p style={styles.errorHint}>Check if the suppliers API endpoint is accessible</p>
          </div>
          <button 
            onClick={fetchDashboardData} 
            style={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Main Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <span style={{...styles.statIcon, backgroundColor: '#3498db20', color: '#3498db'}}>🏢</span>
            <div>
              <h3 style={styles.statNumber}>{stats.totalSuppliers}</h3>
              <p style={styles.statLabel}>Total Suppliers</p>
            </div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <span style={{...styles.statIcon, backgroundColor: '#28a74520', color: '#28a745'}}>✅</span>
            <div>
              <h3 style={styles.statNumber}>{stats.activeSuppliers}</h3>
              <p style={styles.statLabel}>Active</p>
            </div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <span style={{...styles.statIcon, backgroundColor: '#ffc10720', color: '#ffc107'}}>⏳</span>
            <div>
              <h3 style={styles.statNumber}>{stats.pendingAgreements}</h3>
              <p style={styles.statLabel}>Pending</p>
            </div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <span style={{...styles.statIcon, backgroundColor: '#dc354520', color: '#dc3545'}}>📅</span>
            <div>
              <h3 style={styles.statNumber}>{stats.expiredAgreements}</h3>
              <p style={styles.statLabel}>Expired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row - Optional, show only if we have data */}
      {(quickStats.totalInquiries > 0 || quickStats.pendingActions > 0) && (
        <div style={styles.quickStatsGrid}>
          <div style={styles.quickStatCard}>
            <div style={styles.quickStatContent}>
              <span style={styles.quickStatIcon}>📋</span>
              <div>
                <h4 style={styles.quickStatNumber}>{quickStats.totalInquiries}</h4>
                <p style={styles.quickStatLabel}>Total Inquiries</p>
              </div>
            </div>
          </div>

          <div style={styles.quickStatCard}>
            <div style={styles.quickStatContent}>
              <span style={styles.quickStatIcon}>✅</span>
              <div>
                <h4 style={styles.quickStatNumber}>{quickStats.confirmedInquiries}</h4>
                <p style={styles.quickStatLabel}>Confirmed</p>
              </div>
            </div>
          </div>

          <div style={styles.quickStatCard}>
            <div style={styles.quickStatContent}>
              <span style={styles.quickStatIcon}>⏰</span>
              <div>
                <h4 style={styles.quickStatNumber}>{quickStats.pendingActions}</h4>
                <p style={styles.quickStatLabel}>Pending Actions</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions & Recent Suppliers Side by Side */}
      <div style={styles.mainContentGrid}>
        {/* Quick Actions */}
        <div style={styles.quickActions}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Quick Actions</h2>
          </div>
          <div style={styles.actionButtons}>
            <Link to="/add-supplierCSR" style={styles.actionButton}>
              <span style={styles.buttonIcon}>➕</span>
              <div style={styles.actionContent}>
                <span style={styles.actionTitle}>Add New Supplier</span>
                <span style={styles.actionDesc}>Register a new vendor</span>
              </div>
            </Link>
            
            <Link to="/suppliersCSR" style={styles.actionButton}>
              <span style={styles.buttonIcon}>📋</span>
              <div style={styles.actionContent}>
                <span style={styles.actionTitle}>View All Suppliers</span>
                <span style={styles.actionDesc}>Browse complete list</span>
              </div>
            </Link>
            
            <button 
              onClick={() => navigate('/suppliersCSR?status=pending')} 
              style={styles.actionButton}
            >
              <span style={styles.buttonIcon}>🔔</span>
              <div style={styles.actionContent}>
                <span style={styles.actionTitle}>Pending Reviews</span>
                <span style={styles.actionDesc}>{stats.pendingAgreements} pending</span>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/suppliersCSR?status=expired')} 
              style={styles.actionButton}
            >
              <span style={styles.buttonIcon}>📅</span>
              <div style={styles.actionContent}>
                <span style={styles.actionTitle}>Expired Agreements</span>
                <span style={styles.actionDesc}>{stats.expiredAgreements} need renewal</span>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Suppliers */}
        <div style={styles.recentSuppliers}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Recent Suppliers</h2>
            {recentSuppliers.length > 0 && (
              <Link to="/suppliersCSR" style={styles.viewAllLink}>
                View All →
              </Link>
            )}
          </div>
          
          {recentSuppliers.length > 0 ? (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.tableHeaderCell}>Vendor ID</th>
                    <th style={styles.tableHeaderCell}>Company</th>
                    <th style={styles.tableHeaderCell}>Status</th>
                    <th style={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSuppliers.map(supplier => {
                    const statusColors = getStatusColor(supplier.agreement_status)
                    return (
                      <tr key={supplier.id} style={styles.tableRow}>
                        <td style={styles.tableCell}>
                          <div style={styles.vendorIdCell}>
                            <span style={styles.vendorIdBadge}>{supplier.vendor_id}</span>
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.companyCell}>
                            <strong style={styles.companyName}>{supplier.name}</strong>
                            <span style={styles.companyEmail}>{supplier.email}</span>
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: statusColors.bg,
                            color: statusColors.text,
                            border: `1px solid ${statusColors.border}`
                          }}>
                            {formatStatus(supplier.agreement_status)}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.actionButtonsCell}>
                            <button 
                              onClick={() => navigate(`/edit-supplier/${supplier.id}`)}
                              style={styles.editButton}
                              title="Edit supplier"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => navigate(`/suppliersCSR/${supplier.id}`)}
                              style={styles.viewButton}
                              title="View details"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <span style={styles.emptyStateIcon}>📭</span>
              <p style={styles.emptyStateText}>No suppliers found in the system</p>
              <p style={styles.emptyStateSubtext}>Add your first supplier to get started</p>
              <Link to="/add-supplierCSR" style={styles.emptyStateButton}>
                Add Your First Supplier
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Status Summary - Only show if we have data */}
      {stats.totalSuppliers > 0 && (
        <div style={styles.statusSummary}>
          <h3 style={styles.summaryTitle}>Status Summary</h3>
          <div style={styles.statusGrid}>
            <div style={styles.statusItem}>
              <span style={{...styles.statusDot, backgroundColor: '#28a745'}}></span>
              <span style={styles.statusLabel}>Active</span>
              <span style={styles.statusCount}>{stats.activeSuppliers}</span>
              <span style={styles.statusPercent}>
                ({Math.round((stats.activeSuppliers / stats.totalSuppliers) * 100)}%)
              </span>
            </div>
            <div style={styles.statusItem}>
              <span style={{...styles.statusDot, backgroundColor: '#ffc107'}}></span>
              <span style={styles.statusLabel}>Pending</span>
              <span style={styles.statusCount}>{stats.pendingAgreements}</span>
              <span style={styles.statusPercent}>
                ({Math.round((stats.pendingAgreements / stats.totalSuppliers) * 100)}%)
              </span>
            </div>
            <div style={styles.statusItem}>
              <span style={{...styles.statusDot, backgroundColor: '#dc3545'}}></span>
              <span style={styles.statusLabel}>Expired</span>
              <span style={styles.statusCount}>{stats.expiredAgreements}</span>
              <span style={styles.statusPercent}>
                ({Math.round((stats.expiredAgreements / stats.totalSuppliers) * 100)}%)
              </span>
            </div>
            <div style={styles.statusItem}>
              <span style={{...styles.statusDot, backgroundColor: '#6c757d'}}></span>
              <span style={styles.statusLabel}>Others</span>
              <span style={styles.statusCount}>
                {stats.totalSuppliers - (stats.activeSuppliers + stats.pendingAgreements + stats.expiredAgreements)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    marginBottom: '0.5rem',
    color: '#1e293b',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#64748b',
    margin: 0,
  },
  refreshButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
  },
  refreshButtonHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)',
  },
  refreshButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    border: '1px solid #fecaca',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  errorIcon: {
    fontSize: '1.25rem',
  },
  errorContent: {
    flex: 1,
  },
  errorText: {
    margin: '0 0 0.25rem 0',
    fontWeight: '500',
  },
  errorHint: {
    margin: 0,
    fontSize: '0.875rem',
    opacity: 0.8,
  },
  retryButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s ease',
  },
  statCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  statCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  statIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.75rem',
    flexShrink: 0,
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#1e293b',
    margin: '0 0 0.25rem 0',
    lineHeight: 1,
  },
  statLabel: {
    color: '#64748b',
    fontSize: '0.875rem',
    fontWeight: '500',
    margin: 0,
  },
  quickStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  quickStatCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1rem',
    border: '1px solid #e2e8f0',
  },
  quickStatContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  quickStatIcon: {
    fontSize: '1.5rem',
    color: '#3b82f6',
  },
  quickStatNumber: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 0.125rem 0',
  },
  quickStatLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    margin: 0,
  },
  mainContentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '2rem',
    marginBottom: '2rem',
  },
  '@media (max-width: 1024px)': {
    mainContentGrid: {
      gridTemplateColumns: '1fr',
    },
  },
  quickActions: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  viewAllLink: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    color: '#334155',
    textDecoration: 'none',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    width: '100%',
  },
  actionButtonHover: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  buttonIcon: {
    fontSize: '1.25rem',
    width: '24px',
    textAlign: 'center',
  },
  actionContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  actionTitle: {
    fontWeight: '600',
    fontSize: '0.875rem',
  },
  actionDesc: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  recentSuppliers: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
  },
  tableContainer: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '600px',
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
  },
  tableHeaderCell: {
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '600',
    color: '#475569',
    fontSize: '0.875rem',
    borderBottom: '2px solid #e2e8f0',
  },
  tableRow: {
    borderBottom: '1px solid #e2e8f0',
    transition: 'background-color 0.2s ease',
  },
  tableRowHover: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    padding: '1rem',
    textAlign: 'left',
    color: '#334155',
    verticalAlign: 'middle',
  },
  vendorIdCell: {
    display: 'flex',
    alignItems: 'center',
  },
  vendorIdBadge: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  companyCell: {
    display: 'flex',
    flexDirection: 'column',
  },
  companyName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '0.25rem',
  },
  companyEmail: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    display: 'inline-block',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  actionButtonsCell: {
    display: 'flex',
    gap: '0.5rem',
  },
  editButton: {
    padding: '0.375rem 0.75rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  viewButton: {
    padding: '0.375rem 0.75rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem 1rem',
  },
  emptyStateIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
    opacity: 0.3,
    display: 'block',
  },
  emptyStateText: {
    color: '#1e293b',
    marginBottom: '0.5rem',
    fontWeight: '600',
  },
  emptyStateSubtext: {
    color: '#64748b',
    fontSize: '0.875rem',
    marginBottom: '1.5rem',
  },
  emptyStateButton: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: '500',
    fontSize: '0.875rem',
  },
  statusSummary: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
  },
  summaryTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '1.5rem',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  statusLabel: {
    flex: 1,
    fontSize: '0.875rem',
    color: '#475569',
    fontWeight: '500',
  },
  statusCount: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#1e293b',
    marginRight: '0.5rem',
  },
  statusPercent: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontStyle: 'italic',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '1rem',
    color: '#64748b',
    fontSize: '0.875rem',
  },
}

// Add CSS animation for spinner
const spinnerStyle = document.createElement('style')
spinnerStyle.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`
document.head.appendChild(spinnerStyle)

export default DashboardCSR