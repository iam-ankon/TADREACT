// Updated WeeklyAttendanceGraph.jsx
import React, { useState, useEffect } from 'react';
import { getWeeklyAttendanceStats} from '../../api/employeeApi';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiUsers,
  FiClock,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi';

const WeeklyAttendanceGraph = () => {
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7'); // 7, 14, 30 days

  const fetchWeeklyStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange) + 1);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log('Fetching weekly stats with:', {
        startDate: startDateStr,
        endDate: endDateStr,
        timeRange
      });
      
      const response = await getWeeklyAttendanceStats(startDateStr, endDateStr);
      
      console.log('API Response received:', response.data);
      
      if (response.data && response.data.daily_stats) {
        setWeeklyData(response.data);
      } else {
        throw new Error('Invalid data structure received from API');
      }
      
    } catch (err) {
      console.error('Error fetching weekly stats:', err);
      setError(err.message || 'Failed to load weekly attendance data');
      
      // Don't use mock data in production
      // setWeeklyData(generateMockData(timeRange));
    } finally {
      setLoading(false);
    }
  };

  // Test API on component mount
  useEffect(() => {
    // Test if API is working
    
    
    fetchWeeklyStats();
  }, [timeRange]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading weekly attendance data...</p>
        <p style={styles.loadingSubtext}>Fetching from {timeRange} days</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorHeader}>
          <FiAlertCircle size={24} />
          <h4 style={styles.errorTitle}>Unable to Load Data</h4>
        </div>
        <p style={styles.errorText}>{error}</p>
        <div style={styles.errorActions}>
          <button onClick={fetchWeeklyStats} style={styles.retryButton}>
            <FiRefreshCw /> Retry
          </button>
          <button 
            onClick={() => testWeeklyAttendanceAPI()} 
            style={styles.testButton}
          >
            Test API Connection
          </button>
        </div>
        <div style={styles.debugInfo}>
          <p>Debug Information:</p>
          <ul style={styles.debugList}>
            <li>Time Range: {timeRange} days</li>
            <li>Current Date: {new Date().toLocaleDateString()}</li>
            <li>API Endpoint: /api/weekly_attendance_stats/</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!weeklyData || !weeklyData.daily_stats) {
    return (
      <div style={styles.noDataContainer}>
        <FiCalendar size={48} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
        <h4 style={styles.noDataTitle}>No Attendance Data Available</h4>
        <p style={styles.noDataText}>
          No attendance records found for the selected time period.
          Please check if attendance data has been synced from the biometric device.
        </p>
        <button onClick={fetchWeeklyStats} style={styles.retryButton}>
          <FiRefreshCw /> Refresh
        </button>
      </div>
    );
  }

  const { daily_stats, weekly_summary, date_range } = weeklyData;

  // Check if we have actual data (not just zeros)
  const hasActualData = daily_stats.some(day => day.total_attendance > 0);

  if (!hasActualData) {
    return (
      <div style={styles.noDataContainer}>
        <FiClock size={48} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
        <h4 style={styles.noDataTitle}>No Recent Attendance Records</h4>
        <p style={styles.noDataText}>
          No attendance records found from {date_range.start_date} to {date_range.end_date}.
          <br />
          Attendance data might not be synced yet.
        </p>
        <div style={styles.timeRangeButtons}>
          {['7', '14', '30'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                ...styles.rangeButton,
                ...(timeRange === range ? styles.activeRangeButton : {})
              }}
            >
              {range} days
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>
            <FiCalendar style={{ marginRight: 8 }} />
            Weekly On-Time Attendance Trend
          </h3>
          <p style={styles.subtitle}>
            {date_range.start_date} to {date_range.end_date} • {date_range.days} days
            <br />
            <small style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Showing data for {daily_stats.filter(d => d.total_attendance > 0).length} days with attendance
            </small>
          </p>
        </div>
        
        <div style={styles.controls}>
          <div style={styles.timeRangeButtons}>
            {['7', '14', '30'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  ...styles.rangeButton,
                  ...(timeRange === range ? styles.activeRangeButton : {})
                }}
              >
                {range} days
              </button>
            ))}
          </div>
          <button onClick={fetchWeeklyStats} style={styles.refreshButton}>
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryCards}>
        <div style={styles.summaryCard}>
          <div style={{...styles.summaryIcon, backgroundColor: '#dbeafe', color: '#1d4ed8'}}>
            <FiUsers />
          </div>
          <div>
            <div style={styles.summaryValue}>{weekly_summary.total_attendance}</div>
            <div style={styles.summaryLabel}>Total Attendance</div>
          </div>
        </div>
        
        <div style={styles.summaryCard}>
          <div style={{...styles.summaryIcon, backgroundColor: '#dcfce7', color: '#16a34a'}}>
            <FiClock />
          </div>
          <div>
            <div style={styles.summaryValue}>{weekly_summary.weekly_percentage}%</div>
            <div style={styles.summaryLabel}>Weekly On-Time Rate</div>
          </div>
        </div>
        
        <div style={styles.summaryCard}>
          <div style={{...styles.summaryIcon, backgroundColor: '#fef3c7', color: '#d97706'}}>
            {weekly_summary.weekly_percentage >= 80 ? <FiTrendingUp /> : <FiTrendingDown />}
          </div>
          <div>
            <div style={styles.summaryValue}>{weekly_summary.average_daily_percentage}%</div>
            <div style={styles.summaryLabel}>Daily Average</div>
          </div>
        </div>
        
        <div style={styles.summaryCard}>
          <div style={{...styles.summaryIcon, backgroundColor: '#f3e8ff', color: '#7c3aed'}}>
            {weekly_summary.days_with_data}
          </div>
          <div>
            <div style={styles.summaryValue}>{weekly_summary.days_with_data}</div>
            <div style={styles.summaryLabel}>Days with Data</div>
          </div>
        </div>
      </div>

      {/* Bar Graph */}
      <div style={styles.graphContainer}>
        <div style={styles.graphHeader}>
          <h4 style={styles.graphTitle}>Daily On-Time Percentage</h4>
          <div style={styles.legend}>
            <div style={styles.legendItem}>
              <div style={{...styles.legendColor, backgroundColor: '#10b981'}}></div>
              <span>On-Time (≤ 9:30 AM)</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{...styles.legendColor, backgroundColor: '#ef4444'}}></div>
              <span>Late</span>
            </div>
          </div>
        </div>
        
        <div style={styles.graph}>
          {daily_stats.map((day, index) => (
            <div key={day.date} style={styles.barContainer}>
              <div style={styles.barLabels}>
                <div style={styles.dayLabel}>{day.day}</div>
                <div style={styles.dateLabel}>{day.date.split('-')[2]}</div>
                <div style={styles.percentageLabel}>{day.on_time_percentage}%</div>
              </div>
              
              <div style={styles.barBackground}>
                {/* Late bar (red background) */}
                <div 
                  style={{
                    ...styles.lateBar,
                    width: `${day.late_percentage}%`
                  }}
                  title={`Late: ${day.late_percentage}% (${day.late_count} people)`}
                ></div>
                
                {/* On-time bar (green foreground) */}
                <div 
                  style={{
                    ...styles.onTimeBar,
                    width: `${day.on_time_percentage}%`,
                    opacity: day.total_attendance > 0 ? 1 : 0.3
                  }}
                  title={
                    day.total_attendance > 0 
                      ? `${day.day_full}: ${day.on_time_percentage}% on-time (${day.on_time_count} of ${day.total_attendance})`
                      : 'No attendance data'
                  }
                >
                  {day.on_time_percentage > 20 && (
                    <span style={styles.barValue}>{day.on_time_percentage}%</span>
                  )}
                </div>
              </div>
              
              <div style={styles.dayDetails}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Total:</span>
                  <span style={styles.detailValue}>{day.total_attendance || 0}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>On-Time:</span>
                  <span style={{...styles.detailValue, color: '#10b981'}}>
                    {day.on_time_count}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Late:</span>
                  <span style={{...styles.detailValue, color: '#ef4444'}}>
                    {day.late_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Quality Warning */}
      {daily_stats.filter(d => d.total_attendance === 0).length > 0 && (
        <div style={styles.warningContainer}>
          <FiAlertCircle style={{ color: '#f59e0b', marginRight: '0.5rem' }} />
          <span>
            {daily_stats.filter(d => d.total_attendance === 0).length} days have no attendance data.
            This might affect the accuracy of weekly averages.
          </span>
        </div>
      )}

      {/* Improvement Tips */}
      {weekly_summary.weekly_percentage < 80 && weekly_summary.total_attendance > 0 && (
        <div style={styles.tipsContainer}>
          <h4 style={styles.tipsTitle}>💡 Tips to Improve On-Time Arrivals</h4>
          <div style={styles.tipsList}>
            <div style={styles.tip}>• Send reminder notifications 15 minutes before start time</div>
            <div style={styles.tip}>• Recognize employees with perfect weekly attendance</div>
            <div style={styles.tip}>• Review traffic patterns for common late days</div>
            <div style={styles.tip}>• Consider flexible start times for chronic latecomers</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles (same as before, but with added styles for new elements)
const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    marginBottom: '1.5rem',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: '0.25rem 0 0 0',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  timeRangeButtons: {
    display: 'flex',
    gap: '0.5rem',
    backgroundColor: '#f1f5f9',
    padding: '0.25rem',
    borderRadius: '0.5rem',
  },
  rangeButton: {
    padding: '0.375rem 0.75rem',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  activeRangeButton: {
    backgroundColor: 'white',
    color: '#3b82f6',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  refreshButton: {
    padding: '0.5rem',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    transition: 'all 0.2s ease',
  },
  summaryCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  summaryCard: {
    backgroundColor: '#f8fafc',
    padding: '1rem',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    border: '1px solid #e2e8f0',
  },
  summaryIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
  },
  summaryValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 1,
  },
  summaryLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
  graphContainer: {
    marginBottom: '1rem',
  },
  graphHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  graphTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  legend: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.75rem',
    color: '#64748b',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  legendColor: {
    width: '12px',
    height: '12px',
    borderRadius: '2px',
  },
  graph: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  barContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  barLabels: {
    width: '80px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  dayLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
  },
  dateLabel: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  },
  percentageLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginTop: '2px',
  },
  barBackground: {
    flex: 1,
    height: '32px',
    backgroundColor: '#fecaca',
    borderRadius: '4px',
    position: 'relative',
    overflow: 'hidden',
  },
  lateBar: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#fecaca',
    transition: 'width 0.5s ease',
  },
  onTimeBar: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    transition: 'width 0.5s ease',
    zIndex: 1,
  },
  barValue: {
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '600',
    paddingRight: '8px',
  },
  dayDetails: {
    width: '150px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    fontSize: '0.75rem',
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: '#64748b',
  },
  detailValue: {
    fontWeight: '600',
    color: '#1e293b',
  },
  warningContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
    fontSize: '0.875rem',
    color: '#92400e',
  },
  tipsContainer: {
    padding: '1rem',
    backgroundColor: '#f0f9ff',
    borderRadius: '0.75rem',
    border: '1px solid #bae6fd',
  },
  tipsTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: '0.5rem',
  },
  tipsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  tip: {
    fontSize: '0.75rem',
    color: '#0284c7',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    color: '#64748b',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },
  loadingSubtext: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginTop: '0.5rem',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },
  errorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
    color: '#dc2626',
  },
  errorTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    margin: 0,
  },
  errorText: {
    color: '#7f1d1d',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  errorActions: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  retryButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
  },
  testButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  debugInfo: {
    backgroundColor: '#f9fafb',
    padding: '1rem',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    color: '#6b7280',
  },
  debugList: {
    margin: '0.5rem 0 0 0',
    paddingLeft: '1rem',
  },
  noDataContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    color: '#6b7280',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    textAlign: 'center',
  },
  noDataTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.5rem',
  },
  noDataText: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    marginBottom: '1.5rem',
    lineHeight: 1.5,
  },
};

// Add CSS animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default WeeklyAttendanceGraph;