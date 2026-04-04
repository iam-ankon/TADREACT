// pages/orders/EditOrder.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getOrderById, updateOrder, getCustomers } from '../../api/merchandiser';
import Sidebar from '../merchandiser/Sidebar';
import {
  FaArrowLeft,
  FaSave,
  FaTimes,
  FaInfoCircle,
  FaDollarSign,
  FaTruck,
  FaFlask,
  FaCheckCircle,
  FaBuilding,
  FaUser,
  FaBoxes,
  FaCalendarAlt,
  FaIndustry,
  FaRuler,
  FaChartLine,
  FaClipboardList,
  FaShoppingCart,
  FaExclamationTriangle,
  FaPalette,
  FaPlus,
  FaTrash,
} from "react-icons/fa";

const statusOptions = [
  { value: 'Running', label: 'Running', color: '#10b981', bg: '#d1fae5' },
  { value: 'Shipped', label: 'Shipped', color: '#3b82f6', bg: '#dbeafe' },
  { value: 'Pending', label: 'Pending', color: '#f59e0b', bg: '#fed7aa' },
  { value: 'Cancelled', label: 'Cancelled', color: '#ef4444', bg: '#fee2e2' },
];

const garmentOptions = [
  'T-Shirt', 'Polo Shirt', 'Henley', 'Tank Top', 'Shirt', 'Blouse', 'Dress',
  'Skirt', 'Pants', 'Jeans', 'Shorts', 'Jacket', 'Hoodie', 'Sweater',
  'Cardigan', 'Vest', 'Jumpsuit', 'Romper', 'Activewear', 'Swimwear',
  'Underwear', 'Socks', 'Accessories',
];

const tabs = [
  { id: 0, label: 'Basic Information', icon: <FaInfoCircle /> },
  { id: 1, label: 'Pricing & Quantity', icon: <FaDollarSign /> },
  { id: 2, label: 'Color & Sizing', icon: <FaPalette /> },
  { id: 3, label: 'Dates & Shipping', icon: <FaTruck /> },
  { id: 4, label: 'Test Results', icon: <FaFlask /> },
];

// Alpha sizes configuration
const alphaSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

const EditOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const stored = localStorage.getItem("sidebarsOpenState");
    return stored !== null ? JSON.parse(stored) : true;
  });

  const [formData, setFormData] = useState({
    style: '', po_no: '', department: '', customer: '', garment: '',
    ref_no: '', supplier: '', shipment_month: '', gender: '', item: '',
    fabrication: '', size_range: '', wgr: '', unit_price: '', total_qty: '',
    total_value: '', factory_value: '', status: 'Running', shipped_qty: 0,
    shipped_value: 0, final_inspection_date: null, ex_factory: null,
    etd: null, eta: null, shipment_date: null, physical_test: '',
    chemical_test: '', during_production_inspection: '', final_random_inspection: '',
    group_name: '', remarks: '', size_type: 'numeric',
  });

  // Color & Sizing State
  const [sizeType, setSizeType] = useState("numeric");
  const [sizeRange, setSizeRange] = useState("");
  const [availableSizes, setAvailableSizes] = useState([]);
  const [colorSizeGroups, setColorSizeGroups] = useState([]);
  const [originalColorGroups, setOriginalColorGroups] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });
  const [originalData, setOriginalData] = useState(null);
  
  // Add state for customers
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await getCustomers(1, 100, false);
      if (response && response.data) {
        console.log('✅ Customers loaded for edit:', response.data);
        setCustomers(response.data);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching customers:', error);
    } finally {
      setCustomersLoading(false);
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem("sidebarsOpenState");
      setIsSidebarOpen(stored !== null ? JSON.parse(stored) : true);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  // Parse size range to generate available sizes
  const parseSizeRange = (sizeTypeVal, sizeRangeVal) => {
    if (sizeTypeVal === "numeric") {
      if (sizeRangeVal && sizeRangeVal.includes("-")) {
        const [start, end] = sizeRangeVal.split("-").map(Number);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          const sizes = [];
          for (let i = start; i <= end; i++) {
            if (i % 2 === 0) {
              sizes.push({ size: i.toString(), quantity: 0 });
            }
          }
          return sizes;
        }
      }
      return [];
    } else if (sizeTypeVal === "alpha") {
      if (sizeRangeVal === "all") {
        return alphaSizes.map((size) => ({ size, quantity: 0 }));
      }
      return [];
    }
    return [];
  };

  // Convert color groups from API format to component format
  const convertColorGroupsToComponentFormat = (groups, sizes) => {
    if (!groups || groups.length === 0) {
      return [{ id: Date.now(), color: "", sizes: sizes.map(s => ({ ...s, quantity: 0 })), total: 0 }];
    }
    
    return groups.map((group, index) => {
      // Create a map of size -> quantity from the group's size_quantities
      const sizeQuantityMap = {};
      if (group.size_quantities) {
        group.size_quantities.forEach(sq => {
          sizeQuantityMap[sq.size] = sq.quantity;
        });
      }
      
      // Build sizes array with quantities from the group
      const groupSizes = sizes.map(size => ({
        size: size.size,
        quantity: sizeQuantityMap[size.size] || 0
      }));
      
      const total = groupSizes.reduce((sum, s) => sum + (s.quantity || 0), 0);
      
      return {
        id: group.id || Date.now() + index,
        color: group.color || "",
        sizes: groupSizes,
        total: total
      };
    });
  };

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await getOrderById(id);
      const orderData = response.data;
      console.log('📦 Order data received:', orderData);
      console.log('👤 Customer data in order:', orderData.customer);
      console.log('🎨 Color size groups:', orderData.color_size_groups);
      
      setOriginalData(orderData);
      setOriginalColorGroups(orderData.color_size_groups || []);
      
      // Extract customer ID - handle both object and primitive cases
      let customerId = '';
      if (orderData.customer) {
        if (typeof orderData.customer === 'object') {
          customerId = orderData.customer.id || '';
        } else {
          customerId = orderData.customer;
        }
      }
      
      // Set size type and range from order data
      const orderSizeType = orderData.size_type || "numeric";
      const orderSizeRange = orderData.size_range || "";
      
      setSizeType(orderSizeType);
      setSizeRange(orderSizeRange);
      
      // Parse sizes based on size type and range
      const parsedSizes = parseSizeRange(orderSizeType, orderSizeRange);
      setAvailableSizes(parsedSizes);
      
      // Convert color groups to component format
      const convertedGroups = convertColorGroupsToComponentFormat(
        orderData.color_size_groups || [],
        parsedSizes
      );
      setColorSizeGroups(convertedGroups);
      
      setFormData({
        ...orderData,
        final_inspection_date: orderData.final_inspection_date ? new Date(orderData.final_inspection_date) : null,
        ex_factory: orderData.ex_factory ? new Date(orderData.ex_factory) : null,
        etd: orderData.etd ? new Date(orderData.etd) : null,
        eta: orderData.eta ? new Date(orderData.eta) : null,
        shipment_date: orderData.shipment_date ? new Date(orderData.shipment_date) : null,
        unit_price: orderData.unit_price?.toString() || '',
        total_qty: orderData.total_qty?.toString() || '',
        total_value: orderData.total_value?.toString() || '',
        factory_value: orderData.factory_value?.toString() || '',
        shipped_qty: orderData.shipped_qty || 0,
        shipped_value: orderData.shipped_value || 0,
        customer: customerId,
        size_type: orderSizeType,
        size_range: orderSizeRange,
      });
    } catch (error) {
      console.error('Error loading order details:', error);
      setSnackbar({ open: true, message: 'Error loading order details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'unit_price' || name === 'total_qty') {
      const unitPrice = name === 'unit_price' ? parseFloat(value) : parseFloat(formData.unit_price);
      const quantity = name === 'total_qty' ? parseInt(value) : parseInt(formData.total_qty);
      if (!isNaN(unitPrice) && !isNaN(quantity) && unitPrice > 0 && quantity > 0) {
        setFormData(prev => ({ ...prev, total_value: (unitPrice * quantity).toFixed(2) }));
      }
    }
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({ ...prev, [name]: date }));
  };

  // Size Type Change Handler
  const handleSizeTypeChange = (e) => {
    const newSizeType = e.target.value;
    setSizeType(newSizeType);
    setSizeRange("");
    setAvailableSizes([]);
    setColorSizeGroups([]);
  };

  // Size Range Change Handler
  const handleSizeRangeChange = (e) => {
    const value = e.target.value;
    setSizeRange(value);
    setFormData(prev => ({ ...prev, size_range: value }));

    if (sizeType === "numeric") {
      if (value.includes("-")) {
        const [start, end] = value.split("-").map(Number);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          const sizes = [];
          for (let i = start; i <= end; i++) {
            if (i % 2 === 0) {
              sizes.push({ size: i.toString(), quantity: 0 });
            }
          }
          setAvailableSizes(sizes);
          setColorSizeGroups([
            { id: Date.now(), color: "", sizes: sizes.map(s => ({ size: s.size, quantity: 0 })), total: 0 }
          ]);
        } else {
          setAvailableSizes([]);
          setColorSizeGroups([]);
        }
      } else {
        setAvailableSizes([]);
        setColorSizeGroups([]);
      }
    } else if (sizeType === "alpha") {
      if (value === "all") {
        const sizes = alphaSizes.map((size) => ({ size, quantity: 0 }));
        setAvailableSizes(sizes);
        setColorSizeGroups([
          { id: Date.now(), color: "", sizes: sizes.map(s => ({ size: s.size, quantity: 0 })), total: 0 }
        ]);
      } else {
        setAvailableSizes([]);
        setColorSizeGroups([]);
      }
    }
  };

  // Color Group Functions
  const addColorGroup = () => {
    setColorSizeGroups(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        color: "",
        sizes: availableSizes.map(size => ({ ...size, quantity: 0 })),
        total: 0,
      },
    ]);
  };

  const removeColorGroup = (groupId) => {
    if (colorSizeGroups.length > 1) {
      setColorSizeGroups(prev => prev.filter(group => group.id !== groupId));
    } else {
      setSnackbar({ open: true, message: "At least one color group is required", type: "warning" });
    }
  };

  const handleColorChange = (groupId, value) => {
    setColorSizeGroups(prev =>
      prev.map(group =>
        group.id === groupId ? { ...group, color: value } : group
      )
    );
  };

  const handleQuantityChange = (groupId, size, value) => {
    setColorSizeGroups(prev =>
      prev.map(group => {
        if (group.id === groupId) {
          const newSizes = group.sizes.map(s =>
            s.size === size ? { ...s, quantity: parseInt(value) || 0 } : s
          );
          const newTotal = newSizes.reduce((sum, s) => sum + s.quantity, 0);
          return { ...group, sizes: newSizes, total: newTotal };
        }
        return group;
      })
    );
  };

  const calculateGrandTotal = () => {
    return colorSizeGroups.reduce((sum, group) => sum + group.total, 0);
  };

  const hasChanges = () => {
    if (!originalData) return false;
    
    // Create a copy of original data without the customer object
    const originalCopy = { ...originalData };
    if (originalCopy.customer && typeof originalCopy.customer === 'object') {
      originalCopy.customer = originalCopy.customer.id || '';
    }
    
    const currentFormatted = {
      ...formData,
      final_inspection_date: formData.final_inspection_date?.toISOString().split('T')[0],
      ex_factory: formData.ex_factory?.toISOString().split('T')[0],
      etd: formData.etd?.toISOString().split('T')[0],
      eta: formData.eta?.toISOString().split('T')[0],
      shipment_date: formData.shipment_date?.toISOString().split('T')[0],
      size_type: sizeType,
      size_range: sizeRange,
    };
    
    // Check if color groups have changed
    const colorGroupsChanged = JSON.stringify(colorSizeGroups) !== JSON.stringify(originalColorGroups);
    
    return JSON.stringify(currentFormatted) !== JSON.stringify(originalCopy) || colorGroupsChanged;
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Prepare color size groups data for API
      const colorGroupsForApi = colorSizeGroups
        .filter(group => group.color && group.sizes.some(s => s.quantity > 0))
        .map(group => ({
          id: typeof group.id === 'number' && group.id > 1000000 ? undefined : group.id,
          color: group.color,
          total: group.total,
          size_quantities: group.sizes.map(size => ({
            size: size.size,
            quantity: parseInt(size.quantity) || 0,
          })),
        }));

      const formattedData = {
        ...formData,
        final_inspection_date: formData.final_inspection_date?.toISOString().split('T')[0] || null,
        ex_factory: formData.ex_factory?.toISOString().split('T')[0] || null,
        etd: formData.etd?.toISOString().split('T')[0] || null,
        eta: formData.eta?.toISOString().split('T')[0] || null,
        shipment_date: formData.shipment_date?.toISOString().split('T')[0] || null,
        unit_price: parseFloat(formData.unit_price) || null,
        total_qty: parseInt(formData.total_qty) || null,
        total_value: parseFloat(formData.total_value) || null,
        shipped_qty: parseInt(formData.shipped_qty) || 0,
        shipped_value: parseFloat(formData.shipped_value) || 0,
        factory_value: parseFloat(formData.factory_value) || null,
        customer: formData.customer ? parseInt(formData.customer) : null,
        size_type: sizeType,
        size_range: sizeRange,
        grand_total: calculateGrandTotal(),
        color_size_groups: colorGroupsForApi,
      };

      console.log('Submitting order update:', formattedData);
      await updateOrder(id, formattedData);
      setSnackbar({ open: true, message: 'Order updated successfully!', type: 'success' });
      setTimeout(() => navigate(`/orders/${id}`), 1500);
    } catch (error) {
      console.error('Error updating order:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Error updating order', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <div style={styles.tabContent}>
            <div style={styles.formGrid}>
              <div style={styles.formField}>
                <label style={styles.formLabel}>Style <span style={styles.required}>*</span></label>
                <div style={styles.inputWrapper}>
                  <FaBoxes style={styles.inputIcon} />
                  <input type="text" name="style" value={formData.style} onChange={handleChange} style={styles.input} />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>PO Number <span style={styles.required}>*</span></label>
                <div style={styles.inputWrapper}>
                  <FaClipboardList style={styles.inputIcon} />
                  <input type="text" name="po_no" value={formData.po_no} onChange={handleChange} style={styles.input} />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Department</label>
                <div style={styles.inputWrapper}>
                  <FaBuilding style={styles.inputIcon} />
                  <input type="text" name="department" value={formData.department} onChange={handleChange} style={styles.input} />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Customer <span style={styles.required}>*</span></label>
                <div style={styles.inputWrapper}>
                  <FaBuilding style={styles.inputIcon} />
                  <select
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    style={styles.select}
                    disabled={customersLoading}
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.customer_display || customer.customer_name || `Customer ${customer.id}`}
                      </option>
                    ))}
                  </select>
                </div>
                {customersLoading && (
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Loading customers...
                  </div>
                )}
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Garment</label>
                <div style={styles.inputWrapper}>
                  <FaShoppingCart style={styles.inputIcon} />
                  <select name="garment" value={formData.garment} onChange={handleChange} style={styles.select}>
                    <option value="">Select garment type</option>
                    {garmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Ref No</label>
                <div style={styles.inputWrapper}>
                  <FaClipboardList style={styles.inputIcon} />
                  <input type="text" name="ref_no" value={formData.ref_no} onChange={handleChange} style={styles.input} />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Supplier <span style={styles.required}>*</span></label>
                <div style={styles.inputWrapper}>
                  <FaIndustry style={styles.inputIcon} />
                  <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} style={styles.input} />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Shipment Month</label>
                <div style={styles.inputWrapper}>
                  <FaCalendarAlt style={styles.inputIcon} />
                  <input type="text" name="shipment_month" value={formData.shipment_month} onChange={handleChange} style={styles.input} />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Gender</label>
                <div style={styles.inputWrapper}>
                  <FaUser style={styles.inputIcon} />
                  <input type="text" name="gender" value={formData.gender} onChange={handleChange} style={styles.input} />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Item</label>
                <div style={styles.inputWrapper}>
                  <FaShoppingCart style={styles.inputIcon} />
                  <input type="text" name="item" value={formData.item} onChange={handleChange} style={styles.input} />
                </div>
              </div>

              <div style={styles.formFieldFull}>
                <label style={styles.formLabel}>Fabrication</label>
                <div style={styles.inputWrapper}>
                  <FaIndustry style={styles.inputIcon} />
                  <textarea name="fabrication" value={formData.fabrication} onChange={handleChange} rows={3} style={styles.textarea} />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>WGR</label>
                <div style={styles.inputWrapper}>
                  <FaChartLine style={styles.inputIcon} />
                  <input type="text" name="wgr" value={formData.wgr} onChange={handleChange} style={styles.input} />
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div style={styles.tabContent}>
            <div style={styles.formGrid}>
              <div style={styles.formField}>
                <label style={styles.formLabel}>Unit Price ($) <span style={styles.required}>*</span></label>
                <div style={styles.inputWrapper}>
                  <FaDollarSign style={styles.inputIcon} />
                  <input type="number" name="unit_price" value={formData.unit_price} onChange={handleChange} step="0.01" min="0" style={styles.input} />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Total Quantity <span style={styles.required}>*</span></label>
                <div style={styles.inputWrapper}>
                  <FaBoxes style={styles.inputIcon} />
                  <input type="number" name="total_qty" value={formData.total_qty} onChange={handleChange} min="0" style={styles.input} />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Total Value ($) <span style={styles.required}>*</span></label>
                <div style={styles.inputWrapper}>
                  <FaDollarSign style={styles.inputIcon} />
                  <input type="number" name="total_value" value={formData.total_value} onChange={handleChange} step="0.01" min="0" style={styles.input} />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Factory Value ($)</label>
                <div style={styles.inputWrapper}>
                  <FaIndustry style={styles.inputIcon} />
                  <input type="number" name="factory_value" value={formData.factory_value} onChange={handleChange} step="0.01" min="0" style={styles.input} />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Status</label>
                <div style={styles.inputWrapper}>
                  <select name="status" value={formData.status} onChange={handleChange} style={styles.select}>
                    {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Shipped Quantity</label>
                <div style={styles.inputWrapper}>
                  <FaTruck style={styles.inputIcon} />
                  <input type="number" name="shipped_qty" value={formData.shipped_qty} onChange={handleChange} min="0" style={styles.input} />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Shipped Value ($)</label>
                <div style={styles.inputWrapper}>
                  <FaDollarSign style={styles.inputIcon} />
                  <input type="number" name="shipped_value" value={formData.shipped_value} onChange={handleChange} step="0.01" min="0" style={styles.input} />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div style={styles.tabContent}>
            <div style={styles.colorSizingContainer}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Color & Sizing Configuration</h3>
                {availableSizes.length > 0 && (
                  <button onClick={addColorGroup} style={styles.addButton} type="button">
                    <FaPlus /> Add Color
                  </button>
                )}
              </div>

              {/* Size Type Selection */}
              <div style={styles.formGrid}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Size Type</label>
                  <select value={sizeType} onChange={handleSizeTypeChange} style={styles.select}>
                    <option value="numeric">Numeric Sizes</option>
                    <option value="alpha">Alpha Sizes (XS,S,M,L,XL,XXL,XXXL)</option>
                  </select>
                </div>

                <div style={styles.formField}>
                  <label style={styles.formLabel}>
                    {sizeType === "numeric" ? "Size Range" : "Size Selection"}
                  </label>
                  {sizeType === "numeric" ? (
                    <input
                      type="text"
                      value={sizeRange}
                      onChange={handleSizeRangeChange}
                      placeholder="e.g. 2-10 (even numbers only)"
                      style={styles.input}
                    />
                  ) : (
                    <select value={sizeRange} onChange={handleSizeRangeChange} style={styles.select}>
                      <option value="">Select Size Range</option>
                      <option value="all">All Alpha Sizes (XS-XXXL)</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Color & Size Table */}
              {availableSizes.length > 0 && colorSizeGroups.length > 0 && (
                <div style={styles.tableWrapper}>
                  <table style={styles.colorSizeTable}>
                    <thead>
                      <tr>
                        <th style={styles.tableHeader}>Color</th>
                        {availableSizes.map((size) => (
                          <th key={`size-${size.size}`} style={styles.tableHeader}>
                            Size {size.size}
                          </th>
                        ))}
                        <th style={styles.tableHeader}>Total</th>
                        <th style={styles.tableHeader}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {colorSizeGroups.map((group) => (
                        <tr key={group.id}>
                          <td style={styles.tableCell}>
                            <input
                              type="text"
                              value={group.color || ""}
                              onChange={(e) => handleColorChange(group.id, e.target.value)}
                              style={styles.colorInput}
                              placeholder="Color name"
                            />
                          </td>
                          {group.sizes.map((size) => (
                            <td key={`${group.id}-${size.size}`} style={styles.tableCell}>
                              <input
                                type="number"
                                min="0"
                                value={size.quantity || 0}
                                onChange={(e) => handleQuantityChange(group.id, size.size, e.target.value)}
                                style={styles.quantityInput}
                              />
                            </td>
                          ))}
                          <td style={styles.tableCell}>
                            <span style={styles.totalBadge}>{group.total}</span>
                          </td>
                          <td style={styles.tableCell}>
                            <button onClick={() => removeColorGroup(group.id)} style={styles.removeButton} type="button">
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={availableSizes.length + 1} style={styles.tableFooter}>
                          <strong>Grand Total:</strong>
                        </td>
                        <td style={styles.tableFooter}>
                          <span style={styles.grandTotalBadge}>{calculateGrandTotal()}</span>
                        </td>
                        <td style={styles.tableFooter}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {availableSizes.length === 0 && (
                <div style={styles.emptyState}>
                  <FaPalette style={styles.emptyIcon} />
                  <p>Please select a size range above to configure colors and quantities</p>
                </div>
              )}

              {availableSizes.length > 0 && colorSizeGroups.length > 0 && (
                <div style={styles.infoMessage}>
                  <FaCheckCircle style={{ color: "#10b981", marginRight: "8px" }} />
                  <span>Grand total will automatically update based on color quantities</span>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div style={styles.tabContent}>
            <div style={styles.formGrid}>
              <div style={styles.formField}>
                <label style={styles.formLabel}>Final Inspection Date</label>
                <div style={styles.inputWrapper}>
                  <FaCalendarAlt style={styles.inputIcon} />
                  <input type="date" value={formData.final_inspection_date ? formData.final_inspection_date.toISOString().split('T')[0] : ''} onChange={(e) => handleDateChange('final_inspection_date', e.target.value ? new Date(e.target.value) : null)} style={styles.input} />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Ex-Factory Date</label>
                <div style={styles.inputWrapper}>
                  <FaIndustry style={styles.inputIcon} />
                  <input type="date" value={formData.ex_factory ? formData.ex_factory.toISOString().split('T')[0] : ''} onChange={(e) => handleDateChange('ex_factory', e.target.value ? new Date(e.target.value) : null)} style={styles.input} />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>ETD</label>
                <div style={styles.inputWrapper}>
                  <FaTruck style={styles.inputIcon} />
                  <input type="date" value={formData.etd ? formData.etd.toISOString().split('T')[0] : ''} onChange={(e) => handleDateChange('etd', e.target.value ? new Date(e.target.value) : null)} style={styles.input} />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>ETA</label>
                <div style={styles.inputWrapper}>
                  <FaTruck style={styles.inputIcon} />
                  <input type="date" value={formData.eta ? formData.eta.toISOString().split('T')[0] : ''} onChange={(e) => handleDateChange('eta', e.target.value ? new Date(e.target.value) : null)} style={styles.input} />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Shipment Date</label>
                <div style={styles.inputWrapper}>
                  <FaCalendarAlt style={styles.inputIcon} />
                  <input type="date" value={formData.shipment_date ? formData.shipment_date.toISOString().split('T')[0] : ''} onChange={(e) => handleDateChange('shipment_date', e.target.value ? new Date(e.target.value) : null)} style={styles.input} />
                </div>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>Group Name</label>
                <div style={styles.inputWrapper}>
                  <FaUser style={styles.inputIcon} />
                  <input type="text" name="group_name" value={formData.group_name} onChange={handleChange} style={styles.input} />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div style={styles.tabContent}>
            <div style={styles.formGrid}>
              <div style={styles.formFieldFull}>
                <label style={styles.formLabel}>Physical Test</label>
                <div style={styles.inputWrapper}>
                  <FaFlask style={styles.inputIcon} />
                  <textarea name="physical_test" value={formData.physical_test} onChange={handleChange} rows={3} style={styles.textarea} />
                </div>
              </div>

              <div style={styles.formFieldFull}>
                <label style={styles.formLabel}>Chemical Test</label>
                <div style={styles.inputWrapper}>
                  <FaFlask style={styles.inputIcon} />
                  <textarea name="chemical_test" value={formData.chemical_test} onChange={handleChange} rows={3} style={styles.textarea} />
                </div>
              </div>

              <div style={styles.formFieldFull}>
                <label style={styles.formLabel}>During Production Inspection</label>
                <div style={styles.inputWrapper}>
                  <FaClipboardList style={styles.inputIcon} />
                  <textarea name="during_production_inspection" value={formData.during_production_inspection} onChange={handleChange} rows={3} style={styles.textarea} />
                </div>
              </div>

              <div style={styles.formFieldFull}>
                <label style={styles.formLabel}>Final Random Inspection</label>
                <div style={styles.inputWrapper}>
                  <FaClipboardList style={styles.inputIcon} />
                  <textarea name="final_random_inspection" value={formData.final_random_inspection} onChange={handleChange} rows={3} style={styles.textarea} />
                </div>
              </div>

              <div style={styles.formFieldFull}>
                <label style={styles.formLabel}>Remarks</label>
                <div style={styles.inputWrapper}>
                  <FaInfoCircle style={styles.inputIcon} />
                  <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={3} style={styles.textarea} />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={styles.appContainer}>
        <Sidebar />
        <div style={styles.mainContent}>
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p style={{ color: "#64748b" }}>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      <Sidebar />
      <div style={styles.mainContent}>
        <div style={styles.editOrderContainer}>
          {/* Header */}
          <div style={styles.pageHeader}>
            <div style={styles.headerLeft}>
              <button style={styles.backButton} onClick={() => navigate(`/orders/${id}`)}>
                <FaArrowLeft />
              </button>
              <div>
                <h1 style={styles.pageTitle}>Edit Order</h1>
                <p style={styles.pageSubtitle}>Update order information for #{formData.po_no || id}</p>
              </div>
            </div>
            <div style={styles.headerActions}>
              <button style={styles.btnCancel} onClick={() => navigate(`/orders/${id}`)}>
                <FaTimes style={{ marginRight: '8px' }} /> Cancel
              </button>
              <button style={styles.btnPrimary} onClick={handleSubmit} disabled={saving || !hasChanges()}>
                {saving ? 'Saving...' : (
                  <>
                    <FaSave style={{ marginRight: '8px' }} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Status Badge */}
          <div style={{ ...styles.statusBadge, ...styles[formData.status?.toLowerCase()] }}>
            <span>{statusOptions.find(s => s.value === formData.status)?.label || formData.status}</span>
          </div>

          {/* Tabs */}
          <div style={styles.tabsContainer}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === tab.id ? styles.tabButtonActive : {}),
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Form Card */}
          <div style={styles.formCard}>
            {renderTabContent()}
          </div>

          {/* Snackbar */}
          {snackbar.open && (
            <div style={{
              ...styles.snackbar,
              backgroundColor: snackbar.type === 'success' ? '#10b981' : snackbar.type === 'error' ? '#ef4444' : '#f59e0b',
            }}>
              <span>{snackbar.message}</span>
              <button onClick={() => setSnackbar({ ...snackbar, open: false })} style={styles.snackbarClose}>×</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  appContainer: {
    display: "flex",
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#0f172a",
    height: "100vh",
    overflow: "hidden",
  },
  mainContent: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
    height: "100vh",
  },
  editOrderContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
    transition: "all 0.2s",
    color: "#475569",
  },
  pageTitle: {
    fontSize: "28px",
    fontWeight: 600,
    color: "#0f172a",
    margin: 0,
    marginBottom: "4px",
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    padding: "8px 20px",
    borderRadius: "8px",
    fontWeight: 500,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "none",
    background: "#2563eb",
    color: "white",
  },
  btnCancel: {
    display: "flex",
    alignItems: "center",
    padding: "8px 20px",
    borderRadius: "8px",
    fontWeight: 500,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#475569",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 500,
    marginBottom: "20px",
  },
  running: {
    background: "#d1fae5",
    color: "#10b981",
  },
  shipped: {
    background: "#dbeafe",
    color: "#3b82f6",
  },
  pending: {
    background: "#fed7aa",
    color: "#f59e0b",
  },
  cancelled: {
    background: "#fee2e2",
    color: "#ef4444",
  },
  tabsContainer: {
    display: "flex",
    gap: "8px",
    background: "white",
    borderRadius: "12px",
    padding: "8px",
    border: "1px solid #e2e8f0",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  tabButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
    border: "none",
    background: "transparent",
    color: "#64748b",
  },
  tabButtonActive: {
    background: "#eff6ff",
    color: "#2563eb",
  },
  formCard: {
    background: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  tabContent: {
    padding: "32px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "24px",
  },
  formField: {
    display: "flex",
    flexDirection: "column",
  },
  formFieldFull: {
    display: "flex",
    flexDirection: "column",
    gridColumn: "span 2",
  },
  formLabel: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#334155",
    marginBottom: "6px",
  },
  required: {
    color: "#ef4444",
  },
  inputWrapper: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    fontSize: "16px",
  },
  input: {
    width: "100%",
    height: "44px",
    padding: "0 12px 0 38px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s",
    fontFamily: "inherit",
  },
  select: {
    width: "100%",
    height: "44px",
    padding: "0 12px 0 38px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    background: "white",
    fontFamily: "inherit",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px 10px 38px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    resize: "vertical",
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    textAlign: "center",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    marginBottom: "20px",
  },
  snackbar: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    padding: "12px 20px",
    borderRadius: "10px",
    color: "white",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    zIndex: 1000,
    animation: "slideIn 0.3s ease",
  },
  snackbarClose: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "20px",
    cursor: "pointer",
    padding: "0 4px",
  },
  // Color & Sizing specific styles
  colorSizingContainer: {
    padding: "0",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#1e293b",
    margin: 0,
  },
  addButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tableWrapper: {
    overflowX: "auto",
    marginTop: "20px",
  },
  colorSizeTable: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "white",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  tableHeader: {
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderBottom: "2px solid #e2e8f0",
    textAlign: "center",
    fontSize: "13px",
    fontWeight: 600,
    color: "#475569",
  },
  tableCell: {
    padding: "10px",
    borderBottom: "1px solid #e2e8f0",
    textAlign: "center",
  },
  colorInput: {
    width: "120px",
    padding: "8px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "13px",
    textAlign: "center",
  },
  quantityInput: {
    width: "70px",
    padding: "8px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "13px",
    textAlign: "center",
  },
  totalBadge: {
    display: "inline-block",
    padding: "4px 12px",
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 600,
  },
  grandTotalBadge: {
    display: "inline-block",
    padding: "6px 16px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: 700,
  },
  removeButton: {
    background: "none",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px 8px",
    borderRadius: "4px",
    transition: "all 0.2s",
  },
  tableFooter: {
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderTop: "2px solid #e2e8f0",
    textAlign: "center",
    fontWeight: 500,
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    marginTop: "20px",
  },
  emptyIcon: {
    fontSize: "48px",
    color: "#cbd5e1",
    marginBottom: "16px",
  },
  infoMessage: {
    marginTop: "24px",
    padding: "12px 16px",
    background: "#f0fdf4",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    fontSize: "13px",
    color: "#166534",
  },
};

// Add keyframes
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  input:focus, select:focus, textarea:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  button:hover {
    transform: translateY(-1px);
  }
  
  .btn-primary:hover {
    background: #1d4ed8;
  }
  
  .btn-cancel:hover, .btn-outline:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }
  
  .back-button:hover {
    background: #f1f5f9;
  }
`;
document.head.appendChild(styleSheet);

export default EditOrder;