// pages/orders/EditOrder.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  InputAdornment,
  Tab,
  Tabs,
  Chip,
} from '@mui/material';
import {
  Save,
  Cancel,
  Edit,
  Info,
  AttachMoney,
  LocalShipping,
  Science,
  Description,
  Warning,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers';
import { getOrderById, updateOrder } from '../../api/merchandiser';

const statusOptions = [
  { value: 'Running', label: 'Running', color: 'success' },
  { value: 'Shipped', label: 'Shipped', color: 'info' },
  { value: 'Pending', label: 'Pending', color: 'warning' },
  { value: 'Cancelled', label: 'Cancelled', color: 'error' },
];

const garmentOptions = [
  'T-Shirt',
  'Polo Shirt',
  'Henley',
  'Tank Top',
  'Shirt',
  'Blouse',
  'Dress',
  'Skirt',
  'Pants',
  'Jeans',
  'Shorts',
  'Jacket',
  'Hoodie',
  'Sweater',
  'Cardigan',
  'Vest',
  'Jumpsuit',
  'Romper',
  'Activewear',
  'Swimwear',
  'Underwear',
  'Socks',
  'Accessories',
];

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`order-tabpanel-${index}`}
    aria-labelledby={`order-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const EditOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // State for form data
  const [formData, setFormData] = useState({
    // Basic Information
    style: '',
    po_no: '',
    department: '',
    customer: '',
    garment: '',
    ref_no: '',
    supplier: '',
    shipment_month: '',
    gender: '',
    item: '',
    fabrication: '',
    size_range: '',
    wgr: '',
    
    // Pricing and Quantity
    unit_price: '',
    total_qty: '',
    total_value: '',
    factory_value: '',
    status: 'Running',
    
    // Shipping Information
    shipped_qty: 0,
    shipped_value: 0,
    
    // Dates
    final_inspection_date: null,
    ex_factory: null,
    etd: null,
    eta: null,
    shipment_date: null,
    
    // Test Results
    physical_test: '',
    chemical_test: '',
    during_production_inspection: '',
    final_random_inspection: '',
    
    // Additional Information
    group_name: '',
    remarks: '',
  });

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [originalData, setOriginalData] = useState(null);

  // Fetch order data
  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await getOrderById(id);
      const orderData = response.data;
      setOriginalData(orderData);
      
      // Parse dates
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
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      setFetchError(error.response?.data?.message || 'Error loading order details');
      setSnackbar({
        open: true,
        message: 'Error loading order details',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    setTouched(prev => ({ ...prev, [name]: true }));

    // Auto-calculate total value if unit price and quantity are present
    if (name === 'unit_price' || name === 'total_qty') {
      const unitPrice = name === 'unit_price' ? parseFloat(value) : parseFloat(formData.unit_price);
      const quantity = name === 'total_qty' ? parseInt(value) : parseInt(formData.total_qty);
      
      if (!isNaN(unitPrice) && !isNaN(quantity) && unitPrice > 0 && quantity > 0) {
        const totalValue = (unitPrice * quantity).toFixed(2);
        setFormData(prev => ({
          ...prev,
          total_value: totalValue,
        }));
      }
    }
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date,
    }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Format dates
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
      };

      await updateOrder(id, formattedData);
      
      setSnackbar({
        open: true,
        message: 'Order updated successfully!',
        severity: 'success',
      });

      // Navigate back to order detail
      setTimeout(() => {
        navigate(`/orders/${id}`);
      }, 1500);

    } catch (error) {
      console.error('Error updating order:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.response?.data?.detail || 'Error updating order',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!originalData) return false;
    
    const currentFormatted = {
      ...formData,
      final_inspection_date: formData.final_inspection_date?.toISOString().split('T')[0],
      ex_factory: formData.ex_factory?.toISOString().split('T')[0],
      etd: formData.etd?.toISOString().split('T')[0],
      eta: formData.eta?.toISOString().split('T')[0],
      shipment_date: formData.shipment_date?.toISOString().split('T')[0],
    };

    return JSON.stringify(currentFormatted) !== JSON.stringify(originalData);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2 }} color="text.secondary">
            Loading order details...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Warning sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" color="error" gutterBottom>
          Error Loading Order
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {fetchError}
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/orders')}
          sx={{ mt: 2 }}
        >
          Back to Orders
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" fontWeight="bold">
              Edit Order
            </Typography>
            <Chip 
              label={`PO: ${formData.po_no || 'N/A'}`}
              color="primary"
              variant="outlined"
            />
          </Box>
          <Typography variant="body1" color="text.secondary">
            Update order information for #{formData.po_no || formData.id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => navigate(`/orders/${id}`)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            onClick={handleSubmit}
            disabled={saving || !hasChanges()}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            px: 2,
            pt: 2
          }}
        >
          <Tab icon={<Info />} label="Basic Information" iconPosition="start" />
          <Tab icon={<AttachMoney />} label="Pricing & Quantity" iconPosition="start" />
          <Tab icon={<LocalShipping />} label="Dates & Shipping" iconPosition="start" />
          <Tab icon={<Science />} label="Test Results" iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <form>
            {/* Basic Information Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Style"
                    name="style"
                    value={formData.style}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="PO Number"
                    name="po_no"
                    value={formData.po_no}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Customer"
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Garment</InputLabel>
                    <Select
                      name="garment"
                      value={formData.garment}
                      label="Garment"
                      onChange={handleChange}
                    >
                      <MenuItem value="">None</MenuItem>
                      {garmentOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Ref No"
                    name="ref_no"
                    value={formData.ref_no}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Supplier"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Shipment Month"
                    name="shipment_month"
                    value={formData.shipment_month}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Item"
                    name="item"
                    value={formData.item}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Fabrication"
                    name="fabrication"
                    value={formData.fabrication}
                    onChange={handleChange}
                    multiline
                    rows={2}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Size Range"
                    name="size_range"
                    value={formData.size_range}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="WGR"
                    name="wgr"
                    value={formData.wgr}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Pricing & Quantity Tab */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Unit Price ($)"
                    name="unit_price"
                    type="number"
                    value={formData.unit_price}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      inputProps: { min: 0, step: 0.01 }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Total Quantity"
                    name="total_qty"
                    type="number"
                    value={formData.total_qty}
                    onChange={handleChange}
                    required
                    InputProps={{
                      inputProps: { min: 0 }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Total Value ($)"
                    name="total_value"
                    type="number"
                    value={formData.total_value}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      inputProps: { min: 0, step: 0.01 }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Factory Value ($)"
                    name="factory_value"
                    type="number"
                    value={formData.factory_value}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      inputProps: { min: 0, step: 0.01 }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      label="Status"
                      onChange={handleChange}
                      required
                    >
                      {statusOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Shipped Quantity"
                    name="shipped_qty"
                    type="number"
                    value={formData.shipped_qty}
                    onChange={handleChange}
                    InputProps={{
                      inputProps: { min: 0 }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Shipped Value ($)"
                    name="shipped_value"
                    type="number"
                    value={formData.shipped_value}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      inputProps: { min: 0, step: 0.01 }
                    }}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Dates & Shipping Tab */}
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Final Inspection Date"
                    value={formData.final_inspection_date}
                    onChange={(date) => handleDateChange('final_inspection_date', date)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Ex-Factory Date"
                    value={formData.ex_factory}
                    onChange={(date) => handleDateChange('ex_factory', date)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="ETD"
                    value={formData.etd}
                    onChange={(date) => handleDateChange('etd', date)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="ETA"
                    value={formData.eta}
                    onChange={(date) => handleDateChange('eta', date)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Shipment Date"
                    value={formData.shipment_date}
                    onChange={(date) => handleDateChange('shipment_date', date)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Group Name"
                    name="group_name"
                    value={formData.group_name}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Test Results Tab */}
            <TabPanel value={tabValue} index={3}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Physical Test"
                    name="physical_test"
                    value={formData.physical_test}
                    onChange={handleChange}
                    multiline
                    rows={3}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Chemical Test"
                    name="chemical_test"
                    value={formData.chemical_test}
                    onChange={handleChange}
                    multiline
                    rows={3}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="During Production Inspection"
                    name="during_production_inspection"
                    value={formData.during_production_inspection}
                    onChange={handleChange}
                    multiline
                    rows={3}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Final Random Inspection"
                    name="final_random_inspection"
                    value={formData.final_random_inspection}
                    onChange={handleChange}
                    multiline
                    rows={3}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </TabPanel>
          </form>
        </Box>

        {/* Footer with action buttons */}
        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/orders/${id}`)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            disabled={saving || !hasChanges()}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity} 
          sx={{ width: '100%', borderRadius: 2 }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditOrder;