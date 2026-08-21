// TNAForm.jsx - Complete Fixed Version
import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";

const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const api = axios.create({
  baseURL: "http://119.148.51.38:8000/api/merchandiser/api/"
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Searchable Select Component
const SearchableSelect = ({ options, value, onChange, placeholder, label, required }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(option => 
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={searchableStyles.container} ref={dropdownRef}>
      <label style={searchableStyles.label}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <div style={searchableStyles.selectWrapper}>
        <div 
          style={searchableStyles.selectTrigger}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span style={searchableStyles.selectedValue}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg style={searchableStyles.arrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {isOpen && (
          <div style={searchableStyles.dropdown}>
            <div style={searchableStyles.searchWrapper}>
              <svg style={searchableStyles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={searchableStyles.searchInput}
                autoFocus
              />
            </div>
            <div style={searchableStyles.optionsList}>
              {filteredOptions.length === 0 ? (
                <div style={searchableStyles.noResults}>No orders found</div>
              ) : (
                filteredOptions.map(option => (
                  <div
                    key={option.value}
                    style={{
                      ...searchableStyles.option,
                      ...(value === option.value ? searchableStyles.optionSelected : {})
                    }}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    <div style={searchableStyles.optionPrimary}>{option.label}</div>
                    {option.subLabel && (
                      <div style={searchableStyles.optionSub}>{option.subLabel}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const searchableStyles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
    position: "relative",
  },
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#34495e",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  selectWrapper: {
    position: "relative",
  },
  selectTrigger: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    backgroundColor: "white",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  selectedValue: {
    color: "#1a2a3a",
  },
  arrow: {
    width: "16px",
    height: "16px",
    color: "#94a3b8",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: "8px",
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
    zIndex: 1000,
    overflow: "hidden",
  },
  searchWrapper: {
    position: "relative",
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
  },
  searchIcon: {
    position: "absolute",
    left: "20px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
  },
  searchInput: {
    width: "100%",
    padding: "10px 12px 10px 32px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    outline: "none",
  },
  optionsList: {
    maxHeight: "250px",
    overflowY: "auto",
  },
  option: {
    padding: "12px 16px",
    cursor: "pointer",
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.2s",
  },
  optionSelected: {
    backgroundColor: "#eef2ff",
  },
  optionPrimary: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#1a2a3a",
  },
  optionSub: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "4px",
  },
  noResults: {
    padding: "20px",
    textAlign: "center",
    fontSize: "13px",
    color: "#94a3b8",
  },
};

// Date Picker Component
const DatePicker = ({ label, value, onChange, placeholder, hint, required, readOnly = false }) => {
  const [showPicker, setShowPicker] = useState(false);
  const containerRef = useRef(null);
  const pickerRef = useRef(null);

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleDateSelect = (e) => {
    const selectedDate = e.target.value;
    onChange(selectedDate);
    setShowPicker(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showPicker && pickerRef.current) {
      const picker = pickerRef.current;
      const rect = picker.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      if (rect.bottom > viewportHeight) {
        picker.style.top = 'auto';
        picker.style.bottom = '100%';
      } else {
        picker.style.top = 'calc(100% + 8px)';
        picker.style.bottom = 'auto';
      }
    }
  }, [showPicker]);

  return (
    <div style={datePickerStyles.container} ref={containerRef}>
      <label style={datePickerStyles.label}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <div style={datePickerStyles.inputWrapper}>
        <input
          type="text"
          value={formatDisplayDate(value)}
          onClick={() => !readOnly && setShowPicker(!showPicker)}
          readOnly
          placeholder={placeholder || "Select date"}
          style={{
            ...datePickerStyles.displayInput,
            ...(readOnly ? datePickerStyles.readOnlyInput : {}),
            cursor: readOnly ? 'not-allowed' : 'pointer',
            backgroundColor: readOnly ? '#f8fafc' : 'white'
          }}
        />
        {!readOnly && (
          <button 
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            style={datePickerStyles.calendarBtn}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </button>
        )}
      </div>
      {showPicker && !readOnly && (
        <div ref={pickerRef} style={datePickerStyles.picker}>
          <input
            type="date"
            value={value}
            onChange={handleDateSelect}
            style={datePickerStyles.dateInput}
            autoFocus
          />
          <button 
            type="button"
            onClick={() => setShowPicker(false)}
            style={datePickerStyles.closeBtn}
          >
            Close
          </button>
        </div>
      )}
      {hint && <div style={datePickerStyles.hint}>{hint}</div>}
    </div>
  );
};

const datePickerStyles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
    position: "relative",
  },
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#34495e",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  inputWrapper: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  displayInput: {
    flex: 1,
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    backgroundColor: "white",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  readOnlyInput: {
    backgroundColor: "#f8fafc",
    color: "#64748b",
  },
  calendarBtn: {
    padding: "12px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  picker: {
    position: "absolute",
    zIndex: 9999,
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minWidth: "280px",
  },
  dateInput: {
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
  },
  closeBtn: {
    padding: "10px 16px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    color: "#475569",
    transition: "all 0.2s",
  },
  hint: {
    fontSize: "11px",
    color: "#8b5cf6",
    marginTop: "6px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
};

export default function TNAForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  
  const [daysToShipment, setDaysToShipment] = useState(null);
  // True while fetchTNA() is populating formData from the server — prevents
  // the calculation useEffect from immediately overwriting the server's values.
  const isLoadingData = useRef(false);

  const [formData, setFormData] = useState({
    order: null,
    order_number: "",
    supplier: "",
    gender: "",
    item: "",
    wgr: "",
    fabrication: "",
    size_range: "",
    total_qty: "",
    fabric_type: "local",
    fabric_supplier: "",
    shipment_date: "",
    order_booking_date: "",
    // Auto-calculated fields (read-only in UI)
    fabric_approved_date: "",
    fabric_booking_date: "",
    fabric_lc_date: "",
    fabric_etd: "",
    fabric_eta: "",
    fabric_inhouse_date: "",
    lab_dip_date: "",
    fit_sample_date: "",
    pps_date: "",
    ps_date: "",
    production_start_date: "",
    test_samples_date: "",
    remarks: "",
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (id) {
      fetchTNA();
    }
  }, [id]);

  // Auto-calculate dates whenever order_booking_date, shipment_date, or fabric_type changes.
  // Skip only the very first trigger caused by fetchTNA() loading server data (isLoadingData ref).
  // Every subsequent user change — including in edit mode — will recalculate normally.
  useEffect(() => {
    if (isLoadingData.current) {
      // This fire was triggered by fetchTNA() populating the form — skip recalculation
      // so we don't overwrite the server's already-calculated values on load.
      isLoadingData.current = false;
      calculateDaysToShipment();
      return;
    }
    calculateAllDates();
    calculateDaysToShipment();
  }, [formData.order_booking_date, formData.shipment_date, formData.fabric_type]);

  const calculateAllDates = () => {
    const newDates = { ...formData };
    
    // Only calculate if we have the required fields
    if (!formData.order_booking_date || !formData.shipment_date || !formData.fabric_type) {
      return;
    }
    
    // 1. Fabric Booking Date = Order Booking Date + 5 days
    if (formData.order_booking_date) {
      const bookingDate = new Date(formData.order_booking_date);
      bookingDate.setDate(bookingDate.getDate() + 5);
      newDates.fabric_booking_date = bookingDate.toISOString().split('T')[0];
    }
    
    // 2. Fabric LC = Fabric Booking Date + 10 days
    if (newDates.fabric_booking_date) {
      const lcDate = new Date(newDates.fabric_booking_date);
      lcDate.setDate(lcDate.getDate() + 10);
      newDates.fabric_lc_date = lcDate.toISOString().split('T')[0];
    }
    
    // 3. Fabric Approved Date (based on shipment date and fabric type)
    if (formData.shipment_date) {
      const approvedDate = new Date(formData.shipment_date);
      if (formData.fabric_type === 'imported') {
        approvedDate.setDate(approvedDate.getDate() - 120);
      } else {
        approvedDate.setDate(approvedDate.getDate() - 90);
      }
      newDates.fabric_approved_date = approvedDate.toISOString().split('T')[0];
    }
    
    // 4. Fabric ETD based on fabric type
    if (newDates.fabric_booking_date) {
      const etdDate = new Date(newDates.fabric_booking_date);
      if (formData.fabric_type === 'imported') {
        etdDate.setDate(etdDate.getDate() + 55);
      } else {
        etdDate.setDate(etdDate.getDate() + 25);
      }
      newDates.fabric_etd = etdDate.toISOString().split('T')[0];
    }
    
    // 5. Fabric ETA based on fabric type
    if (newDates.fabric_etd) {
      const etaDate = new Date(newDates.fabric_etd);
      if (formData.fabric_type === 'imported') {
        etaDate.setDate(etaDate.getDate() + 25);
      } else {
        etaDate.setDate(etaDate.getDate() + 10);
      }
      newDates.fabric_eta = etaDate.toISOString().split('T')[0];
    }
    
    // 6. Fabric Inhouse = Fabric ETA + 10 days
    if (newDates.fabric_eta) {
      const inhouseDate = new Date(newDates.fabric_eta);
      inhouseDate.setDate(inhouseDate.getDate() + 10);
      newDates.fabric_inhouse_date = inhouseDate.toISOString().split('T')[0];
    }
    
    // 7. Lab Dip & Fit Sample = Order Booking Date + 15 days
    if (formData.order_booking_date) {
      const sampleDate = new Date(formData.order_booking_date);
      sampleDate.setDate(sampleDate.getDate() + 15);
      newDates.lab_dip_date = sampleDate.toISOString().split('T')[0];
      newDates.fit_sample_date = sampleDate.toISOString().split('T')[0];
    }
    
    // 8. PPS = Fabric Booking Date + 20 days
    if (newDates.fabric_booking_date) {
      const ppsDate = new Date(newDates.fabric_booking_date);
      ppsDate.setDate(ppsDate.getDate() + 20);
      newDates.pps_date = ppsDate.toISOString().split('T')[0];
    }
    
    // 9. Production Start = Fabric Inhouse + 10 days
    if (newDates.fabric_inhouse_date) {
      const prodStart = new Date(newDates.fabric_inhouse_date);
      prodStart.setDate(prodStart.getDate() + 10);
      newDates.production_start_date = prodStart.toISOString().split('T')[0];
    }
    
    // 10. PS = Production Start + 10 days
    if (newDates.production_start_date) {
      const psDate = new Date(newDates.production_start_date);
      psDate.setDate(psDate.getDate() + 10);
      newDates.ps_date = psDate.toISOString().split('T')[0];
      
      // 11. Test Samples = Production Start - 10 days
      const testDate = new Date(newDates.production_start_date);
      testDate.setDate(testDate.getDate() - 10);
      newDates.test_samples_date = testDate.toISOString().split('T')[0];
    }
    
    setFormData(prev => ({ ...prev, ...newDates }));
  };

  const calculateDaysToShipment = () => {
    if (formData.shipment_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const shipment = new Date(formData.shipment_date);
      const diffTime = shipment - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysToShipment(diffDays);
    } else {
      setDaysToShipment(null);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const response = await api.get("orders/", { 
        params: { page_size: 1000, ordering: "-created_at" } 
      });
      const ordersData = response.data.results || response.data || [];
      
      const formattedOrders = ordersData.map(order => ({
        value: order.id,
        label: `${order.pdm_no || order.po_no || `Order ${order.id}`} - ${order.style || "No Style"}`,
        subLabel: `Customer: ${order.customer_display || "N/A"} | Qty: ${order.total_qty || 0}`,
        orderData: order
      }));
      
      setOrders(formattedOrders);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchTNA = async () => {
    setLoading(true);
    try {
      const response = await api.get(`tna/${id}/`);
      const data = response.data;

      // Signal the calculation useEffect to skip this setState (server data is already calculated)
      isLoadingData.current = true;
      setFormData({
        order: data.order?.id || null,
        order_number: data.order_number || "",
        supplier: data.supplier || "",
        gender: data.gender || "",
        item: data.item || "",
        wgr: data.wgr || "",
        fabrication: data.fabrication || "",
        size_range: data.size_range || "",
        total_qty: data.total_qty || "",
        fabric_type: data.fabric_type || "local",
        fabric_supplier: data.fabric_supplier || "",
        shipment_date: data.shipment_date || "",
        order_booking_date: data.order_booking_date || "",
        fabric_approved_date: data.fabric_approved_date || "",
        fabric_booking_date: data.fabric_booking_date || "",
        fabric_lc_date: data.fabric_lc_date || "",
        fabric_etd: data.fabric_etd || "",
        fabric_eta: data.fabric_eta || "",
        fabric_inhouse_date: data.fabric_inhouse_date || "",
        lab_dip_date: data.lab_dip_date || "",
        fit_sample_date: data.fit_sample_date || "",
        pps_date: data.pps_date || "",
        ps_date: data.ps_date || "",
        test_samples_date: data.test_samples_date || "",
        production_start_date: data.production_start_date || "",
        remarks: data.remarks || "",
      });
      
      if (data.execution_time !== undefined) setDaysToShipment(data.execution_time);
      
    } catch (err) {
      console.error("Error fetching TNA:", err);
      alert("Failed to load TNA data");
    } finally {
      setLoading(false);
    }
  };

  const formatDateWithMonthName = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleDateChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOrderSelect = async (orderId) => {
    if (!orderId) {
      setFormData(prev => ({ ...prev, order: null }));
      return;
    }
    
    try {
      const response = await api.get(`orders/${orderId}/`);
      const order = response.data;
      
      setFormData(prev => ({
        ...prev,
        order: orderId,
        order_number: order.style || "",
        supplier: order.supplier_display || order.supplier_name || "",
        gender: order.gender || "",
        item: order.item || "",
        fabrication: order.fabrication || "",
        size_range: order.size_range || "",
        total_qty: order.total_qty || "",
        shipment_date: order.shipment_date || "",
      }));
    } catch (err) {
      console.error("Error fetching order details:", err);
      alert("Failed to fetch order details");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Validate required fields
      if (!formData.order_booking_date) {
        alert("Order Booking Date is required");
        setSaving(false);
        return;
      }
      if (!formData.shipment_date) {
        alert("Shipment Date is required");
        setSaving(false);
        return;
      }
      if (!formData.fabric_type) {
        alert("Fabric Type is required");
        setSaving(false);
        return;
      }
      
      // Prepare data to send - ONLY send input fields, NOT auto-calculated ones
      const dataToSend = {
        order_number: formData.order_number,
        supplier: formData.supplier,
        gender: formData.gender,
        item: formData.item,
        wgr: formData.wgr,
        fabrication: formData.fabrication,
        size_range: formData.size_range,
        total_qty: formData.total_qty,
        fabric_type: formData.fabric_type,
        fabric_supplier: formData.fabric_supplier,
        shipment_date: formData.shipment_date,
        order_booking_date: formData.order_booking_date,
        remarks: formData.remarks,
      };
      
      // Only add order if it exists
      if (formData.order) {
        dataToSend.order = formData.order;
      }
      
      if (id) {
        await api.put(`tna/${id}/`, dataToSend);
        alert("TNA updated successfully!");
      } else {
        await api.post("tna/", dataToSend);
        alert("TNA created successfully!");
      }
      
      navigate("/orders/tna");
    } catch (err) {
      console.error("Error saving TNA:", err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.response?.data?.detail ||
                          "Failed to save TNA";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSyncFromOrder = async () => {
    const orderId = formData.order;
    if (!orderId) {
      alert("Please select an order first");
      return;
    }
    
    try {
      await api.post(`tna/sync-from-order/${orderId}/`);
      await fetchTNA();
      alert("TNA synced successfully from order!");
    } catch (err) {
      console.error("Error syncing from order:", err);
      alert("Failed to sync from order");
    }
  };

  const clearForm = () => {
    if (window.confirm("Are you sure you want to clear all form data?")) {
      setFormData({
        order: null,
        order_number: "",
        supplier: "",
        gender: "",
        item: "",
        wgr: "",
        fabrication: "",
        size_range: "",
        total_qty: "",
        fabric_type: "local",
        fabric_supplier: "",
        shipment_date: "",
        order_booking_date: "",
        fabric_approved_date: "",
        fabric_booking_date: "",
        fabric_lc_date: "",
        fabric_etd: "",
        fabric_eta: "",
        fabric_inhouse_date: "",
        lab_dip_date: "",
        fit_sample_date: "",
        pps_date: "",
        ps_date: "",
        test_samples_date: "",
        production_start_date: "",
        remarks: "",
      });
      setDaysToShipment(null);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading TNA data...</p>
        </div>
      </div>
    );
  }

  const genderOptions = [
    { value: "", label: "Select Gender" },
    { value: "Mens", label: "Mens" },
    { value: "Ladies", label: "Ladies" },
    { value: "Boys", label: "Boys" },
    { value: "Girls", label: "Girls" },
    { value: "Unisex", label: "Unisex" },
  ];

  const getDaysColor = () => {
    if (daysToShipment === null) return "#64748b";
    if (daysToShipment < 0) return "#ef4444";
    if (daysToShipment < 15) return "#f59e0b";
    return "#10b981";
  };

  const getDaysBackground = () => {
    if (daysToShipment === null) return "#f1f5f9";
    if (daysToShipment < 0) return "#fef2f2";
    if (daysToShipment < 15) return "#fffbeb";
    return "#f0fdf4";
  };

  const getDaysDisplayText = () => {
    if (daysToShipment === null) return "—";
    if (daysToShipment < 0) return `${Math.abs(daysToShipment)} days overdue`;
    if (daysToShipment === 0) return "Today";
    if (daysToShipment === 1) return "1 day remaining";
    return `${daysToShipment} days remaining`;
  };

  const getEtdFormula = () => {
    return formData.fabric_type === 'imported' 
      ? '= Fabric Booking Date + 55 days' 
      : '= Fabric Booking Date + 25 days';
  };

  const getEtaFormula = () => {
    return formData.fabric_type === 'imported' 
      ? '= Fabric ETD + 25 days' 
      : '= Fabric ETD + 10 days';
  };

  const getApprovedFormula = () => {
    return formData.fabric_type === 'imported' 
      ? '= Shipment Date - 120 days' 
      : '= Shipment Date - 90 days';
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerLeft}>
              <div style={styles.headerIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                  <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path>
                </svg>
              </div>
              <div>
                <h1 style={styles.headerTitle}>
                  {id ? "Edit TNA Record" : "Create New TNA Record"}
                </h1>
                <p style={styles.headerSubtitle}>
                  Time & Action calendar with auto-calculated dates based on fabric type
                </p>
              </div>
            </div>
            <div style={styles.headerActions}>
              <Link to="/orders/tna" style={styles.btnSecondary}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back
              </Link>
              {id && (
                <button onClick={handleSyncFromOrder} style={styles.btnSync}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  Sync
                </button>
              )}
              <button onClick={clearForm} style={styles.btnClear} type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
            <div style={{ ...styles.kpiIcon, background: '#eef2ff' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div style={styles.kpiInfo}>
              <span style={{ ...styles.kpiValue, color: getDaysColor() }}>{getDaysDisplayText()}</span>
              <span style={styles.kpiLabel}>Days to Shipment</span>
            </div>
          </div>
          <div style={styles.kpiCard}>
            <div style={{ ...styles.kpiIcon, background: formData.fabric_type === 'imported' ? '#f3e8ff' : '#fef3c7' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={formData.fabric_type === 'imported' ? '#8b5cf6' : '#f59e0b'} strokeWidth="1.5">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <div style={styles.kpiInfo}>
              <span style={styles.kpiValue}>
                {formData.fabric_type === 'imported' ? '🌍 Imported' : '🏠 Local'}
              </span>
              <span style={styles.kpiLabel}>Fabric Type</span>
            </div>
          </div>
          <div style={styles.kpiCard}>
            <div style={{ ...styles.kpiIcon, background: '#e0f2fe' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div style={styles.kpiInfo}>
              <span style={styles.kpiValue}>{formatDateWithMonthName(formData.fabric_approved_date)}</span>
              <span style={styles.kpiLabel}>Fabric Approved Date</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* SECTION 1: BASIC ORDER INFORMATION */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionIcon}>📋</div>
              <h2 style={styles.sectionTitle}>Basic Order Information</h2>
              <div style={styles.sectionBadge}>Required</div>
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formGroupFull}>
                <SearchableSelect
                  options={orders}
                  value={formData.order}
                  onChange={handleOrderSelect}
                  placeholder="-- Search and Select Order --"
                  label="Link to Order (Optional)"
                />
                {ordersLoading && <div style={styles.loadingHint}>Loading orders...</div>}
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>PDM No / Order Number *</label>
                <input type="text" name="order_number" value={formData.order_number} onChange={handleChange} placeholder="Enter order number" style={styles.input} required />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Supplier</label>
                <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} placeholder="Enter supplier name" style={styles.input} />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} style={styles.select}>
                  {genderOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Item</label>
                <input type="text" name="item" value={formData.item} onChange={handleChange} placeholder="Enter item description" style={styles.input} />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>WGR</label>
                <input type="text" name="wgr" value={formData.wgr} onChange={handleChange} placeholder="Enter WGR number" style={styles.input} />
              </div>
              
              <div style={styles.formGroupFull}>
                <label style={styles.label}>Fabrication</label>
                <textarea name="fabrication" value={formData.fabrication} onChange={handleChange} placeholder="Enter fabrication details" style={styles.textarea} rows="2" />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Size Range</label>
                <input type="text" name="size_range" value={formData.size_range} onChange={handleChange} placeholder="e.g., S-XXL, 36-46" style={styles.input} />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Total Quantity</label>
                <input type="number" name="total_qty" value={formData.total_qty} onChange={handleChange} placeholder="Enter total quantity" style={styles.input} />
              </div>
            </div>
          </div>

          {/* SECTION 2: FABRIC INFORMATION */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionIcon}>🧵</div>
              <h2 style={styles.sectionTitle}>Fabric Information</h2>
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Fabric Type *</label>
                <div style={styles.fabricTypeGroup}>
                  <button
                    type="button"
                    onClick={() => handleChange({ target: { name: 'fabric_type', value: 'local' } })}
                    style={{
                      ...styles.fabricTypeBtn,
                      ...(formData.fabric_type === 'local' ? styles.fabricTypeBtnActive : {})
                    }}
                  >
                    🏠 Local Fabric
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange({ target: { name: 'fabric_type', value: 'imported' } })}
                    style={{
                      ...styles.fabricTypeBtn,
                      ...(formData.fabric_type === 'imported' ? styles.fabricTypeBtnActive : {})
                    }}
                  >
                    🌍 Imported Fabric
                  </button>
                </div>
                <div style={styles.fieldHint}>
                  {formData.fabric_type === 'imported' 
                    ? 'Imported: ETD +55 days, ETA +25 days, Approved -120 days' 
                    : 'Local: ETD +25 days, ETA +10 days, Approved -90 days'}
                </div>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Fabric Supplier</label>
                <input type="text" name="fabric_supplier" value={formData.fabric_supplier} onChange={handleChange} placeholder="Enter fabric supplier name" style={styles.input} />
              </div>
            </div>
          </div>

          {/* SECTION 3: INPUT DATES (User Input Only) */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionIcon}>📝</div>
              <h2 style={styles.sectionTitle}>Input Dates</h2>
              <div style={styles.sectionHint}>These are the only dates you need to enter</div>
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <DatePicker
                  label="Order Booking Date *"
                  value={formData.order_booking_date}
                  onChange={(val) => handleDateChange("order_booking_date", val)}
                  placeholder="Select order booking date"
                  hint="→ Calculates: Fabric Booking, Lab Dip, Fit Sample"
                  required={true}
                />
              </div>
              
              <div style={styles.formGroup}>
                <DatePicker
                  label="Shipment Date *"
                  value={formData.shipment_date}
                  onChange={(val) => handleDateChange("shipment_date", val)}
                  placeholder="Select shipment date"
                  hint="→ Calculates: Fabric Approved Date"
                  required={true}
                />
                {daysToShipment !== null && (
                  <div style={{ ...styles.kpiMini, background: getDaysBackground(), color: getDaysColor() }}>
                    {getDaysDisplayText()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: AUTO-CALCULATED DATES (Read Only) */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionIcon}>⚡</div>
              <h2 style={styles.sectionTitle}>Auto-Calculated Dates</h2>
              <div style={styles.sectionHint}>Generated automatically - Read Only</div>
            </div>
            <div style={styles.calculatedGrid}>
              <div style={styles.calculatedCard}>
                <div style={styles.calculatedIcon}>✅</div>
                <div>
                  <label style={styles.calculatedLabel}>Fabric Approved Date</label>
                  <div style={styles.calculatedValue}>{formatDateWithMonthName(formData.fabric_approved_date)}</div>
                  <div style={styles.formulaHint}>{getApprovedFormula()}</div>
                </div>
              </div>
              
              <div style={styles.calculatedCard}>
                <div style={styles.calculatedIcon}>📅</div>
                <div>
                  <label style={styles.calculatedLabel}>Fabric Booking Date</label>
                  <div style={styles.calculatedValue}>{formatDateWithMonthName(formData.fabric_booking_date)}</div>
                  <div style={styles.formulaHint}>= Order Booking Date + 5 days</div>
                </div>
              </div>
              
              <div style={styles.calculatedCard}>
                <div style={styles.calculatedIcon}>📄</div>
                <div>
                  <label style={styles.calculatedLabel}>Fabric LC Date</label>
                  <div style={styles.calculatedValue}>{formatDateWithMonthName(formData.fabric_lc_date)}</div>
                  <div style={styles.formulaHint}>= Fabric Booking Date + 10 days</div>
                </div>
              </div>
              
              <div style={styles.calculatedCard}>
                <div style={styles.calculatedIcon}>🚢</div>
                <div>
                  <label style={styles.calculatedLabel}>Fabric ETD</label>
                  <div style={styles.calculatedValue}>{formatDateWithMonthName(formData.fabric_etd)}</div>
                  <div style={styles.formulaHint}>{getEtdFormula()}</div>
                </div>
              </div>
              
              <div style={styles.calculatedCard}>
                <div style={styles.calculatedIcon}>📦</div>
                <div>
                  <label style={styles.calculatedLabel}>Fabric ETA</label>
                  <div style={styles.calculatedValue}>{formatDateWithMonthName(formData.fabric_eta)}</div>
                  <div style={styles.formulaHint}>{getEtaFormula()}</div>
                </div>
              </div>
              
              <div style={styles.calculatedCard}>
                <div style={styles.calculatedIcon}>🏭</div>
                <div>
                  <label style={styles.calculatedLabel}>Fabric Inhouse Date</label>
                  <div style={styles.calculatedValue}>{formatDateWithMonthName(formData.fabric_inhouse_date)}</div>
                  <div style={styles.formulaHint}>= Fabric ETA + 10 days</div>
                </div>
              </div>
              
              <div style={styles.calculatedCard}>
                <div style={styles.calculatedIcon}>🎨</div>
                <div>
                  <label style={styles.calculatedLabel}>Lab Dip Date</label>
                  <div style={styles.calculatedValue}>{formatDateWithMonthName(formData.lab_dip_date)}</div>
                  <div style={styles.formulaHint}>= Order Booking Date + 15 days</div>
                </div>
              </div>
              
              <div style={styles.calculatedCard}>
                <div style={styles.calculatedIcon}>👕</div>
                <div>
                  <label style={styles.calculatedLabel}>Fit Sample Date</label>
                  <div style={styles.calculatedValue}>{formatDateWithMonthName(formData.fit_sample_date)}</div>
                  <div style={styles.formulaHint}>= Order Booking Date + 15 days</div>
                </div>
              </div>
              
              <div style={styles.calculatedCard}>
                <div style={styles.calculatedIcon}>⚙️</div>
                <div>
                  <label style={styles.calculatedLabel}>PPS Date</label>
                  <div style={styles.calculatedValue}>{formatDateWithMonthName(formData.pps_date)}</div>
                  <div style={styles.formulaHint}>= Fabric Booking Date + 20 days</div>
                </div>
              </div>
              
              <div style={styles.calculatedCard}>
                <div style={styles.calculatedIcon}>🏭</div>
                <div>
                  <label style={styles.calculatedLabel}>Production Start Date</label>
                  <div style={styles.calculatedValue}>{formatDateWithMonthName(formData.production_start_date)}</div>
                  <div style={styles.formulaHint}>= Fabric Inhouse + 10 days</div>
                </div>
              </div>
              
              <div style={styles.calculatedCard}>
                <div style={styles.calculatedIcon}>📦</div>
                <div>
                  <label style={styles.calculatedLabel}>PS Date</label>
                  <div style={styles.calculatedValue}>{formatDateWithMonthName(formData.ps_date)}</div>
                  <div style={styles.formulaHint}>= Production Start + 10 days</div>
                </div>
              </div>
              
              <div style={styles.calculatedCard}>
                <div style={styles.calculatedIcon}>🔬</div>
                <div>
                  <label style={styles.calculatedLabel}>Test Samples Date</label>
                  <div style={styles.calculatedValue}>{formatDateWithMonthName(formData.test_samples_date)}</div>
                  <div style={styles.formulaHint}>= Production Start - 10 days</div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: REMARKS */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionIcon}>📝</div>
              <h2 style={styles.sectionTitle}>Remarks</h2>
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formGroupFull}>
                <textarea name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Enter any additional notes or remarks..." style={{ ...styles.textarea, minHeight: "100px" }} />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={styles.formActions}>
            <Link to="/orders/tna" style={styles.cancelBtn}>
              Cancel
            </Link>
            <button type="submit" style={styles.submitBtn} disabled={saving}>
              {saving ? (
                <>
                  <div style={styles.spinnerSmall}></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  {id ? "Update TNA" : "Create TNA"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  mainContent: {
    flex: 1,
    padding: "32px 40px",
    overflow: "auto",
    maxHeight: "100vh",
  },
  loadingContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
  },
  loadingHint: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "4px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  spinnerSmall: {
    width: "16px",
    height: "16px",
    border: "2px solid white",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
    display: "inline-block",
    marginRight: "8px",
  },
  header: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    borderRadius: "20px",
    padding: "28px 32px",
    marginBottom: "28px",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  headerIcon: {
    background: "rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: "26px",
    fontWeight: "700",
    color: "white",
    margin: 0,
  },
  headerSubtitle: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.7)",
    margin: "6px 0 0 0",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
  },
  btnSecondary: {
    background: "rgba(255,255,255,0.1)",
    color: "white",
    padding: "10px 20px",
    borderRadius: "12px",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  },
  btnSync: {
    background: "#f59e0b",
    color: "white",
    padding: "10px 20px",
    borderRadius: "12px",
    border: "none",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  },
  btnClear: {
    background: "#ef4444",
    color: "white",
    padding: "10px 20px",
    borderRadius: "12px",
    border: "none",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    marginBottom: "28px",
  },
  kpiCard: {
    background: "white",
    borderRadius: "20px",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s",
  },
  kpiIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  kpiValue: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#1a2a3a",
  },
  kpiLabel: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
  },
  kpiMini: {
    fontSize: "11px",
    padding: "6px 12px",
    borderRadius: "20px",
    fontWeight: "500",
    marginTop: "8px",
    display: "inline-block",
    width: "fit-content",
  },
  section: {
    background: "white",
    borderRadius: "20px",
    marginBottom: "24px",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s",
    overflow: "visible",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "18px 24px",
    background: "#fafbfc",
    borderBottom: "1px solid #e2e8f0",
  },
  sectionIcon: {
    fontSize: "22px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a2a3a",
    margin: 0,
  },
  sectionBadge: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#ef4444",
    background: "#fef2f2",
    padding: "4px 10px",
    borderRadius: "20px",
    marginLeft: "auto",
  },
  sectionHint: {
    fontSize: "11px",
    color: "#94a3b8",
    marginLeft: "auto",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "24px",
    padding: "28px",
  },
  calculatedGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
    padding: "24px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    position: "relative",
    overflow: "visible",
  },
  formGroupFull: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    gridColumn: "span 3",
    position: "relative",
    overflow: "visible",
  },
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#34495e",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    transition: "all 0.2s",
  },
  select: {
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    background: "white",
    cursor: "pointer",
  },
  textarea: {
    padding: "12px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
  },
  fabricTypeGroup: {
    display: "flex",
    gap: "12px",
  },
  fabricTypeBtn: {
    flex: 1,
    padding: "12px 16px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  fabricTypeBtnActive: {
    background: "#3b82f6",
    borderColor: "#3b82f6",
    color: "white",
  },
  calculatedCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px",
    background: "#fafbfc",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s",
  },
  calculatedIcon: {
    fontSize: "24px",
  },
  calculatedLabel: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "block",
    marginBottom: "4px",
  },
  calculatedValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1a2a3a",
  },
  fieldHint: {
    fontSize: "11px",
    color: "#8b5cf6",
    marginTop: "6px",
  },
  formulaHint: {
    fontSize: "10px",
    color: "#8b5cf6",
    marginTop: "4px",
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "16px",
    marginTop: "8px",
    paddingBottom: "8px",
  },
  cancelBtn: {
    padding: "12px 28px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    textDecoration: "none",
    color: "#475569",
    transition: "all 0.2s",
  },
  submitBtn: {
    padding: "12px 32px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  },
};