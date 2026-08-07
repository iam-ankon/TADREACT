import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  ArrowLeft,
  Users,
  Building2,
  Edit,
  Trash2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShoppingBag,
  DollarSign,
  Package,
  Star,
  MailOpen,
  PhoneCall,
  MapPinned,
  FileCheck,
  ExternalLink,
  Download,
  Printer,
  Share2,
  MoreVertical
} from "lucide-react";

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [buyers, setBuyers] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [ordersError, setOrdersError] = useState(false);

  const API_URL = "http://119.148.51.38:8000/api/merchandiser/api/customer/";
  const BUYER_URL = "http://119.148.51.38:8000/api/merchandiser/api/buyer/";
  const INQUIRY_URL = "http://119.148.51.38:8000/api/merchandiser/api/inquiry/";
  const ORDER_URL = "http://119.148.51.38:8000/api/merchandiser/api/orders/";

  // Get auth token from localStorage if you have one
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  };

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setOrdersError(false);
      
      try {
        // First, fetch customer and buyers (these might not require auth)
        const [customerRes, buyersRes] = await Promise.all([
          axios.get(`${API_URL}${id}/`),
          axios.get(BUYER_URL)
        ]);
        
        setCustomer(customerRes.data);
        
        // Process buyers data
        let buyersData = [];
        if (Array.isArray(buyersRes.data)) {
          buyersData = buyersRes.data;
        } else if (buyersRes.data && Array.isArray(buyersRes.data.results)) {
          buyersData = buyersRes.data.results;
        }
        setBuyers(buyersData);
        
        // Fetch inquiries and orders with error handling
        let inquiriesData = [];
        let ordersData = [];
        
        // Try to fetch inquiries
        try {
          const inquiriesRes = await axios.get(INQUIRY_URL, {
            headers: getAuthHeaders()
          });
          
          if (Array.isArray(inquiriesRes.data)) {
            inquiriesData = inquiriesRes.data;
          } else if (inquiriesRes.data && Array.isArray(inquiriesRes.data.results)) {
            inquiriesData = inquiriesRes.data.results;
          }
          
          // Filter inquiries for this customer
          const customerInquiries = inquiriesData.filter(inq => inq.customer === parseInt(id));
          setInquiries(customerInquiries);
          
        } catch (inquiryErr) {
          console.error("Failed to fetch inquiries:", inquiryErr);
          setInquiries([]);
        }
        
        // Try to fetch orders (might require auth)
        try {
          const ordersRes = await axios.get(ORDER_URL, {
            headers: getAuthHeaders(),
            timeout: 10000 // 10 second timeout
          });
          
          if (Array.isArray(ordersRes.data)) {
            ordersData = ordersRes.data;
          } else if (ordersRes.data && Array.isArray(ordersRes.data.results)) {
            ordersData = ordersRes.data.results;
          } else if (ordersRes.data && Array.isArray(ordersRes.data.data)) {
            ordersData = ordersRes.data.data;
          }
          
          // Filter orders for this customer
          const customerOrders = ordersData.filter(order => order.customer === parseInt(id));
          setOrders(customerOrders);
          
        } catch (orderErr) {
          console.error("Failed to fetch orders:", orderErr);
          // Check if it's an authentication error
          if (orderErr.response && orderErr.response.status === 401) {
            setOrdersError(true);
            console.log("Orders API requires authentication. Please log in.");
          }
          setOrders([]);
        }
        
      } catch (err) {
        console.error("Failed to load details", err);
        if (err.response && err.response.status === 404) {
          setCustomer(null);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}${id}/`);
      navigate("/customers");
    } catch (err) {
      console.error("Failed to delete customer", err);
      alert("Failed to delete customer. Please try again.");
    }
  };

  const getCustomerDisplayName = () => {
    if (!customer) return "Loading...";
    return customer.customer_name || customer.hrms_customer_name || 
           (customer.name && customer.name.customer_name) || "Unnamed Customer";
  };

  const getInitials = () => {
    const name = getCustomerDisplayName();
    if (!name || name === "Unnamed Customer") return "U";
    return name.charAt(0).toUpperCase();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'confirmed': { color: '#10b981', bg: '#d1fae5', icon: CheckCircle, label: 'Confirmed' },
      'pending': { color: '#f59e0b', bg: '#fef3c7', icon: Clock, label: 'Pending' },
      'quoted': { color: '#3b82f6', bg: '#dbeafe', icon: FileCheck, label: 'Quoted' },
      'shipped': { color: '#8b5cf6', bg: '#ede9fe', icon: Package, label: 'Shipped' },
      'cancelled': { color: '#ef4444', bg: '#fee2e2', icon: XCircle, label: 'Cancelled' }
    };
    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.25rem 0.75rem", backgroundColor: config.bg, color: config.color, borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "600" }}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Calculate statistics
  const stats = {
    totalInquiries: inquiries.length,
    totalOrders: orders.length,
    totalOrderValue: orders.reduce((sum, order) => sum + (order.total_value || 0), 0),
    totalOrderQuantity: orders.reduce((sum, order) => sum + (order.total_qty || 0), 0),
    confirmedInquiries: inquiries.filter(i => i.current_status === 'confirmed').length,
    shippedOrders: orders.filter(o => o.status === 'Shipped').length
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
        <Sidebar />
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div className="spinner-large"></div>
            <p style={{ marginTop: "1rem", color: "#6b7280" }}>Loading customer details...</p>
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

  if (!customer) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
        <Sidebar />
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ textAlign: "center", backgroundColor: "white", padding: "2rem", borderRadius: "1rem", maxWidth: "400px" }}>
            <AlertCircle size={48} style={{ color: "#ef4444", marginBottom: "1rem" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>Customer Not Found</h3>
            <p style={{ color: "#6b7280", marginBottom: "1rem" }}>The customer you're looking for doesn't exist or has been deleted.</p>
            <button onClick={() => navigate("/customers")} style={{ padding: "0.5rem 1rem", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}>
              Back to Customers
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = getCustomerDisplayName();
  const initials = getInitials();
  const customerBuyers = customer.buyers || [];
  const buyerNames = customerBuyers.map(bid => {
    const buyer = buyers.find(b => b.id === bid);
    return buyer ? buyer.name : "";
  }).filter(Boolean);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      <Sidebar />
      
      <div style={{ flex: 1, padding: "2rem", overflow: "auto", maxHeight: "100vh" }}>
        {/* Header with Navigation */}
        <div style={{ marginBottom: "2rem" }}>
          <button
            onClick={() => navigate("/customers")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              color: "#4b5563",
              marginBottom: "1rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f9fafb"; e.currentTarget.style.borderColor = "#d1d5db"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
          >
            <ArrowLeft size={16} />
            Back to Customers
          </button>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "2rem",
                }}
              >
                {initials}
              </div>
              <div>
                <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#1f2937", marginBottom: "0.25rem" }}>
                  {displayName}
                </h1>
                {customer.customer_code && (
                  <p style={{ color: "#6b7280", fontFamily: "monospace", fontSize: "0.875rem" }}>
                    Code: {customer.customer_code}
                  </p>
                )}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {customer.email && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "#6b7280" }}>
                      <CheckCircle size={12} color="#10b981" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "0.75rem", position: "relative" }}>
              <button
                onClick={() => navigate(`/edit-customer/${customer.id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontWeight: "500",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#3b82f6"}
              >
                <Edit size={16} />
                Edit Customer
              </button>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "white",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontWeight: "500",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fee2e2"; e.currentTarget.style.borderColor = "#dc2626"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.borderColor = "#fecaca"; }}
              >
                <Trash2 size={16} />
                Delete
              </button>
              
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "38px",
                    height: "38px",
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  <MoreVertical size={16} style={{ color: "#6b7280" }} />
                </button>
                
                {showMoreMenu && (
                  <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "0.5rem", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "0.5rem", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 10, minWidth: "200px" }}>
                    <button onClick={() => { window.print(); setShowMoreMenu(false); }} style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", padding: "0.75rem 1rem", border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: "0.875rem" }}>
                      <Printer size={14} /> Print Details
                    </button>
                    <button onClick={() => { setShowMoreMenu(false); }} style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", padding: "0.75rem 1rem", border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: "0.875rem" }}>
                      <Download size={14} /> Export Data
                    </button>
                    <button onClick={() => { setShowMoreMenu(false); }} style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", padding: "0.75rem 1rem", border: "none", backgroundColor: "transparent", cursor: "pointer", fontSize: "0.875rem" }}>
                      <Share2 size={14} /> Share
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ backgroundColor: "white", borderRadius: "1rem", padding: "1.5rem", maxWidth: "400px", width: "90%" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.5rem" }}>Delete Customer?</h3>
              <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
                Are you sure you want to delete "{displayName}"? This action cannot be undone and will also remove from HRMS.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: "0.5rem 1rem", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "0.5rem", cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleDelete} style={{ padding: "0.5rem 1rem", backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}>
                  Delete Customer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{ background: "white", borderRadius: "0.75rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <ShoppingBag size={20} style={{ color: "#3b82f6" }} />
              <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" }}>{stats.totalInquiries}</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>Total Inquiries</p>
          </div>
          
          <div style={{ background: "white", borderRadius: "0.75rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <Package size={20} style={{ color: "#10b981" }} />
              <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" }}>{stats.totalOrders}</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>Total Orders</p>
          </div>
          
          <div style={{ background: "white", borderRadius: "0.75rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <DollarSign size={20} style={{ color: "#f59e0b" }} />
              <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" }}>{formatCurrency(stats.totalOrderValue)}</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>Total Order Value</p>
          </div>
          
          <div style={{ background: "white", borderRadius: "0.75rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <Star size={20} style={{ color: "#8b5cf6" }} />
              <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" }}>{stats.confirmedInquiries}</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>Confirmed Inquiries</p>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div style={{ background: "white", borderRadius: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          {/* Tab Headers */}
          <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", background: "#f9fafb", flexWrap: "wrap" }}>
            {[
              { id: "overview", label: "Overview", icon: User },
              { id: "inquiries", label: `Inquiries (${inquiries.length})`, icon: FileText },
              { id: "orders", label: `Orders (${orders.length})`, icon: Package },
              { id: "buyers", label: `Buyers (${buyerNames.length})`, icon: Building2 }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "1rem 1.5rem",
                    backgroundColor: activeTab === tab.id ? "white" : "transparent",
                    border: "none",
                    borderBottom: activeTab === tab.id ? "2px solid #3b82f6" : "2px solid transparent",
                    cursor: "pointer",
                    fontWeight: activeTab === tab.id ? "600" : "500",
                    color: activeTab === tab.id ? "#3b82f6" : "#6b7280",
                    transition: "all 0.2s",
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div style={{ padding: "1.5rem" }}>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                  {/* Contact Information */}
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <MailOpen size={18} style={{ color: "#3b82f6" }} />
                      Contact Information
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {customer.email && (
                        <div>
                          <label style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem", display: "block" }}>Email Address</label>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Mail size={14} style={{ color: "#3b82f6" }} />
                            <a href={`mailto:${customer.email}`} style={{ color: "#3b82f6", textDecoration: "none" }}>{customer.email}</a>
                          </div>
                        </div>
                      )}
                      {customer.phone && (
                        <div>
                          <label style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem", display: "block" }}>Phone Number</label>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <PhoneCall size={14} style={{ color: "#10b981" }} />
                            <a href={`tel:${customer.phone}`} style={{ color: "#374151", textDecoration: "none" }}>{customer.phone}</a>
                          </div>
                        </div>
                      )}
                      {customer.address && (
                        <div>
                          <label style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem", display: "block" }}>Address</label>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                            <MapPinned size={14} style={{ color: "#f59e0b", marginTop: "0.125rem" }} />
                            <span style={{ color: "#4b5563" }}>{customer.address}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* HRMS Sync Status */}
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <ExternalLink size={18} style={{ color: "#8b5cf6" }} />
                      HRMS Integration
                    </h3>
                    <div style={{ padding: "1rem", backgroundColor: "#f0fdf4", borderRadius: "0.5rem", border: "1px solid #bbf7d0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <CheckCircle size={16} style={{ color: "#10b981" }} />
                        <span style={{ fontWeight: "600", color: "#166534" }}>Synced with HRMS</span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "#166534", margin: 0 }}>
                        This customer is linked to HRMS and will automatically sync when updated.
                      </p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {customer.remarks && (
                    <div style={{ gridColumn: "span 2" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <FileText size={18} style={{ color: "#6b7280" }} />
                        Additional Notes
                      </h3>
                      <div style={{ padding: "1rem", backgroundColor: "#f9fafb", borderRadius: "0.5rem" }}>
                        <p style={{ color: "#4b5563", margin: 0, lineHeight: "1.5" }}>{customer.remarks}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Inquiries Tab */}
            {activeTab === "inquiries" && (
              <div>
                {inquiries.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem" }}>
                    <FileText size={48} style={{ color: "#d1d5db", marginBottom: "1rem" }} />
                    <p style={{ color: "#6b7280" }}>No inquiries found for this customer.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <th style={{ textAlign: "left", padding: "0.75rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280" }}>Inquiry No</th>
                          <th style={{ textAlign: "left", padding: "0.75rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280" }}>Item</th>
                          <th style={{ textAlign: "left", padding: "0.75rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280" }}>Quantity</th>
                          <th style={{ textAlign: "left", padding: "0.75rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280" }}>Status</th>
                          <th style={{ textAlign: "left", padding: "0.75rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280" }}>Received Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inquiries.map((inquiry) => (
                          <tr key={inquiry.id} style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer" }} onClick={() => navigate(`/inquiry/${inquiry.id}`)}>
                            <td style={{ padding: "0.75rem", color: "#3b82f6", fontWeight: "500" }}>{inquiry.inquiry_no || `INQ-${inquiry.id}`}</td>
                            <td style={{ padding: "0.75rem", color: "#374151" }}>{inquiry.item?.item || "N/A"}</td>
                            <td style={{ padding: "0.75rem", color: "#374151" }}>{formatNumber(inquiry.order_quantity)}</td>
                            <td style={{ padding: "0.75rem" }}>{getStatusBadge(inquiry.current_status)}</td>
                            <td style={{ padding: "0.75rem", color: "#6b7280" }}>{formatDate(inquiry.received_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div>
                {ordersError ? (
                  <div style={{ textAlign: "center", padding: "3rem", backgroundColor: "#fef2f2", borderRadius: "0.5rem", margin: "1rem" }}>
                    <AlertCircle size={48} style={{ color: "#dc2626", marginBottom: "1rem" }} />
                    <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#991b1b", marginBottom: "0.5rem" }}>Authentication Required</h3>
                    <p style={{ color: "#7f1d1d", fontSize: "0.875rem", marginBottom: "1rem" }}>
                      The orders API requires authentication. Please log in to view order history.
                    </p>
                    <button 
                      onClick={() => window.location.href = '/login'} 
                      style={{ padding: "0.5rem 1rem", backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}
                    >
                      Go to Login
                    </button>
                  </div>
                ) : orders.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem" }}>
                    <Package size={48} style={{ color: "#d1d5db", marginBottom: "1rem" }} />
                    <p style={{ color: "#6b7280" }}>No orders found for this customer.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <th style={{ textAlign: "left", padding: "0.75rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280" }}>PO Number</th>
                          <th style={{ textAlign: "left", padding: "0.75rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280" }}>Style</th>
                          <th style={{ textAlign: "left", padding: "0.75rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280" }}>Quantity</th>
                          <th style={{ textAlign: "left", padding: "0.75rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280" }}>Value</th>
                          <th style={{ textAlign: "left", padding: "0.75rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280" }}>Status</th>
                          <th style={{ textAlign: "left", padding: "0.75rem", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280" }}>Shipment Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer" }} onClick={() => navigate(`/orders/${order.id}`)}>
                            <td style={{ padding: "0.75rem", color: "#3b82f6", fontWeight: "500" }}>{order.po_no || `PO-${order.id}`}</td>
                            <td style={{ padding: "0.75rem", color: "#374151" }}>{order.style || "N/A"}</td>
                            <td style={{ padding: "0.75rem", color: "#374151" }}>{formatNumber(order.total_qty)}</td>
                            <td style={{ padding: "0.75rem", color: "#f59e0b", fontWeight: "500" }}>{formatCurrency(order.total_value)}</td>
                            <td style={{ padding: "0.75rem" }}>{getStatusBadge(order.status)}</td>
                            <td style={{ padding: "0.75rem", color: "#6b7280" }}>{formatDate(order.shipment_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Buyers Tab */}
            {activeTab === "buyers" && (
              <div>
                {buyerNames.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem" }}>
                    <Building2 size={48} style={{ color: "#d1d5db", marginBottom: "1rem" }} />
                    <p style={{ color: "#6b7280" }}>No buyers associated with this customer.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                    {buyerNames.map((name, idx) => (
                      <div key={idx} style={{ padding: "1rem", backgroundColor: "#f9fafb", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <Building2 size={20} style={{ color: "#8b5cf6" }} />
                        <span style={{ fontWeight: "500", color: "#374151" }}>{name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}