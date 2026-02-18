import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSuppliers, getSupplierStats } from '../../api/supplierApi'

const SupplierDashboardCSR = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    compliantSuppliers: 0,
    nonCompliantSuppliers: 0,
    underReview: 0,
    conditional: 0,
    certifiedSuppliers: 0,
    validLicenseSuppliers: 0,
    activeGrievanceSuppliers: 0
  })

  const [recentSuppliers, setRecentSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expirySummary, setExpirySummary] = useState({
    bsci: { count: 0, suppliers: [] },
    oekoTex: { count: 0, suppliers: [] },
    gots: { count: 0, suppliers: [] },
    fireLicense: { count: 0, suppliers: [] },
    total_expiring: 0
  })
  const [sendingReminders, setSendingReminders] = useState(false)
  const [reminderResult, setReminderResult] = useState(null)
  const [complianceOverview, setComplianceOverview] = useState({
    fireSafety: { total: 0, compliant: 0 },
    environmental: { total: 0, compliant: 0 },
    labor: { total: 0, compliant: 0 },
    structural: { total: 0, compliant: 0 }
  })
  const [certificationStats, setCertificationStats] = useState({
    bsci: 0,
    sedex: 0,
    wrap: 0,
    iso: 0
  })

  useEffect(() => {
    fetchDashboardData()
    fetchExpirySummary()
    
    // Auto-refresh every 30 minutes
    const interval = setInterval(() => {
      fetchDashboardData()
      fetchExpirySummary()
    }, 1800000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching supplier dashboard data...')
      
      // Fetch all suppliers
      const suppliersResponse = await getSuppliers()
      const suppliers = suppliersResponse.data || []
      
      console.log('Suppliers data received:', suppliers.length, 'items')
      
      // Calculate comprehensive stats from suppliers data
      calculateComprehensiveStats(suppliers)
      
      // Get recent suppliers (last 5, sorted by ID or date)
      const recent = [...suppliers]
        .sort((a, b) => {
          // Sort by ID descending (newest first)
          if (b.id && a.id) return b.id - a.id
          return 0
        })
        .slice(0, 5)
        .map(supplier => ({
          id: supplier.id,
          name: supplier.supplier_name || 'Unnamed Supplier',
          supplier_id: supplier.supplier_id || 'N/A',
          compliance_status: supplier.compliance_status || 'under_review',
          certification_status: supplier.is_certification_valid || false,
          location: supplier.location || 'Location not specified',
          category: supplier.supplier_category || 'Not specified',
          // Add days remaining for quick view
          bsci_days: supplier.bsci_validity_days_remaining,
          oekoTex_days: supplier.oeko_tex_validity_days_remaining,
          gots_days: supplier.gots_validity_days_remaining,
          fireLicense_days: supplier.fire_license_days_remaining
        }))
      
      setRecentSuppliers(recent)
      
      // Calculate compliance overview
      calculateComplianceOverview(suppliers)
      
      // Calculate certification stats
      calculateCertificationStats(suppliers)
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError(`Failed to load dashboard data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchExpirySummary = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://119.148.51.38:8000/api/merchandiser/api/supplier/dashboard_expiry_summary/', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setExpirySummary(data.data)
      }
    } catch (error) {
      console.error('Error fetching expiry summary:', error)
    }
  }

  const sendBulkReminders = async () => {
    setSendingReminders(true)
    setReminderResult(null)
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://119.148.51.38:8000/api/merchandiser/api/supplier/send_bulk_reminders/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from_email: 'niloy@texweave.net' }),
        credentials: 'include',
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setReminderResult({
          success: true,
          message: `✅ ${result.message}`,
          details: result.notifications
        })
        // Refresh expiry summary after sending
        fetchExpirySummary()
      } else {
        setReminderResult({
          success: false,
          message: `❌ Failed to send reminders: ${result.error || 'Unknown error'}`
        })
      }
    } catch (error) {
      setReminderResult({
        success: false,
        message: `❌ Error: ${error.message}`
      })
    } finally {
      setSendingReminders(false)
      // Auto-hide result after 5 seconds
      setTimeout(() => setReminderResult(null), 5000)
    }
  }

  const calculateComprehensiveStats = (suppliers) => {
    try {
      const total = suppliers.length
      const compliant = suppliers.filter(s => 
        s.compliance_status === 'compliant'
      ).length
      
      const nonCompliant = suppliers.filter(s => 
        s.compliance_status === 'non_compliant'
      ).length
      
      const underReview = suppliers.filter(s => 
        s.compliance_status === 'under_review' || !s.compliance_status
      ).length
      
      const conditional = suppliers.filter(s => 
        s.compliance_status === 'conditional'
      ).length
      
      const certified = suppliers.filter(s => 
        s.is_certification_valid === true
      ).length
      
      const validLicense = suppliers.filter(s => {
        // Check if all essential licenses are valid (days remaining > 0)
        return (
          (s.trade_license_days_remaining && s.trade_license_days_remaining > 0) &&
          (s.factory_license_days_remaining && s.factory_license_days_remaining > 0) &&
          (s.fire_license_days_remaining && s.fire_license_days_remaining > 0)
        )
      }).length
      
      const activeGrievance = suppliers.filter(s => 
        s.grievance_mechanism === true
      ).length
      
      console.log('Calculated comprehensive stats:', {
        total, compliant, nonCompliant, underReview, conditional,
        certified, validLicense, activeGrievance
      })
      
      setStats({
        totalSuppliers: total,
        compliantSuppliers: compliant,
        nonCompliantSuppliers: nonCompliant,
        underReview: underReview,
        conditional: conditional,
        certifiedSuppliers: certified,
        validLicenseSuppliers: validLicense,
        activeGrievanceSuppliers: activeGrievance
      })
    } catch (error) {
      console.error('Error calculating comprehensive stats:', error)
    }
  }

  const calculateComplianceOverview = (suppliers) => {
    try {
      const total = suppliers.length
      
      // Fire Safety compliance
      const fireSafetyCompliant = suppliers.filter(s => {
        const hasTraining = s.last_fire_training_by_fscd && new Date(s.last_fire_training_by_fscd) > new Date(Date.now() - 365*24*60*60*1000) // Within 1 year
        const hasDrill = s.last_fire_drill_record_by_fscd && new Date(s.last_fire_drill_record_by_fscd) > new Date(Date.now() - 90*24*60*60*1000) // Within 90 days
        const hasPersonnel = s.total_fire_fighter_rescue_first_aider_fscd && s.total_fire_fighter_rescue_first_aider_fscd > 0
        return hasTraining && hasDrill && hasPersonnel
      }).length
      
      // Environmental compliance
      const environmentalCompliant = suppliers.filter(s => {
        const hasWaterTest = s.water_test_report_doe && new Date(s.water_test_report_doe) > new Date(Date.now() - 365*24*60*60*1000)
        const hasChemicalInventory = s.behive_chemical_inventory === true
        return hasWaterTest && hasChemicalInventory
      }).length
      
      // Labor compliance
      const laborCompliant = suppliers.filter(s => {
        const paysMinWage = s.minimum_wages_paid === true
        const hasBenefits = s.earn_leave_status === true && s.festival_bonus === true
        return paysMinWage && hasBenefits
      }).length
      
      // Structural compliance (from RSC)
      const structuralCompliant = suppliers.filter(s => {
        const hasProgressRate = s.progress_rate && s.progress_rate >= 80 // 80% progress rate
        const lowFindings = s.structural_total_findings && s.structural_total_findings <= 5 // 5 or fewer findings
        return hasProgressRate && lowFindings
      }).length
      
      setComplianceOverview({
        fireSafety: { total, compliant: fireSafetyCompliant },
        environmental: { total, compliant: environmentalCompliant },
        labor: { total, compliant: laborCompliant },
        structural: { total, compliant: structuralCompliant }
      })
    } catch (error) {
      console.error('Error calculating compliance overview:', error)
    }
  }

  const calculateCertificationStats = (suppliers) => {
    try {
      const bsciCount = suppliers.filter(s => 
        s.bsci_status === 'valid' || s.bsci_status === 'Valid'
      ).length
      
      const sedexCount = suppliers.filter(s => 
        s.sedex_status === 'valid' || s.sedex_status === 'Valid'
      ).length
      
      const wrapCount = suppliers.filter(s => 
        s.wrap_status === 'valid' || s.wrap_status === 'Valid'
      ).length
      
      const isoCount = suppliers.filter(s => 
        (s.iso_9001_status === 'valid' || s.iso_9001_status === 'Valid') ||
        (s.iso_14001_status === 'valid' || s.iso_14001_status === 'Valid')
      ).length
      
      setCertificationStats({
        bsci: bsciCount,
        sedex: sedexCount,
        wrap: wrapCount,
        iso: isoCount
      })
    } catch (error) {
      console.error('Error calculating certification stats:', error)
    }
  }

  const getStatusColor = (status) => {
    if (!status) return { bg: '#f8f9fa', text: '#6c757d', border: '#e9ecef' }
    
    const statusLower = status.toLowerCase()
    switch(statusLower) {
      case 'compliant': 
        return { bg: '#d4edda', text: '#155724', border: '#c3e6cb' }
      case 'under_review': 
        return { bg: '#fff3cd', text: '#856404', border: '#ffeaa7' }
      case 'non_compliant': 
        return { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' }
      case 'conditional':
        return { bg: '#cfe2ff', text: '#084298', border: '#b6d4fe' }
      default: 
        return { bg: '#f8f9fa', text: '#6c757d', border: '#e9ecef' }
    }
  }

  const getDaysRemainingColor = (days) => {
    if (!days && days !== 0) return { bg: '#6c757d', color: 'white' }
    if (days <= 30) return { bg: '#dc3545', color: 'white' }
    if (days <= 60) return { bg: '#ffc107', color: 'black' }
    if (days <= 90) return { bg: '#28a745', color: 'white' }
    return { bg: '#28a745', color: 'white' }
  }

  const formatStatus = (status) => {
    if (!status) return 'UNDER REVIEW'
    return status.replace(/_/g, ' ').toUpperCase()
  }

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  const calculateComplianceRate = () => {
    if (stats.totalSuppliers === 0) return 0
    return Math.round((stats.compliantSuppliers / stats.totalSuppliers) * 100)
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading supplier dashboard...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Header with Title and Actions */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Supplier Compliance Dashboard</h1>
          <p style={styles.subtitle}>Comprehensive overview of supplier compliance and certification status</p>
        </div>
        <div style={styles.headerActions}>
          <button 
            onClick={fetchDashboardData} 
            style={styles.refreshButton}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
          <Link to="/add-supplierCSR" style={styles.addButton}>
            ➕ Add New Supplier
          </Link>
        </div>
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

      {/* Reminder Result Message */}
      {reminderResult && (
        <div style={reminderResult.success ? styles.successAlert : styles.errorAlert}>
          <span style={styles.alertIcon}>{reminderResult.success ? '✅' : '❌'}</span>
          <div style={styles.alertContent}>
            <p style={styles.alertText}>{reminderResult.message}</p>
            {reminderResult.details && (
              <div style={styles.alertDetails}>
                Sent to {reminderResult.details.length} suppliers
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expiring Certifications Alert */}
      {expirySummary.total_expiring > 0 && (
        <div style={styles.expiryAlert}>
          <div style={styles.expiryAlertHeader}>
            <span style={styles.expiryAlertIcon}>🔔</span>
            <h3 style={styles.expiryAlertTitle}>
              {expirySummary.total_expiring} Certification(s) Need Attention
            </h3>
          </div>
          <div style={styles.expiryAlertGrid}>
            {expirySummary.bsci.count > 0 && (
              <div style={styles.expiryAlertItem}>
                <span style={styles.expiryAlertLabel}>BSCI:</span>
                <span style={{
                  ...styles.expiryAlertCount,
                  backgroundColor: '#28a745'
                }}>{expirySummary.bsci.count}</span>
              </div>
            )}
            {expirySummary.oekoTex.count > 0 && (
              <div style={styles.expiryAlertItem}>
                <span style={styles.expiryAlertLabel}>Oeko-Tex:</span>
                <span style={{
                  ...styles.expiryAlertCount,
                  backgroundColor: '#28a745'
                }}>{expirySummary.oekoTex.count}</span>
              </div>
            )}
            {expirySummary.gots.count > 0 && (
              <div style={styles.expiryAlertItem}>
                <span style={styles.expiryAlertLabel}>GOTS:</span>
                <span style={{
                  ...styles.expiryAlertCount,
                  backgroundColor: '#28a745'
                }}>{expirySummary.gots.count}</span>
              </div>
            )}
            {expirySummary.fireLicense.count > 0 && (
              <div style={styles.expiryAlertItem}>
                <span style={styles.expiryAlertLabel}>Fire License:</span>
                <span style={{
                  ...styles.expiryAlertCount,
                  backgroundColor: '#28a745'
                }}>{expirySummary.fireLicense.count}</span>
              </div>
            )}
          </div>
          <div style={styles.expiryAlertActions}>
            <button 
              onClick={sendBulkReminders}
              disabled={sendingReminders}
              style={styles.expiryAlertButton}
            >
              {sendingReminders ? 'Sending...' : '📧 Send All Reminders'}
            </button>
            <Link to="/suppliersCSR?filter=expiring" style={styles.expiryAlertLink}>
              View All Expiring →
            </Link>
          </div>
        </div>
      )}

      {/* Overall Compliance Score */}
      <div style={styles.complianceScoreCard}>
        <div style={styles.scoreHeader}>
          <h3 style={styles.scoreTitle}>Overall Compliance Score</h3>
          <span style={styles.scoreUpdated}>Updated just now</span>
        </div>
        <div style={styles.scoreContent}>
          <div style={styles.scoreCircle}>
            <div style={styles.scoreValue}>{calculateComplianceRate()}%</div>
            <div style={styles.scoreLabel}>Compliance Rate</div>
          </div>
          <div style={styles.scoreBreakdown}>
            <div style={styles.breakdownItem}>
              <span style={{...styles.breakdownDot, backgroundColor: '#28a745'}}></span>
              <span style={styles.breakdownLabel}>Compliant</span>
              <span style={styles.breakdownValue}>{stats.compliantSuppliers}</span>
            </div>
            <div style={styles.breakdownItem}>
              <span style={{...styles.breakdownDot, backgroundColor: '#ffc107'}}></span>
              <span style={styles.breakdownLabel}>Under Review</span>
              <span style={styles.breakdownValue}>{stats.underReview}</span>
            </div>
            <div style={styles.breakdownItem}>
              <span style={{...styles.breakdownDot, backgroundColor: '#dc3545'}}></span>
              <span style={styles.breakdownLabel}>Non-Compliant</span>
              <span style={styles.breakdownValue}>{stats.nonCompliantSuppliers}</span>
            </div>
            <div style={styles.breakdownItem}>
              <span style={{...styles.breakdownDot, backgroundColor: '#3b82f6'}}></span>
              <span style={styles.breakdownLabel}>Conditional</span>
              <span style={styles.breakdownValue}>{stats.conditional}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <span style={{...styles.metricIcon, backgroundColor: '#3498db20', color: '#3498db'}}>🏢</span>
            <div>
              <h3 style={styles.metricNumber}>{formatNumber(stats.totalSuppliers)}</h3>
              <p style={styles.metricLabel}>Total Suppliers</p>
            </div>
          </div>
          <div style={styles.metricTrend}>
            <span style={styles.trendText}>All registered factories</span>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <span style={{...styles.metricIcon, backgroundColor: '#28a74520', color: '#28a745'}}>✅</span>
            <div>
              <h3 style={styles.metricNumber}>{formatNumber(stats.certifiedSuppliers)}</h3>
              <p style={styles.metricLabel}>Certified Suppliers</p>
            </div>
          </div>
          <div style={styles.metricTrend}>
            <span style={styles.trendText}>Valid certifications</span>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <span style={{...styles.metricIcon, backgroundColor: '#10b98120', color: '#10b981'}}>📋</span>
            <div>
              <h3 style={styles.metricNumber}>{formatNumber(stats.validLicenseSuppliers)}</h3>
              <p style={styles.metricLabel}>Valid Licenses</p>
            </div>
          </div>
          <div style={styles.metricTrend}>
            <span style={styles.trendText}>All licenses current</span>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <span style={{...styles.metricIcon, backgroundColor: '#8b5cf620', color: '#8b5cf6'}}>🛡️</span>
            <div>
              <h3 style={styles.metricNumber}>{formatNumber(stats.activeGrievanceSuppliers)}</h3>
              <p style={styles.metricLabel}>Grievance Systems</p>
            </div>
          </div>
          <div style={styles.metricTrend}>
            <span style={styles.trendText}>Active mechanism</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={styles.mainContentGrid}>
        {/* Left Column: Compliance Areas */}
        <div style={styles.leftColumn}>
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Compliance Areas</h3>
            </div>
            <div style={styles.complianceAreas}>
              <div style={styles.complianceArea}>
                <div style={styles.areaHeader}>
                  <span style={{...styles.areaIcon, backgroundColor: '#dc262620', color: '#dc2626'}}>🔥</span>
                  <div>
                    <h4 style={styles.areaTitle}>Fire Safety</h4>
                    <p style={styles.areaSubtitle}>Training, drills & equipment</p>
                  </div>
                </div>
                <div style={styles.areaProgress}>
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressFill,
                      width: `${(complianceOverview.fireSafety.compliant / complianceOverview.fireSafety.total) * 100 || 0}%`,
                      backgroundColor: '#dc2626'
                    }}></div>
                  </div>
                  <span style={styles.progressText}>
                    {complianceOverview.fireSafety.compliant}/{complianceOverview.fireSafety.total} compliant
                  </span>
                </div>
              </div>

              <div style={styles.complianceArea}>
                <div style={styles.areaHeader}>
                  <span style={{...styles.areaIcon, backgroundColor: '#10b98120', color: '#10b981'}}>🌱</span>
                  <div>
                    <h4 style={styles.areaTitle}>Environmental</h4>
                    <p style={styles.areaSubtitle}>Water tests & chemicals</p>
                  </div>
                </div>
                <div style={styles.areaProgress}>
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressFill,
                      width: `${(complianceOverview.environmental.compliant / complianceOverview.environmental.total) * 100 || 0}%`,
                      backgroundColor: '#10b981'
                    }}></div>
                  </div>
                  <span style={styles.progressText}>
                    {complianceOverview.environmental.compliant}/{complianceOverview.environmental.total} compliant
                  </span>
                </div>
              </div>

              <div style={styles.complianceArea}>
                <div style={styles.areaHeader}>
                  <span style={{...styles.areaIcon, backgroundColor: '#f59e0b20', color: '#f59e0b'}}>👷</span>
                  <div>
                    <h4 style={styles.areaTitle}>Labor Standards</h4>
                    <p style={styles.areaSubtitle}>Wages & benefits</p>
                  </div>
                </div>
                <div style={styles.areaProgress}>
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressFill,
                      width: `${(complianceOverview.labor.compliant / complianceOverview.labor.total) * 100 || 0}%`,
                      backgroundColor: '#f59e0b'
                    }}></div>
                  </div>
                  <span style={styles.progressText}>
                    {complianceOverview.labor.compliant}/{complianceOverview.labor.total} compliant
                  </span>
                </div>
              </div>

              <div style={styles.complianceArea}>
                <div style={styles.areaHeader}>
                  <span style={{...styles.areaIcon, backgroundColor: '#3b82f620', color: '#3b82f6'}}>🏗️</span>
                  <div>
                    <h4 style={styles.areaTitle}>Structural Safety</h4>
                    <p style={styles.areaSubtitle}>RSC audit results</p>
                  </div>
                </div>
                <div style={styles.areaProgress}>
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressFill,
                      width: `${(complianceOverview.structural.compliant / complianceOverview.structural.total) * 100 || 0}%`,
                      backgroundColor: '#3b82f6'
                    }}></div>
                  </div>
                  <span style={styles.progressText}>
                    {complianceOverview.structural.compliant}/{complianceOverview.structural.total} compliant
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Certification Distribution */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Certification Distribution</h3>
            </div>
            <div style={styles.certificationGrid}>
              <div style={styles.certificationItem}>
                <span style={styles.certificationBadge}>BSCI</span>
                <div style={styles.certificationCount}>
                  <span style={styles.certificationNumber}>{certificationStats.bsci}</span>
                  <span style={styles.certificationLabel}>Suppliers</span>
                </div>
              </div>
              <div style={styles.certificationItem}>
                <span style={styles.certificationBadge}>SEDEX</span>
                <div style={styles.certificationCount}>
                  <span style={styles.certificationNumber}>{certificationStats.sedex}</span>
                  <span style={styles.certificationLabel}>Suppliers</span>
                </div>
              </div>
              <div style={styles.certificationItem}>
                <span style={styles.certificationBadge}>WRAP</span>
                <div style={styles.certificationCount}>
                  <span style={styles.certificationNumber}>{certificationStats.wrap}</span>
                  <span style={styles.certificationLabel}>Suppliers</span>
                </div>
              </div>
              <div style={styles.certificationItem}>
                <span style={styles.certificationBadge}>ISO</span>
                <div style={styles.certificationCount}>
                  <span style={styles.certificationNumber}>{certificationStats.iso}</span>
                  <span style={styles.certificationLabel}>Suppliers</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Suppliers & Quick Actions */}
        <div style={styles.rightColumn}>
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Recent Suppliers</h3>
              {recentSuppliers.length > 0 && (
                <Link to="/suppliersCSR" style={styles.viewAllLink}>
                  View All →
                </Link>
              )}
            </div>
            
            {recentSuppliers.length > 0 ? (
              <div style={styles.suppliersList}>
                {recentSuppliers.map(supplier => {
                  const statusColors = getStatusColor(supplier.compliance_status)
                  return (
                    <div key={supplier.id} style={styles.supplierItem}>
                      <div style={styles.supplierAvatar}>
                        {supplier.name?.charAt(0) || 'S'}
                      </div>
                      <div style={styles.supplierInfo}>
                        <div style={styles.supplierMain}>
                          <strong style={styles.supplierName}>{supplier.name}</strong>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: statusColors.bg,
                            color: statusColors.text,
                            border: `1px solid ${statusColors.border}`
                          }}>
                            {formatStatus(supplier.compliance_status)}
                          </span>
                        </div>
                        <div style={styles.supplierDetails}>
                          <span style={styles.supplierId}>ID: {supplier.supplier_id}</span>
                          <span style={styles.supplierCategory}>{supplier.category}</span>
                          <span style={styles.supplierLocation}>{supplier.location}</span>
                        </div>
                        
                        {/* Days Remaining Indicators */}
                        <div style={styles.supplierDays}>
                          {supplier.bsci_days && (
                            <span style={{
                              ...styles.dayBadge,
                              backgroundColor: getDaysRemainingColor(supplier.bsci_days).bg,
                              color: getDaysRemainingColor(supplier.bsci_days).color
                            }}>
                              BSCI: {supplier.bsci_days}d
                            </span>
                          )}
                          {supplier.oekoTex_days && (
                            <span style={{
                              ...styles.dayBadge,
                              backgroundColor: getDaysRemainingColor(supplier.oekoTex_days).bg,
                              color: getDaysRemainingColor(supplier.oekoTex_days).color
                            }}>
                              OEKO: {supplier.oekoTex_days}d
                            </span>
                          )}
                          {supplier.gots_days && (
                            <span style={{
                              ...styles.dayBadge,
                              backgroundColor: getDaysRemainingColor(supplier.gots_days).bg,
                              color: getDaysRemainingColor(supplier.gots_days).color
                            }}>
                              GOTS: {supplier.gots_days}d
                            </span>
                          )}
                          {supplier.fireLicense_days && (
                            <span style={{
                              ...styles.dayBadge,
                              backgroundColor: getDaysRemainingColor(supplier.fireLicense_days).bg,
                              color: getDaysRemainingColor(supplier.fireLicense_days).color
                            }}>
                              FIRE: {supplier.fireLicense_days}d
                            </span>
                          )}
                        </div>

                        <div style={styles.supplierActions}>
                          <button 
                            onClick={() => navigate(`/suppliersCSR/${supplier.id}`)}
                            style={styles.viewButton}
                          >
                            View Details
                          </button>
                          {supplier.certification_status && (
                            <span style={styles.certifiedBadge}>✅ Certified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <span style={styles.emptyStateIcon}>🏭</span>
                <p style={styles.emptyStateText}>No suppliers found</p>
                <p style={styles.emptyStateSubtext}>Add your first supplier to get started</p>
                <Link to="/add-supplierCSR" style={styles.emptyStateButton}>
                  Add First Supplier
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Quick Actions</h3>
            </div>
            <div style={styles.quickActions}>
              <button 
                onClick={() => navigate('/suppliersCSR?status=non_compliant')}
                style={styles.quickActionButton}
              >
                <span style={styles.actionIcon}>🚨</span>
                <div style={styles.actionContent}>
                  <span style={styles.actionTitle}>Non-Compliant</span>
                  <span style={styles.actionDesc}>{stats.nonCompliantSuppliers} need attention</span>
                </div>
              </button>
              
              <button 
                onClick={() => navigate('/suppliersCSR?status=under_review')}
                style={styles.quickActionButton}
              >
                <span style={styles.actionIcon}>⏳</span>
                <div style={styles.actionContent}>
                  <span style={styles.actionTitle}>Under Review</span>
                  <span style={styles.actionDesc}>{stats.underReview} pending review</span>
                </div>
              </button>
              
              <button 
                onClick={() => navigate('/suppliersCSR?filter=expiring')}
                style={{
                  ...styles.quickActionButton,
                  ...(expirySummary.total_expiring > 0 ? styles.quickActionButtonActive : {})
                }}
              >
                <span style={styles.actionIcon}>🔔</span>
                <div style={styles.actionContent}>
                  <span style={styles.actionTitle}>Expiring Certifications</span>
                  <span style={styles.actionDesc}>
                    {expirySummary.total_expiring > 0 
                      ? `${expirySummary.total_expiring} need attention` 
                      : 'Check certifications'}
                  </span>
                </div>
                {expirySummary.total_expiring > 0 && (
                  <span style={styles.actionBadge}>{expirySummary.total_expiring}</span>
                )}
              </button>
              
              <button 
                onClick={() => navigate('/suppliersCSR?license=expired')}
                style={styles.quickActionButton}
              >
                <span style={styles.actionIcon}>📋</span>
                <div style={styles.actionContent}>
                  <span style={styles.actionTitle}>License Renewals</span>
                  <span style={styles.actionDesc}>Verify licenses</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Footer */}
      <div style={styles.statsFooter}>
        <div style={styles.statItem}>
          <span style={styles.statIcon}>🏭</span>
          <div>
            <h4 style={styles.statNumber}>{stats.totalSuppliers}</h4>
            <p style={styles.statLabel}>Total Factories</p>
          </div>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statIcon}>✅</span>
          <div>
            <h4 style={styles.statNumber}>{stats.compliantSuppliers}</h4>
            <p style={styles.statLabel}>Fully Compliant</p>
          </div>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statIcon}>📊</span>
          <div>
            <h4 style={styles.statNumber}>{calculateComplianceRate()}%</h4>
            <p style={styles.statLabel}>Compliance Rate</p>
          </div>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statIcon}>🔄</span>
          <div>
            <h4 style={styles.statNumber}>{stats.underReview + stats.conditional}</h4>
            <p style={styles.statLabel}>In Progress</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '3rem 5rem',
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
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    marginBottom: '0.5rem',
    color: '#1e293b',
    background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
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
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
  },
  addButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
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
  successAlert: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    border: '1px solid #c3e6cb',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  alertIcon: {
    fontSize: '1.25rem',
  },
  alertContent: {
    flex: 1,
  },
  alertText: {
    margin: 0,
    fontWeight: '500',
  },
  alertDetails: {
    margin: '0.25rem 0 0 0',
    fontSize: '0.875rem',
    opacity: 0.8,
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

  // Expiry Alert Styles
  expiryAlert: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '2rem',
  },
  expiryAlertHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  expiryAlertIcon: {
    fontSize: '1.5rem',
  },
  expiryAlertTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#856404',
    margin: 0,
  },
  expiryAlertGrid: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1.5rem',
  },
  expiryAlertItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
  },
  expiryAlertLabel: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#495057',
  },
  expiryAlertCount: {
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'white',
  },
  expiryAlertActions: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  expiryAlertButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#fd7e14',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#e06b00',
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  expiryAlertLink: {
    color: '#fd7e14',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
  },

  complianceScoreCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0',
  },
  scoreHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  scoreTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  scoreUpdated: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    backgroundColor: '#f1f5f9',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
  },
  scoreContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '4rem',
  },
  scoreCircle: {
    textAlign: 'center',
    minWidth: '120px',
  },
  scoreValue: {
    fontSize: '3rem',
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: '0.5rem',
  },
  scoreLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '500',
  },
  scoreBreakdown: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem',
  },
  breakdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  breakdownDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: '0.875rem',
    color: '#475569',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0',
    transition: 'transform 0.2s ease',
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  metricIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  metricNumber: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#1e293b',
    margin: '0 0 0.25rem 0',
    lineHeight: 1,
  },
  metricLabel: {
    color: '#64748b',
    fontSize: '0.875rem',
    fontWeight: '500',
    margin: 0,
  },
  metricTrend: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendText: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  mainContentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    marginBottom: '2rem',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    fontSize: '1.125rem',
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
  complianceAreas: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  complianceArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  areaHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  areaIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    flexShrink: 0,
  },
  areaTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  areaSubtitle: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    margin: 0,
  },
  areaProgress: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  progressBar: {
    flex: 1,
    height: '8px',
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '0.75rem',
    color: '#64748b',
    minWidth: '120px',
    textAlign: 'right',
  },
  certificationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
  },
  certificationItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
  },
  certificationBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
  },
  certificationCount: {
    display: 'flex',
    flexDirection: 'column',
  },
  certificationNumber: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  certificationLabel: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  suppliersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  supplierItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  supplierAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#3b82f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  supplierName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
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
  supplierDetails: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    marginBottom: '0.5rem',
  },
  supplierId: {
    fontSize: '0.75rem',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '0.125rem 0.5rem',
    borderRadius: '4px',
  },
  supplierCategory: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  supplierLocation: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontStyle: 'italic',
  },
  supplierDays: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginBottom: '0.75rem',
  },
  dayBadge: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: '600',
  },
  supplierActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewButton: {
    padding: '0.375rem 0.75rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '500',
    textDecoration: 'none',
  },
  certifiedBadge: {
    fontSize: '0.75rem',
    color: '#10b981',
    fontWeight: '500',
  },
  quickActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  quickActionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    color: '#334155',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    width: '100%',
    position: 'relative',
  },
  quickActionButtonActive: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
  },
  actionIcon: {
    fontSize: '1.25rem',
    width: '24px',
    textAlign: 'center',
  },
  actionContent: {
    flex: 1,
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
  actionBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    backgroundColor: '#dc3545',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 'bold',
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
  statsFooter: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginTop: '2rem',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  statIcon: {
    fontSize: '1.5rem',
    color: '#3b82f6',
  },
  statNumber: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    margin: 0,
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

export default SupplierDashboardCSR