// DashboardCSR.jsx - No Popups/Toasts, Only Visual Indicators
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getSuppliers,
  getDashboardExpirySummary,
  sendBulkReminders,
  recalculateAllDays,
} from "../../api/supplierApi";

const SupplierDashboardCSR = () => {
  const navigate = useNavigate();

  // Notification days constant - ONLY these days will trigger notifications
  const NOTIFICATION_DAYS = [90, 75, 60, 45, 30, 15];

  // Main state
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    compliantSuppliers: 0,
    nonCompliantSuppliers: 0,
    underReview: 0,
    conditional: 0,
    criticalSuppliers: 0,
    certifiedSuppliers: 0,
    validLicenseSuppliers: 0,
    activeGrievanceSuppliers: 0,
  });

  const [recentSuppliers, setRecentSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Expiry summary state
  const [expirySummary, setExpirySummary] = useState({
    total_expiring: 0,
    byDay: {},
    items: {},
  });

  const [recalculating, setRecalculating] = useState(false);
  const [complianceOverview, setComplianceOverview] = useState({
    fireSafety: { total: 0, compliant: 0, percentage: 0 },
    environmental: { total: 0, compliant: 0, percentage: 0 },
    labor: { total: 0, compliant: 0, percentage: 0 },
    structural: { total: 0, compliant: 0, percentage: 0 },
  });

  const [certificationStats, setCertificationStats] = useState({
    bsci: 0,
    sedex: 0,
    wrap: 0,
    iso: 0,
    oekoTex: 0,
    gots: 0,
  });

  const [licenseExpiring, setLicenseExpiring] = useState({
    trade_license: { count: 0, expiringSoon: [] },
    factory_license: { count: 0, expiringSoon: [] },
    fire_license: { count: 0, expiringSoon: [] },
    membership: { count: 0, expiringSoon: [] },
    group_insurance: { count: 0, expiringSoon: [] },
  });

  const [nonCompliantList, setNonCompliantList] = useState([]);

  // Auto-refresh effect
  useEffect(() => {
    fetchDashboardData();
    fetchExpirySummary();

    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchDashboardData();
        fetchExpirySummary();
        setLastUpdated(new Date());
      }, 300000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Calculate compliance status based on new requirements
  const calculateAutoComplianceStatus = (supplier) => {
    const daysRemainingList = [
      supplier.bsci_validity_days_remaining,
      supplier.sedex_validity_days_remaining,
      supplier.wrap_validity_days_remaining,
      supplier.trade_license_days_remaining,
      supplier.factory_license_days_remaining,
      supplier.fire_license_days_remaining,
      supplier.oeko_tex_validity_days_remaining,
      supplier.gots_validity_days_remaining,
      supplier.iso_9001_validity_days_remaining,
      supplier.iso_14001_validity_days_remaining,
    ].filter((days) => days !== null && days !== undefined);

    const hasExpiredItems = daysRemainingList.some((days) => days <= 0);
    const hasExpiringWithin30Days = daysRemainingList.some(
      (days) => days > 0 && days <= 30,
    );

    const hasValidLicenses =
      (supplier.trade_license_days_remaining > 0 ||
        !supplier.trade_license_days_remaining) &&
      (supplier.factory_license_days_remaining > 0 ||
        !supplier.factory_license_days_remaining) &&
      (supplier.fire_license_days_remaining > 0 ||
        !supplier.fire_license_days_remaining);

    if (hasExpiredItems) {
      return {
        status: "non_compliant",
        reason: "Has expired certificates/licenses",
      };
    }

    if (hasExpiringWithin30Days) {
      return {
        status: "under_review",
        reason: "Documents expiring within 30 days",
      };
    }

    if (!hasValidLicenses) {
      return { status: "non_compliant", reason: "Missing or invalid licenses" };
    }

    return {
      status: "compliant",
      reason: "All documents valid (>30 days remaining)",
    };
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const suppliersResponse = await getSuppliers();
      const suppliers = suppliersResponse.data || [];

      calculateAutoStats(suppliers);
      calculateComplianceOverview(suppliers);
      calculateCertificationStats(suppliers);
      calculateLicenseExpiring(suppliers);

      const recent = [...suppliers]
        .sort((a, b) => (b.id || 0) - (a.id || 0))
        .slice(0, 8)
        .map((supplier) => {
          const autoCompliance = calculateAutoComplianceStatus(supplier);
          return {
            id: supplier.id,
            name: supplier.supplier_name || "Unnamed Supplier",
            supplier_id: supplier.supplier_id || "N/A",
            compliance_status: autoCompliance.status,
            compliance_reason: autoCompliance.reason,
            location: supplier.location || "Location not specified",
            email: supplier.email,
            daysRemaining: {
              bsci: supplier.bsci_validity_days_remaining,
              sedex: supplier.sedex_validity_days_remaining,
              wrap: supplier.wrap_validity_days_remaining,
              trade_license: supplier.trade_license_days_remaining,
              fire_license: supplier.fire_license_days_remaining,
              factory_license: supplier.factory_license_days_remaining,
            },
          };
        });

      setRecentSuppliers(recent);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateAutoStats = (suppliers) => {
    const total = suppliers.length;

    const compliant = suppliers.filter((s) => {
      const autoStatus = calculateAutoComplianceStatus(s);
      return autoStatus.status === "compliant";
    }).length;

    const nonCompliant = suppliers.filter((s) => {
      const autoStatus = calculateAutoComplianceStatus(s);
      return autoStatus.status === "non_compliant";
    }).length;

    const underReview = suppliers.filter((s) => {
      const autoStatus = calculateAutoComplianceStatus(s);
      return autoStatus.status === "under_review";
    }).length;

    const critical = suppliers.filter((s) => {
      const daysList = [
        s.bsci_validity_days_remaining,
        s.sedex_validity_days_remaining,
        s.wrap_validity_days_remaining,
        s.trade_license_days_remaining,
        s.factory_license_days_remaining,
        s.fire_license_days_remaining,
      ].filter((d) => d !== null && d !== undefined);
      return daysList.some((days) => days > 0 && days <= 30);
    }).length;

    const certified = suppliers.filter((s) => {
      const certStatuses = [
        s.bsci_validity_days_remaining,
        s.sedex_validity_days_remaining,
        s.wrap_validity_days_remaining,
        s.oeko_tex_validity_days_remaining,
        s.gots_validity_days_remaining,
        s.iso_9001_validity_days_remaining,
      ];
      return certStatuses.some((days) => days > 0);
    }).length;

    const validLicense = suppliers.filter(
      (s) =>
        (s.trade_license_days_remaining > 0 ||
          !s.trade_license_days_remaining) &&
        (s.factory_license_days_remaining > 0 ||
          !s.factory_license_days_remaining) &&
        (s.fire_license_days_remaining > 0 || !s.fire_license_days_remaining),
    ).length;

    const activeGrievance = suppliers.filter(
      (s) => s.grievance_mechanism === true,
    ).length;

    const nonCompliantSuppliers = suppliers
      .filter((s) => {
        const autoStatus = calculateAutoComplianceStatus(s);
        return autoStatus.status === "non_compliant";
      })
      .map((s) => ({
        id: s.id,
        name: s.supplier_name,
        reason: calculateAutoComplianceStatus(s).reason,
        expired_items: {
          bsci: s.bsci_validity_days_remaining,
          trade_license: s.trade_license_days_remaining,
          factory_license: s.factory_license_days_remaining,
          fire_license: s.fire_license_days_remaining,
        },
      }));

    setNonCompliantList(nonCompliantSuppliers);

    setStats({
      totalSuppliers: total,
      compliantSuppliers: compliant,
      nonCompliantSuppliers: nonCompliant,
      underReview,
      conditional: 0,
      criticalSuppliers: critical,
      certifiedSuppliers: certified,
      validLicenseSuppliers: validLicense,
      activeGrievanceSuppliers: activeGrievance,
    });
  };

  const fetchExpirySummary = async () => {
    try {
      const response = await getDashboardExpirySummary();
      if (response.data && response.data.data) {
        processExpirySummary(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching expiry summary:", error);
    }
  };

  const processExpirySummary = (summaryData) => {
    const byDay = {};
    const items = {};

    // Initialize byDay for each notification day
    NOTIFICATION_DAYS.forEach((day) => {
      byDay[day] = { count: 0, items: [] };
    });

    if (summaryData && typeof summaryData === "object") {
      Object.entries(summaryData).forEach(([key, value]) => {
        if (key !== "total_expiring" && value && value.count > 0) {
          items[key] = value;

          if (value.suppliers && Array.isArray(value.suppliers)) {
            value.suppliers.forEach((supplier) => {
              const days = supplier.days;
              // Only include if days is in NOTIFICATION_DAYS
              if (days && NOTIFICATION_DAYS.includes(days)) {
                byDay[days].count++;
                byDay[days].items.push({
                  ...supplier,
                  itemType: key,
                  itemName: value.name,
                  icon: getItemIcon(key),
                });
              }
            });
          }
        }
      });
    }

    setExpirySummary({
      total_expiring: summaryData?.total_expiring || 0,
      byDay,
      items,
    });
  };

  const getItemIcon = (itemType) => {
    const icons = {
      bsci: "📜",
      sedex: "📜",
      wrap: "📜",
      security_audit: "🛡️",
      oeko_tex: "📜",
      gots: "📜",
      ocs: "📜",
      grs: "📜",
      rcs: "📜",
      iso_9001: "📜",
      iso_14001: "📜",
      trade_license: "📋",
      factory_license: "🏭",
      fire_license: "🚒",
      membership: "📋",
      group_insurance: "🛡️",
      boiler_license: "⚙️",
      berc_license: "📋",
      drinking_water_license: "💧",
    };
    return icons[itemType] || "📄";
  };

  const handleRecalculateDays = async () => {
    setRecalculating(true);
    try {
      const response = await recalculateAllDays();
      if (response.data && response.data.success) {
        fetchDashboardData();
        fetchExpirySummary();
      }
    } catch (error) {
      console.error("Recalculation failed:", error);
    } finally {
      setRecalculating(false);
    }
  };

  const calculateComplianceOverview = (suppliers) => {
    const total = suppliers.length;
    const fireSafetyCompliant = suppliers.filter(
      (s) => s.last_fire_training_by_fscd && s.last_fire_drill_record_by_fscd,
    ).length;
    const environmentalCompliant = suppliers.filter(
      (s) => s.water_test_report_doe,
    ).length;
    const laborCompliant = suppliers.filter(
      (s) => s.minimum_wages_paid === true && s.festival_bonus === true,
    ).length;
    const structuralCompliant = suppliers.filter(
      (s) => s.progress_rate && parseFloat(s.progress_rate) >= 80,
    ).length;

    setComplianceOverview({
      fireSafety: {
        total,
        compliant: fireSafetyCompliant,
        percentage: total ? Math.round((fireSafetyCompliant / total) * 100) : 0,
      },
      environmental: {
        total,
        compliant: environmentalCompliant,
        percentage: total
          ? Math.round((environmentalCompliant / total) * 100)
          : 0,
      },
      labor: {
        total,
        compliant: laborCompliant,
        percentage: total ? Math.round((laborCompliant / total) * 100) : 0,
      },
      structural: {
        total,
        compliant: structuralCompliant,
        percentage: total ? Math.round((structuralCompliant / total) * 100) : 0,
      },
    });
  };

  const calculateCertificationStats = (suppliers) => {
    setCertificationStats({
      bsci: suppliers.filter((s) => s.bsci_validity_days_remaining > 0).length,
      sedex: suppliers.filter((s) => s.sedex_validity_days_remaining > 0)
        .length,
      wrap: suppliers.filter((s) => s.wrap_validity_days_remaining > 0).length,
      iso: suppliers.filter(
        (s) =>
          s.iso_9001_validity_days_remaining > 0 ||
          s.iso_14001_validity_days_remaining > 0,
      ).length,
      oekoTex: suppliers.filter((s) => s.oeko_tex_validity_days_remaining > 0)
        .length,
      gots: suppliers.filter((s) => s.gots_validity_days_remaining > 0).length,
    });
  };

  const calculateLicenseExpiring = (suppliers) => {
    const licenseTypes = [
      {
        key: "trade_license",
        field: "trade_license_days_remaining",
        name: "Trade License",
      },
      {
        key: "factory_license",
        field: "factory_license_days_remaining",
        name: "Factory License",
      },
      {
        key: "fire_license",
        field: "fire_license_days_remaining",
        name: "Fire License",
      },
      {
        key: "membership",
        field: "membership_days_remaining",
        name: "Membership",
      },
      {
        key: "group_insurance",
        field: "group_insurance_days_remaining",
        name: "Group Insurance",
      },
    ];

    const expiring = {};
    licenseTypes.forEach((license) => {
      const expiringSoon = suppliers
        .filter(
          (s) =>
            s[license.field] !== null &&
            s[license.field] !== undefined &&
            s[license.field] <= 90 &&
            s[license.field] > 0,
        )
        .map((s) => ({
          id: s.id,
          name: s.supplier_name,
          days: s[license.field],
        }))
        .sort((a, b) => a.days - b.days)
        .slice(0, 5);
      expiring[license.key] = { count: expiringSoon.length, expiringSoon };
    });
    setLicenseExpiring(expiring);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "compliant":
        return { bg: "#10b981", text: "#ffffff", icon: "✅" };
      case "under_review":
        return { bg: "#f59e0b", text: "#ffffff", icon: "⏳" };
      case "non_compliant":
        return { bg: "#ef4444", text: "#ffffff", icon: "⚠️" };
      default:
        return { bg: "#6b7280", text: "#ffffff", icon: "📋" };
    }
  };

  const getDaysClass = (days) => {
    if (!days && days !== 0) return "badge-secondary";
    if (days <= 0) return "badge-expired";
    if (days <= 30) return "badge-critical";
    if (days <= 60) return "badge-warning";
    if (days <= 90) return "badge-upcoming";
    return "badge-valid";
  };

  const calculateComplianceRate = () => {
    if (stats.totalSuppliers === 0) return 0;
    return Math.round((stats.compliantSuppliers / stats.totalSuppliers) * 100);
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "#f3f4f6",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div className="spinner-large"></div>
            <p style={{ marginTop: "1rem", color: "#6b7280" }}>
              Loading Suppliers...
            </p>
          </div>
        </div>
        <style>{`
          .spinner-large {
            width: 50px;
            height: 50px;
            border: 3px solid #e5e7eb;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="csr-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="header-icon">🏭</div>
          <div>
            <h1>CSR Compliance Dashboard</h1>
            <p>
              Automated compliance monitoring based on expiring certificates &
              licenses
            </p>
          </div>
        </div>
        <div className="header-right">
          <div className="auto-refresh-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)}
              />
              <span className="toggle-slider"></span>
            </label>
            <span>Auto-refresh (5min)</span>
          </div>
          <button
            className="btn-refresh"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <button
            className="btn-recalc"
            onClick={handleRecalculateDays}
            disabled={recalculating}
          >
            {recalculating ? "⏳..." : "📅 Recalc Days"}
          </button>
          <Link to="/add-supplierCSR" className="btn-add">
            ➕ Add Supplier
          </Link>
        </div>
      </div>

      {/* Last Updated */}
      <div className="last-updated">
        <span>📡 Last updated: {lastUpdated.toLocaleTimeString()}</span>
        {autoRefresh && (
          <span className="auto-refresh-badge">Auto-refresh active</span>
        )}
      </div>

      {/* Info Box - Explain Compliance Calculation */}
      <div className="info-box">
        <span>ℹ️</span>
        <div>
          <strong>How Compliance is Calculated:</strong> Suppliers are
          automatically marked as:
          <strong className="compliant-text"> Compliant</strong> (all documents
          valid with &gt;30 days remaining),
          <strong className="review-text"> Under Review</strong> (documents
          expiring within 30 days),
          <strong className="noncompliant-text"> Non-Compliant</strong> (expired
          documents)
        </div>
      </div>

      {/* Expiry Alert Banner - Show when there are expiring items */}
      {expirySummary.total_expiring > 0 && (
        <div className="expiry-alert-banner">
          <div className="banner-icon">🔔</div>
          <div className="banner-content">
            <div className="banner-title">
              {expirySummary.total_expiring} document(s) expiring soon!
            </div>
            <div className="banner-subtitle">
              Expiring in: {NOTIFICATION_DAYS.join(", ")} days
            </div>
          </div>
          <Link to="/suppliersCSR?filter=expiring" className="banner-link">
            View Details →
          </Link>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert-error">
          <span>⚠️</span>
          <p>{error}</p>
          <button onClick={fetchDashboardData}>Try Again</button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div
          className="stat-card clickable"
          onClick={() => navigate("/suppliersCSR")}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === "Enter" && navigate("/suppliersCSR")}
        >
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <h3>{stats.totalSuppliers.toLocaleString()}</h3>
            <p>Total Suppliers</p>
            <small>Click to view all →</small>
          </div>
        </div>

        <div
          className="stat-card success clickable"
          onClick={() => navigate("/suppliersCSR?status=compliant")}
          role="button"
          tabIndex={0}
          onKeyPress={(e) =>
            e.key === "Enter" && navigate("/suppliersCSR?status=compliant")
          }
        >
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.compliantSuppliers.toLocaleString()}</h3>
            <p>
              Compliant <span>{calculateComplianceRate()}%</span>
            </p>
            <small>Click to view →</small>
          </div>
        </div>

        <div
          className="stat-card danger clickable"
          onClick={() => navigate("/suppliersCSR?status=non_compliant")}
          role="button"
          tabIndex={0}
          onKeyPress={(e) =>
            e.key === "Enter" && navigate("/suppliersCSR?status=non_compliant")
          }
        >
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>{stats.nonCompliantSuppliers.toLocaleString()}</h3>
            <p>Non-Compliant</p>
            {stats.nonCompliantSuppliers > 0 && (
              <small>Expired/critical documents</small>
            )}
          </div>
        </div>

        <div
          className="stat-card warning clickable"
          onClick={() => navigate("/suppliersCSR?status=under_review")}
          role="button"
          tabIndex={0}
          onKeyPress={(e) =>
            e.key === "Enter" && navigate("/suppliersCSR?status=under_review")
          }
        >
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{stats.underReview.toLocaleString()}</h3>
            <p>Under Review</p>
            <small>Expiring in 30 days</small>
          </div>
        </div>
      </div>

      {/* Expiry Days Grid - Show cards for each notification day */}
      {expirySummary.total_expiring > 0 && (
        <div className="expiry-days-section">
          <h3 className="section-title">📅 Documents Expiring Soon</h3>
          <div className="expiry-days-grid">
            {NOTIFICATION_DAYS.map((day) => {
              const dayData = expirySummary.byDay[day];
              const count = dayData?.count || 0;

              // Determine color based on days
              let bgColor = "#3b82f6";
              if (day <= 30) bgColor = "#ef4444";
              else if (day <= 60) bgColor = "#f59e0b";

              return (
                <div key={day} className="expiry-day-card">
                  <div
                    className="expiry-day-header"
                    style={{ backgroundColor: bgColor }}
                  >
                    <span className="day-number">{day}</span>
                    <span className="day-label">Days Remaining</span>
                    <span className="day-count">{count} item(s)</span>
                  </div>
                  <div className="expiry-day-items">
                    {dayData?.items?.slice(0, 5).map((item, idx) => (
                      <div
                        key={idx}
                        className="expiry-item clickable-item"
                        onClick={() => navigate(`/suppliersCSR/${item.id}`)}
                      >
                        <span>{item.icon}</span>
                        <span className="item-name">{item.itemName}</span>
                        <span className="supplier-name">{item.name}</span>
                      </div>
                    ))}
                    {dayData?.items?.length > 5 && (
                      <div className="more-items">
                        +{dayData.items.length - 5} more
                      </div>
                    )}
                    {count === 0 && (
                      <div className="empty-item">
                        No items expiring at {day} days
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="grid-col">
          {/* Compliance Score Card */}
          <div className="card">
            <div className="card-header">
              <h3>📊 Overall Compliance Rate</h3>
              <span className="score-value">{calculateComplianceRate()}%</span>
            </div>
            <div className="progress-large">
              <div
                className="progress-fill"
                style={{ width: `${calculateComplianceRate()}%` }}
              ></div>
            </div>
            <div className="status-breakdown">
              <div
                className="status-item clickable-item"
                onClick={() => navigate("/suppliersCSR?status=compliant")}
                role="button"
                tabIndex={0}
              >
                <span className="dot compliant"></span>Compliant:{" "}
                {stats.compliantSuppliers}
              </div>
              <div
                className="status-item clickable-item"
                onClick={() => navigate("/suppliersCSR?status=under_review")}
                role="button"
                tabIndex={0}
              >
                <span className="dot review"></span>Under Review:{" "}
                {stats.underReview}
              </div>
              <div
                className="status-item clickable-item"
                onClick={() => navigate("/suppliersCSR?status=non_compliant")}
                role="button"
                tabIndex={0}
              >
                <span className="dot non-compliant"></span>Non-Compliant:{" "}
                {stats.nonCompliantSuppliers}
              </div>
            </div>
          </div>

          {/* Compliance by Category */}
          <div className="card">
            <div className="card-header">
              <h3>📊 Compliance by Category</h3>
            </div>
            <div className="compliance-list">
              {[
                {
                  key: "fireSafety",
                  label: "Fire Safety",
                  icon: "🔥",
                  color: "#ef4444",
                  desc: "Training & drill records",
                  filter: "fire_safety",
                },
                {
                  key: "environmental",
                  label: "Environmental",
                  icon: "🌱",
                  color: "#10b981",
                  desc: "Water test reports",
                  filter: "environmental",
                },
                {
                  key: "labor",
                  label: "Labor Standards",
                  icon: "👷",
                  color: "#f59e0b",
                  desc: "Wages & festival bonus",
                  filter: "labor",
                },
                {
                  key: "structural",
                  label: "Structural Safety",
                  icon: "🏗️",
                  color: "#3b82f6",
                  desc: "RSC audit ≥80%",
                  filter: "structural",
                },
              ].map((area) => (
                <div
                  key={area.key}
                  className="compliance-item clickable-item"
                  onClick={() =>
                    navigate(`/suppliersCSR?category=${area.filter}`)
                  }
                  role="button"
                  tabIndex={0}
                >
                  <div className="compliance-header">
                    <div
                      className="compliance-icon"
                      style={{
                        backgroundColor: `${area.color}15`,
                        color: area.color,
                      }}
                    >
                      {area.icon}
                    </div>
                    <div className="compliance-title">
                      <strong>{area.label}</strong>
                      <small>{area.desc}</small>
                    </div>
                    <div className="compliance-stats">
                      <span className="compliant-count">
                        {complianceOverview[area.key]?.compliant || 0}
                      </span>
                      <span>/{complianceOverview[area.key]?.total || 0}</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${complianceOverview[area.key]?.percentage || 0}%`,
                        backgroundColor: area.color,
                      }}
                    ></div>
                  </div>
                  <div className="progress-label">
                    {complianceOverview[area.key]?.percentage || 0}% compliant
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="card">
            <div className="card-header">
              <h3>🏅 Valid Certifications</h3>
              <Link to="/suppliersCSR?tab=certifications" className="link">
                View All →
              </Link>
            </div>
            <div className="certs-grid">
              {[
                {
                  key: "bsci",
                  name: "BSCI",
                  count: certificationStats.bsci,
                  color: "#3b82f6",
                  filter: "bsci",
                },
                {
                  key: "sedex",
                  name: "SEDEX",
                  count: certificationStats.sedex,
                  color: "#10b981",
                  filter: "sedex",
                },
                {
                  key: "wrap",
                  name: "WRAP",
                  count: certificationStats.wrap,
                  color: "#f59e0b",
                  filter: "wrap",
                },
                {
                  key: "iso",
                  name: "ISO",
                  count: certificationStats.iso,
                  color: "#8b5cf6",
                  filter: "iso",
                },
                {
                  key: "oekoTex",
                  name: "OEKO-TEX",
                  count: certificationStats.oekoTex,
                  color: "#ec489a",
                  filter: "oeko_tex",
                },
                {
                  key: "gots",
                  name: "GOTS",
                  count: certificationStats.gots,
                  color: "#14b8a6",
                  filter: "gots",
                },
              ].map((cert) => (
                <div
                  key={cert.key}
                  className="cert-item clickable-item"
                  onClick={() =>
                    navigate(`/suppliersCSR?certification=${cert.filter}`)
                  }
                  role="button"
                  tabIndex={0}
                >
                  <div
                    className="cert-circle"
                    style={{ borderColor: cert.color }}
                  >
                    <span>{cert.count}</span>
                  </div>
                  <span className="cert-name">{cert.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Suppliers */}
          <div className="card">
            <div className="card-header">
              <h3>🆕 Recently Added</h3>
              <Link to="/suppliersCSR" className="link">
                View All →
              </Link>
            </div>
            <div className="suppliers-list">
              {recentSuppliers.slice(0, 5).map((supplier) => {
                const status = getStatusColor(supplier.compliance_status);
                const minDays = Math.min(
                  ...Object.values(supplier.daysRemaining).filter(
                    (v) => v !== null,
                  ),
                );
                return (
                  <div
                    key={supplier.id}
                    className="supplier-row"
                    onClick={() => navigate(`/suppliersCSR/${supplier.id}`)}
                  >
                    <div className="supplier-avatar">
                      {supplier.name?.charAt(0)}
                    </div>
                    <div className="supplier-details">
                      <div className="supplier-name-row">
                        <strong>{supplier.name}</strong>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: status.bg }}
                        >
                          {status.icon}{" "}
                          {supplier.compliance_status?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="supplier-meta">
                        <span>ID: {supplier.supplier_id}</span>
                        <span>📍 {supplier.location?.substring(0, 20)}</span>
                      </div>
                      {supplier.compliance_reason && (
                        <div className="compliance-reason">
                          {supplier.compliance_reason}
                        </div>
                      )}
                    </div>
                    {minDays && minDays !== Infinity && (
                      <div
                        className={`days-indicator ${getDaysClass(minDays)}`}
                      >
                        {minDays}d
                      </div>
                    )}
                  </div>
                );
              })}
              {recentSuppliers.length === 0 && (
                <div className="empty-state">No suppliers found</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="grid-col">
          {/* Non-Compliant Suppliers List */}
          {nonCompliantList.length > 0 && (
            <div className="card noncompliant-card">
              <div className="card-header">
                <h3>⚠️ Non-Compliant Suppliers</h3>
                <span className="badge-danger">
                  {nonCompliantList.length} suppliers
                </span>
              </div>
              <div className="noncompliant-list">
                {nonCompliantList.slice(0, 5).map((supplier) => (
                  <div
                    key={supplier.id}
                    className="noncompliant-item"
                    onClick={() => navigate(`/suppliersCSR/${supplier.id}`)}
                  >
                    <div className="noncompliant-header">
                      <strong>{supplier.name}</strong>
                      <span className="reason-badge">{supplier.reason}</span>
                    </div>
                    <div className="noncompliant-details">
                      {Object.entries(supplier.expired_items).map(
                        ([key, days]) =>
                          days !== null &&
                          days !== undefined &&
                          days <= 30 && (
                            <span
                              key={key}
                              className={`expired-badge ${days <= 0 ? "expired" : "critical"}`}
                            >
                              {key.replace("_", " ")}:{" "}
                              {days <= 0 ? "EXPIRED" : `${days}d left`}
                            </span>
                          ),
                      )}
                    </div>
                  </div>
                ))}
                {nonCompliantList.length > 5 && (
                  <div className="view-more">
                    +{nonCompliantList.length - 5} more non-compliant suppliers
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate("/suppliersCSR?status=non_compliant")}
                className="view-all-btn"
              >
                View All Non-Compliant →
              </button>
            </div>
          )}

          {/* Licenses Expiring Soon */}
          <div className="card">
            <div className="card-header">
              <h3>📋 Licenses Expiring Soon</h3>
            </div>
            <div className="license-list">
              {Object.entries(licenseExpiring).map(
                ([key, data]) =>
                  data.count > 0 && (
                    <div key={key} className="license-item">
                      <div className="license-header">
                        <span className="license-icon">
                          {key === "trade_license" && "📋"}
                          {key === "factory_license" && "🏭"}
                          {key === "fire_license" && "🚒"}
                          {key === "membership" && "📜"}
                          {key === "group_insurance" && "🛡️"}
                        </span>
                        <span className="license-name">
                          {key.replace("_", " ").toUpperCase()}
                        </span>
                        <span className="license-count">
                          {data.count} expiring
                        </span>
                      </div>
                      <div className="license-suppliers">
                        {data.expiringSoon.slice(0, 3).map((supplier, idx) => (
                          <div
                            key={idx}
                            className="license-supplier clickable-item"
                            onClick={() =>
                              navigate(`/suppliersCSR/${supplier.id}`)
                            }
                            role="button"
                            tabIndex={0}
                          >
                            <span>{supplier.name?.substring(0, 25)}</span>
                            <span
                              className={`days-badge ${getDaysClass(supplier.days)}`}
                            >
                              {supplier.days}d
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
              )}
              {Object.values(licenseExpiring).every((d) => d.count === 0) && (
                <div className="empty-licenses">
                  ✅ All licenses are current
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3>⚡ Quick Actions</h3>
            </div>
            <div className="actions-grid">
              <button
                onClick={() => navigate("/suppliersCSR?status=non_compliant")}
                className="action-btn danger"
              >
                <span>⚠️</span> Non-Compliant ({stats.nonCompliantSuppliers})
              </button>
              <button
                onClick={() => navigate("/suppliersCSR?status=under_review")}
                className="action-btn warning"
              >
                <span>⏳</span> Under Review ({stats.underReview})
              </button>
              <button
                onClick={() => navigate("/suppliersCSR?filter=expiring")}
                className="action-btn info"
              >
                <span>🔔</span> Expiring ({expirySummary.total_expiring})
              </button>
              <Link to="/add-supplierCSR" className="action-btn primary">
                <span>➕</span> Add Supplier
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .csr-dashboard {
          margin: 0 auto;
          padding: 34px;
          background: linear-gradient(135deg, #f5f7fa 0%, #eef2f6 100%);
          min-height: 100vh;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
        }

        /* Clickable styles */
        .clickable {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .clickable:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.15);
        }
        .clickable-item {
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        .clickable-item:hover {
          opacity: 0.8;
        }

        /* Header */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 20px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .header-icon {
          font-size: 48px;
        }
        .header-left h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
        }
        .header-left p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }
        .header-right {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .auto-refresh-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6b7280;
        }
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.3s;
          border-radius: 24px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
        input:checked + .toggle-slider {
          background-color: #3b82f6;
        }
        input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }
        .btn-refresh,
        .btn-recalc,
        .btn-add {
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .btn-refresh {
          background: white;
          border: 1px solid #e5e7eb;
          color: #374151;
        }
        .btn-refresh:hover {
          background: #f9fafb;
        }
        .btn-recalc {
          background: #fef3c7;
          color: #92400e;
        }
        .btn-recalc:hover {
          background: #fde68a;
        }
        .btn-add {
          background: #3b82f6;
          color: white;
          text-decoration: none;
        }
        .btn-add:hover {
          background: #2563eb;
        }
        .last-updated {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          font-size: 12px;
          color: #6b7280;
        }
        .auto-refresh-badge {
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 11px;
        }

        /* Info Box */
        .info-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          font-size: 13px;
        }
        .compliant-text {
          color: #10b981;
          margin-left: 8px;
        }
        .review-text {
          color: #f59e0b;
          margin-left: 8px;
        }
        .noncompliant-text {
          color: #ef4444;
          margin-left: 8px;
        }

        /* Expiry Alert Banner */
        .expiry-alert-banner {
          background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
          border: 1px solid #fde68a;
          border-radius: 16px;
          padding: 16px 24px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .banner-icon {
          font-size: 28px;
        }
        .banner-content {
          flex: 1;
        }
        .banner-title {
          font-weight: 700;
          font-size: 15px;
          color: #92400e;
        }
        .banner-subtitle {
          font-size: 12px;
          color: #b45309;
          margin-top: 4px;
        }
        .banner-link {
          color: #d97706;
          text-decoration: none;
          font-weight: 500;
          font-size: 13px;
        }

        /* Expiry Days Section */
        .expiry-days-section {
          margin-bottom: 24px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 16px;
        }
        .expiry-days-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }
        .expiry-day-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
        }
        .expiry-day-header {
          padding: 12px;
          text-align: center;
          color: white;
        }
        .day-number {
          font-size: 24px;
          font-weight: 700;
          display: block;
        }
        .day-label {
          font-size: 11px;
          opacity: 0.9;
        }
        .day-count {
          font-size: 12px;
          display: block;
          margin-top: 6px;
          font-weight: 500;
        }
        .expiry-day-items {
          padding: 12px;
          max-height: 200px;
          overflow-y: auto;
        }
        .expiry-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          padding: 6px 0;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
        }
        .expiry-item:hover {
          background: #f9fafb;
        }
        .item-name {
          font-weight: 500;
          flex: 1;
        }
        .supplier-name {
          color: #9ca3af;
          font-size: 10px;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .more-items {
          text-align: center;
          font-size: 11px;
          color: #3b82f6;
          margin-top: 8px;
          cursor: pointer;
        }
        .empty-item {
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
          padding: 12px;
        }

        /* Alert Error */
        .alert-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .alert-error button {
          background: #dc2626;
          color: white;
          border: none;
          padding: 4px 12px;
          border-radius: 6px;
          cursor: pointer;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }
        .stat-card {
          background: white;
          border-radius: 20px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
        }
        .stat-icon {
          font-size: 32px;
        }
        .stat-info h3 {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          color: #1f2937;
        }
        .stat-info p {
          font-size: 13px;
          margin: 4px 0 0;
          color: #6b7280;
        }
        .stat-info small {
          font-size: 10px;
          color: #9ca3af;
          display: block;
          margin-top: 4px;
        }
        .stat-card.success .stat-info p span {
          color: #10b981;
          font-weight: 600;
        }
        .stat-card.danger .stat-info p {
          color: #ef4444;
        }
        .stat-card.warning .stat-info p {
          color: #f59e0b;
        }

        /* Dashboard Grid */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .grid-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Cards */
        .card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .card-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }
        .link {
          color: #3b82f6;
          text-decoration: none;
          font-size: 13px;
        }
        .badge-danger {
          background: #fee2e2;
          color: #dc2626;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        /* Non-Compliant Card */
        .noncompliant-card {
          background: linear-gradient(135deg, #fef2f2 0%, #fff 100%);
          border-left: 4px solid #ef4444;
        }
        .noncompliant-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .noncompliant-item {
          padding: 12px;
          background: white;
          border-radius: 12px;
          cursor: pointer;
          border: 1px solid #fee2e2;
        }
        .noncompliant-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .reason-badge {
          font-size: 11px;
          background: #fef3c7;
          color: #d97706;
          padding: 2px 8px;
          border-radius: 12px;
        }
        .noncompliant-details {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .expired-badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
        }
        .expired-badge.expired {
          background: #dc2626;
          color: white;
        }
        .expired-badge.critical {
          background: #f97316;
          color: white;
        }
        .view-all-btn {
          margin-top: 16px;
          width: 100%;
          padding: 10px;
          background: #f3f4f6;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }

        /* Progress */
        .progress-large {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .progress-fill {
          height: 100%;
          background: #3b82f6;
          border-radius: 4px;
          transition: width 0.3s;
        }
        .score-value {
          font-size: 24px;
          font-weight: 700;
          color: #3b82f6;
        }
        .status-breakdown {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 8px;
        }
        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .dot.compliant {
          background: #10b981;
        }
        .dot.review {
          background: #f59e0b;
        }
        .dot.non-compliant {
          background: #ef4444;
        }

        /* Compliance List */
        .compliance-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .compliance-item {
          width: 100%;
        }
        .compliance-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .compliance-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        .compliance-title {
          flex: 1;
        }
        .compliance-title strong {
          display: block;
          font-size: 14px;
        }
        .compliance-title small {
          font-size: 11px;
          color: #9ca3af;
        }
        .compliance-stats {
          font-size: 14px;
          font-weight: 500;
        }
        .compliant-count {
          color: #10b981;
        }
        .progress-bar {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 4px;
        }
        .progress-label {
          font-size: 11px;
          color: #9ca3af;
        }

        /* Certifications Grid */
        .certs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .cert-item {
          text-align: center;
          cursor: pointer;
        }
        .cert-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 3px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 8px;
        }
        .cert-circle span {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }
        .cert-name {
          font-size: 12px;
          color: #6b7280;
        }

        /* License List */
        .license-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .license-item {
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 12px;
        }
        .license-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .license-icon {
          font-size: 18px;
        }
        .license-name {
          font-weight: 600;
          font-size: 13px;
          flex: 1;
        }
        .license-count {
          font-size: 11px;
          color: #f59e0b;
          font-weight: 500;
        }
        .license-suppliers {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .license-supplier {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          padding-left: 28px;
          cursor: pointer;
        }
        .days-badge {
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
        }
        .badge-critical {
          background: #fee2e2;
          color: #dc2626;
        }
        .badge-warning {
          background: #fed7aa;
          color: #ea580c;
        }
        .badge-upcoming {
          background: #fef3c7;
          color: #d97706;
        }
        .badge-valid {
          background: #d1fae5;
          color: #059669;
        }
        .badge-secondary {
          background: #f3f4f6;
          color: #6b7280;
        }
        .badge-expired {
          background: #fecaca;
          color: #dc2626;
        }
        .empty-licenses {
          text-align: center;
          padding: 20px;
          color: #10b981;
          font-size: 13px;
        }

        /* Actions Grid */
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          border: none;
        }
        .action-btn.danger {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        .action-btn.warning {
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fde68a;
        }
        .action-btn.info {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }
        .action-btn.primary {
          background: #3b82f6;
          color: white;
        }

        /* Suppliers List */
        .suppliers-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .supplier-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .supplier-row:hover {
          background: #f3f4f6;
          transform: translateX(2px);
        }
        .supplier-avatar {
          width: 40px;
          height: 40px;
          background: #3b82f6;
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
        }
        .supplier-details {
          flex: 1;
        }
        .supplier-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }
        .supplier-name-row strong {
          font-size: 13px;
        }
        .status-badge {
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 500;
        }
        .supplier-meta {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: #9ca3af;
        }
        .compliance-reason {
          font-size: 10px;
          color: #6b7280;
          margin-top: 4px;
        }
        .days-indicator {
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }
        .empty-state {
          text-align: center;
          padding: 30px;
          color: #9ca3af;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .expiry-days-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .expiry-days-grid {
            grid-template-columns: 1fr;
          }
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default SupplierDashboardCSR;
