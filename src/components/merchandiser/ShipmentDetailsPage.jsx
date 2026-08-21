// src/components/merchandiser/ShipmentDetailsPage.jsx
//
// Step 2 of the Courier Management flow (spec section 3, "Shipment
// Details"). Shows a single booking's line items, lets the merchandiser
// add/edit/remove items (pulling order fields via autocomplete), shows the
// cost breakdown / totals, and handles the booking-level file uploads.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import {
  getCourierBookingById,
  getCourierBookingItems,
  createCourierBookingItem,
  updateCourierBookingItem,
  deleteCourierBookingItem,
  updateCourierBookingStatus,
  reopenCourierBooking,
  patchCourierBooking,
  getCourierDocuments,
  uploadCourierDocument,
  deleteCourierDocument,
  getOrders,
  getCourierStatusOptions,
} from '../../api/merchandiser';

const emptyItemForm = {
  order: null,
  order_display: '',
  no_order: false,
  order_no: '',
  item_description: '',
  wgr: '',
  factory: '',
  department: '',
  fabrication_type: '',
  sample_type: '',
  size: '',
  qty: '',
  unit_value: '',
  total_value: '',
  total_value_touched: false,
  hs_code: '',
  article_no: '',
  fabric_actual: false,
  sample_roll: false,
  substitute: false,
  country_of_origin: 'Bangladesh',
  item_remarks: '',
};

// Mirrors merchandiser.models.SampleType on the backend, so a Sample Type
// picked here lines up with the same taxonomy used in Sample Management /
// the Order detail page's Samples tab.
const SAMPLE_TYPE_OPTIONS = [
  { value: '', label: 'Select Sample Type...' },
  { value: 'Lab Dip', label: 'Lab Dip' },
  { value: 'Fabric', label: 'Fabric' },
  { value: 'Fit Sample', label: 'Fit Sample' },
  { value: 'PP Sample', label: 'PP Sample' },
  { value: 'PS / Shipment Sample', label: 'PS / Shipment Sample' },
  { value: 'Counter Sample', label: 'Counter Sample' },
  { value: 'Photo Sample', label: 'Photo Sample' },
  { value: 'E-Commerce Sample', label: 'E-Commerce Sample' },
  { value: 'Other', label: 'Other' },
];

const statusColors = {
  booked: '#3b82f6',
  in_transit: '#f59e0b',
  delivered: '#22c55e',
  cancelled: '#dc2626',
};

export default function ShipmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const [booking, setBooking] = useState(null);
  const [items, setItems] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [savingItem, setSavingItem] = useState(false);
  const [itemError, setItemError] = useState(null);

  const [orderSearch, setOrderSearch] = useState('');
  const [orderResults, setOrderResults] = useState([]);
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [searchingOrders, setSearchingOrders] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [packagesInput, setPackagesInput] = useState('');
  const [courierChargeInput, setCourierChargeInput] = useState('');
  const [additionalCostInput, setAdditionalCostInput] = useState('');

  const statusOptions = getCourierStatusOptions();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingRes, itemsRes, docsRes] = await Promise.all([
        getCourierBookingById(id),
        getCourierBookingItems(id),
        getCourierDocuments(id),
      ]);
      const bookingData = bookingRes.data;
      setBooking(bookingData);
      setItems(itemsRes);
      setDocuments(docsRes);
      setPackagesInput(bookingData.total_packages ?? '');
      setCourierChargeInput(bookingData.courier_charge ?? '');
      setAdditionalCostInput(bookingData.additional_cost ?? '');
    } catch (err) {
      console.error('Error loading shipment details:', err);
      setError('Failed to load shipment details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Close order dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowOrderDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced order search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!orderSearch || orderSearch.length < 2) {
      setOrderResults([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingOrders(true);
      try {
        const res = await getOrders(1, 20, { filters: { search: orderSearch } });
        setOrderResults(res.data || []);
      } catch (err) {
        console.error('Error searching orders:', err);
      } finally {
        setSearchingOrders(false);
      }
    }, 300);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [orderSearch]);

  const openAddItemModal = () => {
    setEditingItemId(null);
    setItemForm(emptyItemForm);
    setOrderSearch('');
    setOrderResults([]);
    setItemError(null);
    setShowItemModal(true);
  };

  const openEditItemModal = (item) => {
    setEditingItemId(item.id);
    setItemForm({
      order: item.order || null,
      order_display: item.order ? `${item.order_pdm_no || item.order_po_no || ''} - ${item.order_style || ''}` : '',
      no_order: !item.order,
      order_no: item.order_no || '',
      item_description: item.item_description || '',
      wgr: item.wgr || '',
      factory: item.factory || '',
      department: item.department || '',
      fabrication_type: item.fabrication_type || '',
      sample_type: item.sample_type || '',
      size: item.size || '',
      qty: item.qty ?? '',
      unit_value: item.unit_value ?? '',
      total_value: item.total_value ?? '',
      total_value_touched: true,
      hs_code: item.hs_code || '',
      article_no: item.article_no || '',
      fabric_actual: !!item.fabric_actual,
      sample_roll: !!item.sample_roll,
      substitute: !!item.substitute,
      country_of_origin: item.country_of_origin || 'Bangladesh',
      item_remarks: item.item_remarks || '',
    });
    setOrderSearch('');
    setOrderResults([]);
    setItemError(null);
    setShowItemModal(true);
  };

  const handleSelectOrder = (order) => {
    setItemForm((prev) => ({
      ...prev,
      order: order.id,
      // PDM No. (starts with "P") is the single canonical order
      // reference; po_no can hold multiple comma-separated PO numbers
      // and is kept only as a fallback.
      order_display: `${order.pdm_no || order.po_no || 'N/A'} - ${order.style || 'N/A'} (${order.customer_name || 'No Customer'})`,
      order_no: order.pdm_no || order.po_no || prev.order_no,
      item_description: order.item || prev.item_description,
      wgr: order.wgr || prev.wgr,
      factory: order.supplier_name || prev.factory,
      department: order.department_name || prev.department,
      fabrication_type: order.fabrication || prev.fabrication_type,
      size: prev.size || order.size_range || '',
    }));
    setOrderSearch('');
    setShowOrderDropdown(false);
  };

  const handleNoOrderToggle = () => {
    setItemForm((prev) => ({
      ...prev,
      no_order: !prev.no_order,
      order: prev.no_order ? prev.order : null,
      order_display: prev.no_order ? prev.order_display : '',
    }));
  };

  const handleItemFieldChange = (field, value) => {
    setItemForm((prev) => {
      const next = { ...prev, [field]: value };
      if ((field === 'qty' || field === 'unit_value') && !prev.total_value_touched) {
        const qty = parseFloat(field === 'qty' ? value : prev.qty) || 0;
        const unit = parseFloat(field === 'unit_value' ? value : prev.unit_value) || 0;
        next.total_value = qty && unit ? (qty * unit).toFixed(2) : '';
      }
      return next;
    });
  };

  const handleTotalValueChange = (value) => {
    setItemForm((prev) => ({ ...prev, total_value: value, total_value_touched: true }));
  };

  const handleSaveItem = async () => {
    if (booking?.is_locked) {
      setItemError('This booking is delivered and locked. Reopen it before editing items.');
      return;
    }
    setSavingItem(true);
    setItemError(null);
    try {
      const payload = {
        booking: id,
        order: itemForm.no_order ? null : itemForm.order,
        order_no: itemForm.order_no || '',
        item_description: itemForm.item_description || '',
        wgr: itemForm.wgr || '',
        factory: itemForm.factory || '',
        department: itemForm.department || '',
        fabrication_type: itemForm.fabrication_type || '',
        sample_type: itemForm.sample_type || '',
        size: itemForm.size || '',
        qty: itemForm.qty === '' ? null : parseInt(itemForm.qty, 10),
        unit_value: itemForm.unit_value === '' ? null : parseFloat(itemForm.unit_value),
        total_value: itemForm.total_value === '' ? null : parseFloat(itemForm.total_value),
        hs_code: itemForm.hs_code || '',
        article_no: itemForm.article_no || '',
        fabric_actual: itemForm.fabric_actual ? 'Yes' : '',
        sample_roll: !!itemForm.sample_roll,
        substitute: !!itemForm.substitute,
        country_of_origin: itemForm.country_of_origin || 'Bangladesh',
        item_remarks: itemForm.item_remarks || '',
      };

      if (editingItemId) {
        await updateCourierBookingItem(editingItemId, payload);
      } else {
        await createCourierBookingItem(payload);
      }

      setShowItemModal(false);
      await fetchAll();
    } catch (err) {
      console.error('Error saving item:', err);
      const msg = err.response?.data?.error ||
        (typeof err.response?.data === 'object' ? Object.values(err.response.data).flat().join(' ') : null) ||
        'Failed to save item';
      setItemError(msg);
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Remove this item from the shipment?')) return;
    try {
      await deleteCourierBookingItem(itemId);
      await fetchAll();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert(err.response?.data?.error || 'Failed to delete item');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateCourierBookingStatus(id, { status: newStatus });
      await fetchAll();
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleReopen = async () => {
    try {
      await reopenCourierBooking(id);
      await fetchAll();
    } catch (err) {
      console.error('Error reopening booking:', err);
      alert('Failed to reopen booking');
    }
  };

  const handleSaveCostFields = async () => {
    try {
      await patchCourierBooking(id, {
        total_packages: packagesInput === '' ? null : parseInt(packagesInput, 10),
        courier_charge: courierChargeInput === '' ? 0 : parseFloat(courierChargeInput),
        additional_cost: additionalCostInput === '' ? 0 : parseFloat(additionalCostInput),
      });
      await fetchAll();
    } catch (err) {
      console.error('Error saving cost fields:', err);
      alert('Failed to save cost breakdown');
    }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadCourierDocument(id, file);
      await fetchAll();
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Delete this file?')) return;
    try {
      await deleteCourierDocument(docId);
      await fetchAll();
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete file');
    }
  };

  const totalQty = items.reduce((sum, it) => sum + (parseInt(it.qty, 10) || 0), 0);

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading shipment details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.loadingContainer}>
          <p>{error || 'Booking not found'}</p>
          <button onClick={() => navigate('/courier')} style={styles.btnOutline}>← Back to Courier List</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.pageHeader}>
          <div>
            <button onClick={() => navigate('/courier')} style={styles.backLink}>← Courier Booking List</button>
            <h1 style={styles.pageTitle}>Shipment Details</h1>
            <p style={styles.pageSubtitle}>
              Tracking No. <strong>{booking.tracking_no}</strong> • {booking.courier_name} • {booking.type_display}
            </p>
          </div>
          <div style={styles.headerActions}>
            <Link to={`/courier/edit/${id}`} style={styles.btnOutline}>✏️ Edit Booking</Link>
            {booking.is_locked ? (
              <button onClick={handleReopen} style={styles.btnOutline}>🔓 Reopen</button>
            ) : (
              <select
                value={booking.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={styles.statusSelect}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
            <button onClick={openAddItemModal} style={styles.btnPrimary} disabled={booking.is_locked}>
              + Add Item
            </button>
          </div>
        </div>

        {booking.is_locked && (
          <div style={styles.lockedBanner}>
            🔒 This shipment is Delivered and locked for edits. Use "Reopen" to make corrections.
          </div>
        )}

        {/* Booking summary card */}
        <div style={styles.summaryGrid}>
          <SummaryField label="Booking Date" value={formatDate(booking.booking_date)} />
          <SummaryField label="Sender" value={booking.sender} />
          <SummaryField label="Receiver" value={booking.receiver} />
          <SummaryField label="Weight" value={booking.weight ? `${booking.weight} kg` : '-'} />
          <SummaryField label="Status" value={<StatusBadge status={booking.status} label={booking.status_display} />} />
          <SummaryField label="Delivered Date" value={formatDate(booking.delivered_date)} />
        </div>
        {booking.remarks && (
          <div style={styles.remarksBanner}><strong>Remarks:</strong> {booking.remarks}</div>
        )}

        {/* Items table */}
        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <span style={styles.tableTitle}>Items ({items.length})</span>
          </div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Order No.</th>
                  <th style={styles.th}>Item Description</th>
                  <th style={styles.th}>WGR</th>
                  <th style={styles.th}>Factory</th>
                  <th style={styles.th}>Dept.</th>
                  <th style={styles.th}>Sample Type</th>
                  <th style={styles.th}>Size</th>
                  <th style={styles.th}>Qty</th>
                  <th style={styles.th}>Unit Value</th>
                  <th style={styles.th}>Total Value</th>
                  <th style={styles.th}>HS Code</th>
                  <th style={styles.th}>Article No.</th>
                  <th style={styles.th}>Origin</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={14} style={styles.emptyCell}>
                      <div style={styles.emptyState}>
                        <span style={styles.emptyIcon}>📦</span>
                        <h3>No items yet</h3>
                        <p>Add the first item to this shipment.</p>
                        <button onClick={openAddItemModal} style={styles.clearFiltersBtn} disabled={booking.is_locked}>
                          + Add Item
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.id} style={styles.tr}>
                      <td style={styles.td}>{it.order_style || '-'}</td>
                      <td style={styles.td}>{it.item_description || '-'}</td>
                      <td style={styles.td}>{it.wgr || '-'}</td>
                      <td style={styles.td}>{it.factory || '-'}</td>
                      <td style={styles.td}>{it.department || '-'}</td>
                      <td style={styles.td}>{it.sample_type || '-'}</td>
                      <td style={styles.td}>{it.size || '-'}</td>
                      <td style={styles.td}>{it.qty ?? '-'}</td>
                      <td style={styles.td}>{it.unit_value ? `$${it.unit_value}` : '-'}</td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{it.total_value ? `$${it.total_value}` : '-'}</td>
                      <td style={styles.td}>{it.hs_code || '-'}</td>
                      <td style={styles.td}>{it.article_no || '-'}</td>
                      <td style={styles.td}>{it.country_of_origin || '-'}</td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button onClick={() => openEditItemModal(it)} style={styles.editBtn} title="Edit" disabled={booking.is_locked}>✏️</button>
                          <button onClick={() => handleDeleteItem(it.id)} style={styles.deleteBtn} title="Delete" disabled={booking.is_locked}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cost breakdown / totals */}
        <div style={styles.costCard}>
          <h3 style={styles.sectionTitle}>Shipment Cost Breakdown</h3>
          <div style={styles.costGrid}>
            <CostField label="Total Quantity" value={totalQty} readOnly />
            <CostField label="Total Item Value ($)" value={booking.total_item_value} readOnly />
            <CostField
              label="Total Packages"
              value={packagesInput}
              onChange={setPackagesInput}
              onBlur={handleSaveCostFields}
              editable
            />
            <CostField
              label="Courier Charge ($)"
              value={courierChargeInput}
              onChange={setCourierChargeInput}
              onBlur={handleSaveCostFields}
              editable
            />
            <CostField
              label="Additional Cost ($)"
              value={additionalCostInput}
              onChange={setAdditionalCostInput}
              onBlur={handleSaveCostFields}
              editable
            />
            <CostField label="Total Shipment Cost ($)" value={booking.total_shipment_cost} readOnly highlight />
          </div>
        </div>

        {/* Upload File section */}
        <div style={styles.costCard}>
          <div style={styles.uploadHeader}>
            <h3 style={styles.sectionTitle}>Documents</h3>
            <label style={styles.uploadBtn}>
              {uploading ? 'Uploading...' : '⬆ Upload File'}
              <input ref={fileInputRef} type="file" onChange={handleUploadFile} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>
          {documents.length === 0 ? (
            <p style={styles.noDocsText}>No files uploaded yet.</p>
          ) : (
            <div style={styles.docList}>
              {documents.map((doc) => (
                <div key={doc.id} style={styles.docRow}>
                  <a href={doc.file} target="_blank" rel="noreferrer" style={styles.docLink}>
                    📄 {doc.file.split('/').pop()}
                  </a>
                  <button onClick={() => handleDeleteDocument(doc.id)} style={styles.deleteBtn} title="Delete">🗑</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {showItemModal && (
        <div style={styles.modalOverlay} onClick={() => setShowItemModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingItemId ? 'Edit Item' : 'Add Item'}</h2>
              <button onClick={() => setShowItemModal(false)} style={styles.modalClose}>✕</button>
            </div>

            {itemError && (
              <div style={styles.errorAlert}>
                <span>❌</span><span>{itemError}</span>
              </div>
            )}

            <div style={styles.modalBody}>
              {/* Order search */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Order (search by PO No., Style, or Item)
                  <label style={styles.noOrderToggle}>
                    <input type="checkbox" checked={itemForm.no_order} onChange={handleNoOrderToggle} />
                    {' '}No linked order
                  </label>
                </label>
                {!itemForm.no_order && (
                  <div style={styles.orderSearchWrapper} ref={dropdownRef}>
                    <input
                      type="text"
                      value={itemForm.order ? itemForm.order_display : orderSearch}
                      onChange={(e) => {
                        setOrderSearch(e.target.value);
                        setShowOrderDropdown(true);
                        setItemForm((prev) => ({ ...prev, order: null, order_display: '' }));
                      }}
                      onFocus={() => setShowOrderDropdown(true)}
                      placeholder="Search orders..."
                      style={styles.input}
                    />
                    {showOrderDropdown && (orderResults.length > 0 || searchingOrders) && (
                      <div style={styles.orderDropdown}>
                        {searchingOrders ? (
                          <div style={styles.orderDropdownEmpty}>Searching...</div>
                        ) : (
                          orderResults.map((order) => (
                            <div
                              key={order.id}
                              style={styles.orderDropdownItem}
                              onClick={() => handleSelectOrder(order)}
                            >
                              <span style={styles.orderDropdownPo}>{order.po_no || 'N/A'}</span>
                              <span style={styles.orderDropdownStyle}>{order.style || ''}</span>
                              <span style={styles.orderDropdownCustomer}>{order.customer_name || ''}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
                {itemForm.no_order && (
                  <p style={styles.searchHint}>Order fields below are unlocked for manual entry (e.g. document courier, non-order sample).</p>
                )}
              </div>

              {/* Pulled / editable order fields */}
              <div style={styles.formRow}>
                <FormField label="Order No." value={itemForm.order_no} onChange={(v) => handleItemFieldChange('order_no', v)} />
                <FormField label="Item Description" value={itemForm.item_description} onChange={(v) => handleItemFieldChange('item_description', v)} />
                <FormField label="WGR" value={itemForm.wgr} onChange={(v) => handleItemFieldChange('wgr', v)} />
              </div>
              <div style={styles.formRow}>
                <FormField label="Factory" value={itemForm.factory} onChange={(v) => handleItemFieldChange('factory', v)} />
                <FormField label="Department" value={itemForm.department} onChange={(v) => handleItemFieldChange('department', v)} />
                <FormField label="Fabrication Type" value={itemForm.fabrication_type} onChange={(v) => handleItemFieldChange('fabrication_type', v)} />
              </div>

              {/* Manual fields */}
              <div style={styles.formRow}>
                <SelectField label="Sample Type" value={itemForm.sample_type} onChange={(v) => handleItemFieldChange('sample_type', v)} options={SAMPLE_TYPE_OPTIONS} />
                <FormField label="Size" value={itemForm.size} onChange={(v) => handleItemFieldChange('size', v)} />
                <FormField label="Qty" type="number" value={itemForm.qty} onChange={(v) => handleItemFieldChange('qty', v)} />
              </div>
              <div style={styles.formRow}>
                <FormField label="Unit Value ($)" type="number" step="0.0001" value={itemForm.unit_value} onChange={(v) => handleItemFieldChange('unit_value', v)} />
                <FormField label="Total Value ($)" type="number" step="0.01" value={itemForm.total_value} onChange={handleTotalValueChange} />
                <FormField label="HS Code" value={itemForm.hs_code} onChange={(v) => handleItemFieldChange('hs_code', v)} />
              </div>
              <div style={styles.formRow}>
                <FormField label="Article No." value={itemForm.article_no} onChange={(v) => handleItemFieldChange('article_no', v)} />
                <FormField label="Country of Origin" value={itemForm.country_of_origin} onChange={(v) => handleItemFieldChange('country_of_origin', v)} />
                <div style={styles.formGroup}>
                  <label style={styles.label}>Fabric</label>
                  <div style={styles.radioGroup}>
                    {['Actual', 'Sample Roll', 'Substitute'].map((opt) => {
                      const key = opt === 'Actual' ? 'fabric_actual' : opt === 'Sample Roll' ? 'sample_roll' : 'substitute';
                      const checked = !!itemForm[key];
                      return (
                        <label key={key} style={styles.radioLabel}>
                          <input
                            type="radio"
                            name="fabric_option"
                            checked={checked}
                            onChange={() => setItemForm((prev) => ({
                              ...prev,
                              fabric_actual: key === 'fabric_actual',
                              sample_roll: key === 'sample_roll',
                              substitute: key === 'substitute',
                            }))}
                          />
                          {' '}{opt}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, gridColumn: 'span 3' }}>
                  <label style={styles.label}>Item Remarks</label>
                  <input
                    type="text"
                    value={itemForm.item_remarks}
                    onChange={(e) => handleItemFieldChange('item_remarks', e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setShowItemModal(false)} style={styles.btnCancel}>Cancel</button>
              <button onClick={handleSaveItem} disabled={savingItem} style={styles.btnPrimary}>
                {savingItem ? 'Saving...' : editingItemId ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryField({ label, value }) {
  return (
    <div style={styles.summaryField}>
      <span style={styles.summaryLabel}>{label}</span>
      <span style={styles.summaryValue}>{value || '-'}</span>
    </div>
  );
}

function CostField({ label, value, onChange, onBlur, editable, readOnly, highlight }) {
  return (
    <div style={styles.summaryField}>
      <span style={styles.summaryLabel}>{label}</span>
      {editable ? (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          style={styles.costInput}
        />
      ) : (
        <span style={{ ...styles.summaryValue, ...(highlight ? styles.summaryValueHighlight : {}) }}>
          {value !== undefined && value !== null ? value : '-'}
        </span>
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div style={styles.formGroup}>
      <label style={styles.label}>{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', step, placeholder }) {
  return (
    <div style={styles.formGroup}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
      />
    </div>
  );
}

function StatusBadge({ status, label }) {
  const color = statusColors[status] || '#6b7280';
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      background: color + '15',
      color,
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 500,
    }}>
      {label || status}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', background: '#f5f7fa', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  mainContent: { flex: 1, padding: '24px 32px', overflow: 'auto', maxHeight: '100vh' },
  loadingContainer: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' },
  spinner: { width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' },
  backLink: { background: 'none', border: 'none', color: '#1a73e8', fontSize: '13px', cursor: 'pointer', padding: 0, marginBottom: '6px' },
  pageTitle: { fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' },
  headerActions: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  btnPrimary: { background: '#1a73e8', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' },
  btnOutline: { background: 'white', color: '#1a73e8', padding: '10px 16px', borderRadius: '8px', border: '1px solid #d0d5dd', fontSize: '14px', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' },
  btnCancel: { padding: '10px 20px', background: 'white', color: '#0f172a', border: '1px solid #d0d5dd', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
  statusSelect: { padding: '9px 12px', border: '1px solid #d0d5dd', borderRadius: '8px', fontSize: '13px', background: 'white', cursor: 'pointer' },
  lockedBanner: { background: '#fef3c7', color: '#92400e', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', border: '1px solid #fde68a' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', background: 'white', borderRadius: '10px', padding: '16px 20px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  summaryField: { display: 'flex', flexDirection: 'column', gap: '4px' },
  summaryLabel: { fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' },
  summaryValue: { fontSize: '14px', color: '#0f172a', fontWeight: 500 },
  summaryValueHighlight: { color: '#1a73e8', fontWeight: 700, fontSize: '16px' },
  remarksBanner: { background: 'white', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', fontSize: '13px', color: '#475569', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  tableContainer: { background: 'white', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '16px' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #e8ecf0' },
  tableTitle: { fontSize: '14px', fontWeight: 600, color: '#0f172a' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e8ecf0', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f1f4f8' },
  td: { padding: '9px 12px', fontSize: '13px', color: '#0f172a', verticalAlign: 'middle', whiteSpace: 'nowrap' },
  actionButtons: { display: 'flex', gap: '4px' },
  editBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' },
  emptyCell: { padding: '48px', textAlign: 'center' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' },
  emptyIcon: { fontSize: '40px' },
  clearFiltersBtn: { padding: '8px 20px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  costCard: { background: 'white', borderRadius: '10px', padding: '16px 20px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  sectionTitle: { fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 12px 0' },
  costGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  costInput: { padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', width: '100%' },
  uploadHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  uploadBtn: { background: '#1a73e8', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-block' },
  noDocsText: { fontSize: '13px', color: '#94a3b8' },
  docList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  docRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: '6px' },
  docLink: { color: '#1a73e8', fontSize: '13px', textDecoration: 'none' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: 'white', borderRadius: '12px', width: '100%', maxWidth: '760px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #e8ecf0' },
  modalTitle: { fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 },
  modalClose: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' },
  modalBody: { padding: '20px 24px', overflowY: 'auto', flex: 1 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid #e8ecf0' },
  errorAlert: { background: '#fee2e2', color: '#991b1b', padding: '10px 16px', margin: '0 24px', borderRadius: '8px', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '12px', fontWeight: 500, color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  checkboxLabel: { fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' },
  radioGroup: { display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '4px' },
  radioLabel: { fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', whiteSpace: 'nowrap' },
  noOrderToggle: { fontSize: '12px', fontWeight: 400, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  input: { padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
  orderSearchWrapper: { position: 'relative' },
  orderDropdown: { position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '220px', overflowY: 'auto', zIndex: 1100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  orderDropdownItem: { padding: '9px 12px', display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' },
  orderDropdownPo: { fontWeight: 600, fontSize: '13px', color: '#0f172a', minWidth: '90px' },
  orderDropdownStyle: { fontSize: '13px', color: '#334155' },
  orderDropdownCustomer: { fontSize: '12px', color: '#64748b', marginLeft: 'auto' },
  orderDropdownEmpty: { padding: '14px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' },
  searchHint: { fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginTop: '4px' },
};
