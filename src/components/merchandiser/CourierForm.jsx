// src/components/merchandiser/CourierForm.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import {
  getCourierBookingById,
  createCourierBooking,
  updateCourierBooking,
  getOrders,
  getCourierStatusOptions,
  getShipmentTypeOptions,
  merchandiserApi,
} from '../../api/merchandiser';

const CourierForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const dropdownRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Order search state
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [totalRunningOrders, setTotalRunningOrders] = useState(0);
  const [orderPage, setOrderPage] = useState(1);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    order_id: '',
    order_display: '',
    courier_name: 'DHL',
    shipment_type: 'export',
    sender_name: '',
    sender_company: '',
    sender_address: '',
    sender_phone: '',
    sender_email: '',
    receiver_name: '',
    receiver_company: '',
    receiver_address: '',
    receiver_phone: '',
    receiver_email: '',
    tracking_number: '',
    awb_number: '',
    weight: '',
    dimension: '',
    pieces: 1,
    description: '',
    booking_date: new Date().toISOString().split('T')[0],
    pickup_date: '',
    estimated_delivery_date: '',
    actual_delivery_date: '',
    status: 'booked',
    shipping_cost: '',
    insurance_cost: '',
    customs_declaration_number: '',
    customs_cleared_at: '',
    delivered_to: '',
    signature: '',
    remarks: '',
    internal_notes: '',
  });

  const statusOptions = getCourierStatusOptions();
  const shipmentTypeOptions = getShipmentTypeOptions();
  const courierOptions = [
    { value: 'DHL', label: 'DHL' },
    { value: 'UPS', label: 'UPS' },
    { value: 'FedEx', label: 'FedEx' },
    { value: 'Aramex', label: 'Aramex' },
    { value: 'TNT', label: 'TNT' },
    { value: 'EMS', label: 'EMS' },
    { value: 'other', label: 'Other' },
  ];

  // Get total count of running orders (non-shipped, non-cancelled)
  const getTotalRunningOrdersCount = useCallback(async () => {
    try {
      // Fetch just the count with status filter
      const response = await merchandiserApi.get('orders/', {
        params: {
          page: 1,
          page_size: 1,
          status: 'Running|Active|Pending'
        }
      });
      
      // The count from API response is the total number of orders matching the filter
      const count = response.data?.count || 0;
      setTotalRunningOrders(count);
      return count;
    } catch (err) {
      console.error('Error fetching running orders count:', err);
      return 0;
    }
  }, []);

  // Fetch orders with pagination
  const fetchOrders = useCallback(async (searchTerm = '', page = 1, append = false) => {
    if (loadingOrders) return;
    setLoadingOrders(true);
    
    try {
      const filters = {};
      
      // Only add search if there's a term
      if (searchTerm && searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }
      
      // Filter by non-shipped statuses
      filters.status = 'Running|Active|Pending';
      
      const response = await getOrders(page, 50, { filters });
      
      if (response && response.data) {
        // The API already filtered by status, so we just need to display
        const filteredOrders = response.data;
        
        if (append) {
          setOrders(prev => [...prev, ...filteredOrders]);
        } else {
          setOrders(filteredOrders);
        }
        
        // Store the total count from API response
        const totalCount = response.pagination?.count || 0;
        setTotalOrdersCount(totalCount);
        
        // If this is the first page and no search term, update the running orders count
        if (page === 1 && !searchTerm) {
          setTotalRunningOrders(totalCount);
        }
        
        setHasMoreOrders(response.pagination?.next !== null);
        setOrderPage(page);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // Initial load - fetch first page and total count
  useEffect(() => {
    const initialize = async () => {
      // Get total running orders count first
      await getTotalRunningOrdersCount();
      // Then fetch the first page of orders
      await fetchOrders('', 1, false);
    };
    initialize();
  }, []);

  // Fetch booking data if editing
  useEffect(() => {
    if (isEdit && id) {
      const fetchBooking = async () => {
        setLoading(true);
        try {
          const response = await getCourierBookingById(id);
          if (response && response.data) {
            const data = response.data;
            setFormData({
              order_id: data.order || '',
              order_display: `${data.order_po_no || 'N/A'} - ${data.order_style || 'N/A'}`,
              courier_name: data.courier_name || 'DHL',
              shipment_type: data.shipment_type || 'export',
              sender_name: data.sender_name || '',
              sender_company: data.sender_company || '',
              sender_address: data.sender_address || '',
              sender_phone: data.sender_phone || '',
              sender_email: data.sender_email || '',
              receiver_name: data.receiver_name || '',
              receiver_company: data.receiver_company || '',
              receiver_address: data.receiver_address || '',
              receiver_phone: data.receiver_phone || '',
              receiver_email: data.receiver_email || '',
              tracking_number: data.tracking_number || '',
              awb_number: data.awb_number || '',
              weight: data.weight || '',
              dimension: data.dimension || '',
              pieces: data.pieces || 1,
              description: data.description || '',
              booking_date: data.booking_date || new Date().toISOString().split('T')[0],
              pickup_date: data.pickup_date || '',
              estimated_delivery_date: data.estimated_delivery_date || '',
              actual_delivery_date: data.actual_delivery_date || '',
              status: data.status || 'booked',
              shipping_cost: data.shipping_cost || '',
              insurance_cost: data.insurance_cost || '',
              customs_declaration_number: data.customs_declaration_number || '',
              customs_cleared_at: data.customs_cleared_at || '',
              delivered_to: data.delivered_to || '',
              signature: data.signature || '',
              remarks: data.remarks || '',
              internal_notes: data.internal_notes || '',
            });
          }
        } catch (err) {
          console.error('Error fetching booking:', err);
          setError('Failed to load booking data');
        } finally {
          setLoading(false);
        }
      };
      fetchBooking();
    }
  }, [id, isEdit]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (orderSearch.length > 1 || orderSearch.length === 0) {
        fetchOrders(orderSearch, 1, false);
      }
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [orderSearch, fetchOrders]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowOrderDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load more orders when scrolling to bottom of dropdown
  const handleDropdownScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 20 && hasMoreOrders && !loadingOrders) {
      fetchOrders(orderSearch, orderPage + 1, true);
    }
  };

  const handleSelectOrder = (order) => {
    const displayName = `${order.po_no || 'N/A'} - ${order.style || 'N/A'} (${order.customer_name || 'No Customer'})`;
    setFormData({
      ...formData,
      order_id: order.id,
      order_display: displayName,
    });
    setOrderSearch('');
    setShowOrderDropdown(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || !isNaN(parseFloat(value)) || value === '-') {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleInputFocus = () => {
    if (!isEdit) {
      setShowOrderDropdown(true);
      // If no orders loaded yet or search is empty, load initial orders
      if (orders.length === 0 && !loadingOrders) {
        fetchOrders('', 1, false);
      }
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setOrderSearch(value);
    setShowOrderDropdown(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!formData.order_id) {
      setError('Please select an order');
      setSaving(false);
      return;
    }
    if (!formData.tracking_number) {
      setError('Tracking number is required');
      setSaving(false);
      return;
    }
    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      setError('Valid weight is required');
      setSaving(false);
      return;
    }
    if (!formData.booking_date) {
      setError('Booking date is required');
      setSaving(false);
      return;
    }

    try {
      const submitData = {
        order_id: parseInt(formData.order_id),
        courier_name: formData.courier_name,
        shipment_type: formData.shipment_type,
        sender_name: formData.sender_name,
        sender_company: formData.sender_company || '',
        sender_address: formData.sender_address,
        sender_phone: formData.sender_phone,
        sender_email: formData.sender_email || '',
        receiver_name: formData.receiver_name,
        receiver_company: formData.receiver_company || '',
        receiver_address: formData.receiver_address,
        receiver_phone: formData.receiver_phone,
        receiver_email: formData.receiver_email || '',
        tracking_number: formData.tracking_number,
        awb_number: formData.awb_number || '',
        weight: parseFloat(formData.weight) || 0,
        dimension: formData.dimension || '',
        pieces: parseInt(formData.pieces) || 1,
        description: formData.description || '',
        booking_date: formData.booking_date,
        pickup_date: formData.pickup_date || null,
        estimated_delivery_date: formData.estimated_delivery_date || null,
        actual_delivery_date: formData.actual_delivery_date || null,
        status: formData.status,
        shipping_cost: parseFloat(formData.shipping_cost) || 0,
        insurance_cost: parseFloat(formData.insurance_cost) || 0,
        customs_declaration_number: formData.customs_declaration_number || '',
        customs_cleared_at: formData.customs_cleared_at || null,
        delivered_to: formData.delivered_to || '',
        signature: formData.signature || '',
        remarks: formData.remarks || '',
        internal_notes: formData.internal_notes || '',
      };

      let response;
      if (isEdit) {
        response = await updateCourierBooking(id, submitData);
      } else {
        response = await createCourierBooking(submitData);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/courier');
      }, 1500);
    } catch (err) {
      console.error('Error saving booking:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.detail || 
                          err.response?.data?.message ||
                          'Failed to save courier booking';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading courier booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>
              {isEdit ? 'Edit Courier Booking' : 'Add Courier Booking'}
            </h1>
            <p style={styles.headerSubtitle}>
              {isEdit ? 'Update courier shipment details' : 'Create a new courier shipment booking'}
            </p>
          </div>
          <div style={styles.headerActions}>
            <button onClick={() => navigate('/courier')} style={styles.btnCancel}>
              ← Cancel
            </button>
            <button
              type="submit"
              form="courierForm"
              disabled={saving}
              style={{
                ...styles.btnSave,
                opacity: saving ? 0.7 : 1,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : isEdit ? 'Update Booking' : 'Create Booking'}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div style={styles.successAlert}>
            <span style={styles.successIcon}>✅</span>
            <span>{isEdit ? 'Booking updated successfully!' : 'Booking created successfully!'}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={styles.errorAlert}>
            <span style={styles.errorIcon}>❌</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={styles.errorClose}>✕</button>
          </div>
        )}

        {/* Form */}
        <form id="courierForm" onSubmit={handleSubmit} style={styles.form}>
          {/* Order Selection */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📦 Order Information</h3>
            <div style={styles.formRow}>
              <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                <label style={styles.label}>
                  Select Order <span style={styles.required}>*</span>
                </label>
                <div style={styles.orderSearchWrapper} ref={dropdownRef}>
                  <input
                    type="text"
                    value={isEdit ? formData.order_display : orderSearch}
                    onChange={isEdit ? undefined : handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder={isEdit ? formData.order_display || 'Order locked for editing' : 'Search by PO No, Style, or Customer...'}
                    style={{
                      ...styles.orderSearchInput,
                      background: isEdit ? '#f1f4f8' : 'white',
                      cursor: isEdit ? 'not-allowed' : 'text',
                    }}
                    disabled={isEdit}
                    readOnly={isEdit}
                  />
                  {isEdit && (
                    <span style={styles.orderLocked}>🔒</span>
                  )}
                  {loadingOrders && (
                    <span style={styles.orderLoading}>⏳</span>
                  )}
                  {!isEdit && orders.length > 0 && !loadingOrders && (
                    <span style={styles.orderDropdownArrow}>▼</span>
                  )}
                  
                  {/* Dropdown */}
                  {!isEdit && showOrderDropdown && (
                    <div 
                      style={styles.orderDropdown}
                      onScroll={handleDropdownScroll}
                    >
                      {loadingOrders && orders.length === 0 ? (
                        <div style={styles.orderDropdownLoading}>
                          <span style={styles.spinnerSmall}></span>
                          Loading orders...
                        </div>
                      ) : orders.length > 0 ? (
                        <>
                          {orders.map((order, index) => (
                            <div
                              key={order.id}
                              style={{
                                ...styles.orderDropdownItem,
                                borderBottom: index === orders.length - 1 && !hasMoreOrders ? 'none' : '1px solid #f1f4f8',
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectOrder(order);
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f1f5f9';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'white';
                              }}
                            >
                              <span style={styles.orderDropdownPo}>
                                {order.po_no || 'N/A'}
                              </span>
                              <span style={styles.orderDropdownStyle}>
                                {order.style || 'N/A'}
                              </span>
                              <span style={styles.orderDropdownStatus}>
                                {order.status || 'N/A'}
                              </span>
                              <span style={styles.orderDropdownCustomer}>
                                {order.customer_name || 'No Customer'}
                              </span>
                            </div>
                          ))}
                          {hasMoreOrders && (
                            <div style={styles.orderDropdownLoading}>
                              {loadingOrders ? (
                                <>
                                  <span style={styles.spinnerSmall}></span>
                                  Loading more...
                                </>
                              ) : (
                                'Scroll for more'
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={styles.orderDropdownEmpty}>
                          {orderSearch ? `No orders found matching "${orderSearch}"` : 'No available orders found'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formData.order_id && (
                  <div style={styles.selectedOrderBadge}>
                    ✅ Order selected: {formData.order_display}
                  </div>
                )}
                {!isEdit && !loadingOrders && (
                  <div style={styles.orderCountMessage}>
                    📋 {totalRunningOrders > 0 
                      ? `${totalRunningOrders.toLocaleString()} Running Order${totalRunningOrders !== 1 ? 's' : ''} Available` 
                      : orderSearch 
                        ? 'No matching orders found' 
                        : 'Loading orders...'}
                  </div>
                )}
                {!isEdit && !loadingOrders && totalRunningOrders === 0 && !orderSearch && (
                  <div style={styles.noOrdersMessage}>
                    ⚠️ No running orders available. All orders may be shipped or cancelled.
                  </div>
                )}
                {!isEdit && !loadingOrders && totalRunningOrders > 50 && !orderSearch && (
                  <div style={styles.searchHint}>
                    💡 Showing first 50 orders. Type to search among {totalRunningOrders.toLocaleString()} orders.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Courier Details */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🚚 Courier Details</h3>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Courier Name</label>
                <select
                  name="courier_name"
                  value={formData.courier_name}
                  onChange={handleChange}
                  style={styles.select}
                >
                  {courierOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Shipment Type</label>
                <select
                  name="shipment_type"
                  value={formData.shipment_type}
                  onChange={handleChange}
                  style={styles.select}
                >
                  {shipmentTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={styles.select}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tracking Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🔢 Tracking Information</h3>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Tracking Number <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="tracking_number"
                  value={formData.tracking_number}
                  onChange={handleChange}
                  placeholder="e.g., 1Z999AA10123456784"
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>AWB Number</label>
                <input
                  type="text"
                  name="awb_number"
                  value={formData.awb_number}
                  onChange={handleChange}
                  placeholder="Air Waybill Number"
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Sender Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📤 Sender Information</h3>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Sender Name</label>
                <input
                  type="text"
                  name="sender_name"
                  value={formData.sender_name}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Sender Company</label>
                <input
                  type="text"
                  name="sender_company"
                  value={formData.sender_company}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                <label style={styles.label}>Sender Address</label>
                <textarea
                  name="sender_address"
                  value={formData.sender_address}
                  onChange={handleChange}
                  rows="2"
                  style={styles.textarea}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Sender Phone</label>
                <input
                  type="text"
                  name="sender_phone"
                  value={formData.sender_phone}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Sender Email</label>
                <input
                  type="email"
                  name="sender_email"
                  value={formData.sender_email}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Receiver Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📥 Receiver Information</h3>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Receiver Name</label>
                <input
                  type="text"
                  name="receiver_name"
                  value={formData.receiver_name}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Receiver Company</label>
                <input
                  type="text"
                  name="receiver_company"
                  value={formData.receiver_company}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                <label style={styles.label}>Receiver Address</label>
                <textarea
                  name="receiver_address"
                  value={formData.receiver_address}
                  onChange={handleChange}
                  rows="2"
                  style={styles.textarea}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Receiver Phone</label>
                <input
                  type="text"
                  name="receiver_phone"
                  value={formData.receiver_phone}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Receiver Email</label>
                <input
                  type="email"
                  name="receiver_email"
                  value={formData.receiver_email}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Shipment Details */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📦 Shipment Details</h3>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Weight (kg) <span style={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleNumberChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Dimensions</label>
                <input
                  type="text"
                  name="dimension"
                  value={formData.dimension}
                  onChange={handleChange}
                  placeholder="L x W x H (cm)"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Pieces</label>
                <input
                  type="number"
                  name="pieces"
                  value={formData.pieces}
                  onChange={handleNumberChange}
                  min="1"
                  step="1"
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                <label style={styles.label}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Description of items being shipped"
                  style={styles.textarea}
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📅 Dates</h3>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Booking Date <span style={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  name="booking_date"
                  value={formData.booking_date}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Pickup Date</label>
                <input
                  type="date"
                  name="pickup_date"
                  value={formData.pickup_date}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Estimated Delivery Date</label>
                <input
                  type="date"
                  name="estimated_delivery_date"
                  value={formData.estimated_delivery_date}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Actual Delivery Date</label>
                <input
                  type="date"
                  name="actual_delivery_date"
                  value={formData.actual_delivery_date}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Cost Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>💰 Cost Information</h3>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Shipping Cost ($)</label>
                <input
                  type="number"
                  name="shipping_cost"
                  value={formData.shipping_cost}
                  onChange={handleNumberChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Insurance Cost ($)</label>
                <input
                  type="number"
                  name="insurance_cost"
                  value={formData.insurance_cost}
                  onChange={handleNumberChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Customs Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🛃 Customs Information</h3>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Customs Declaration Number</label>
                <input
                  type="text"
                  name="customs_declaration_number"
                  value={formData.customs_declaration_number}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Customs Cleared Date</label>
                <input
                  type="date"
                  name="customs_cleared_at"
                  value={formData.customs_cleared_at}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Delivery Confirmation */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>✅ Delivery Confirmation</h3>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Delivered To</label>
                <input
                  type="text"
                  name="delivered_to"
                  value={formData.delivered_to}
                  onChange={handleChange}
                  placeholder="Name of recipient"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Signature</label>
                <input
                  type="text"
                  name="signature"
                  value={formData.signature}
                  onChange={handleChange}
                  placeholder="Signature text or base64"
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📝 Notes</h3>
            <div style={styles.formRow}>
              <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                <label style={styles.label}>Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows="2"
                  style={styles.textarea}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                <label style={styles.label}>Internal Notes</label>
                <textarea
                  name="internal_notes"
                  value={formData.internal_notes}
                  onChange={handleChange}
                  rows="2"
                  style={styles.textarea}
                />
              </div>
            </div>
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
          border-color: #1a73e8;
          box-shadow: 0 0 0 3px rgba(26,115,232,0.1);
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#f5f7fa",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  mainContent: {
    flex: 1,
    padding: "24px 32px",
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
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#1a73e8",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  spinnerSmall: {
    width: "16px",
    height: "16px",
    border: "2px solid #e2e8f0",
    borderTopColor: "#1a73e8",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 1s linear infinite",
    marginRight: "8px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "12px",
  },
  headerTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  headerSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "4px 0 0 0",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  btnCancel: {
    padding: "10px 20px",
    background: "white",
    color: "#0f172a",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  btnSave: {
    padding: "10px 24px",
    background: "linear-gradient(135deg, #1a73e8, #1557b0)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  successAlert: {
    background: "#dcfce7",
    color: "#166534",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid #bbf7d0",
  },
  successIcon: {
    fontSize: "18px",
  },
  errorAlert: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid #fecaca",
  },
  errorIcon: {
    fontSize: "18px",
  },
  errorClose: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    color: "#991b1b",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  section: {
    background: "white",
    borderRadius: "12px",
    padding: "20px 24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 16px 0",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "16px",
    marginBottom: "12px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#475569",
  },
  required: {
    color: "#dc2626",
    fontWeight: "700",
  },
  input: {
    padding: "10px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    transition: "all 0.2s",
    fontFamily: "inherit",
  },
  textarea: {
    padding: "10px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    transition: "all 0.2s",
    fontFamily: "inherit",
    resize: "vertical",
  },
  select: {
    padding: "10px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    background: "white",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  orderSearchWrapper: {
    position: "relative",
  },
  orderSearchInput: {
    width: "100%",
    padding: "10px 12px",
    paddingRight: "36px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "13px",
    transition: "all 0.2s",
    fontFamily: "inherit",
  },
  orderLocked: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "14px",
  },
  orderLoading: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "14px",
    animation: "spin 1s linear infinite",
  },
  orderDropdownArrow: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "12px",
    color: "#94a3b8",
    pointerEvents: "none",
  },
  orderDropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    maxHeight: "260px",
    overflowY: "auto",
    zIndex: 1000,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  orderDropdownLoading: {
    padding: "12px 16px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  orderDropdownItem: {
    padding: "10px 14px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    cursor: "pointer",
    background: "white",
    transition: "background 0.15s",
  },
  orderDropdownPo: {
    fontWeight: "600",
    fontSize: "13px",
    color: "#0f172a",
    minWidth: "100px",
  },
  orderDropdownStyle: {
    fontSize: "13px",
    color: "#334155",
    minWidth: "100px",
  },
  orderDropdownStatus: {
    fontSize: "12px",
    color: "#64748b",
    padding: "2px 8px",
    background: "#f1f5f9",
    borderRadius: "12px",
    minWidth: "60px",
    textAlign: "center",
  },
  orderDropdownCustomer: {
    fontSize: "12px",
    color: "#64748b",
    marginLeft: "auto",
  },
  orderDropdownEmpty: {
    padding: "20px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "13px",
  },
  selectedOrderBadge: {
    marginTop: "8px",
    padding: "8px 12px",
    background: "#dcfce7",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#166534",
    border: "1px solid #bbf7d0",
  },
  orderCountMessage: {
    marginTop: "8px",
    padding: "8px 12px",
    background: "#dbeafe",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#1e40af",
    border: "1px solid #bfdbfe",
  },
  noOrdersMessage: {
    marginTop: "8px",
    padding: "8px 12px",
    background: "#fef3c7",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#92400e",
    border: "1px solid #fde68a",
  },
  searchHint: {
    marginTop: "8px",
    fontSize: "12px",
    color: "#64748b",
    fontStyle: "italic",
    padding: "4px 8px",
    background: "#f8fafc",
    borderRadius: "4px",
  },
};

export default CourierForm;