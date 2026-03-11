// pages/orders/AddOrder.jsx
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
  IconButton,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
  FormHelperText,
} from '@mui/material';
import {
  Save,
  Cancel,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  AttachMoney,
  Inventory,
  LocalShipping,
  Description,
  Business,
  Person,
  CalendarToday,
  Science,
  Factory,
  Group,
  Add,
  Delete,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers';
import { createOrder } from '../../api/merchandiser';

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

const steps = [
  {
    label: 'Basic Information',
    description: 'Enter order basic details',
    icon: <Description />,
  },
  {
    label: 'Pricing & Quantity',
    description: 'Set pricing and quantities',
    icon: <AttachMoney />,
  },
  {
    label: 'Dates & Shipping',
    description: 'Schedule and shipping details',
    icon: <LocalShipping />,
  },
  {
    label: 'Test Results & Remarks',
    description: 'Quality control and notes',
    icon: <Science />,
  },
];

const AddOrder = () => {
  const navigate = useNavigate();
  
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
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation
  const validateField = (name, value) => {
    switch (name) {
      case 'style':
      case 'po_no':
      case 'customer':
      case 'supplier':
        return !value ? `${name.replace('_', ' ')} is required` : '';
      
      case 'unit_price':
      case 'total_qty':
      case 'total_value':
        if (!value && value !== 0) return `${name.replace('_', ' ')} is required`;
        if (isNaN(value) || Number(value) < 0) return 'Must be a positive number';
        return '';
      
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['style', 'po_no', 'customer', 'supplier', 'unit_price', 'total_qty', 'total_value'];
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate field
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));

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

  const handleNext = () => {
    // Validate current step before proceeding
    if (activeStep === 0) {
      const stepFields = ['style', 'po_no', 'customer', 'supplier'];
      const stepErrors = {};
      stepFields.forEach(field => {
        const error = validateField(field, formData[field]);
        if (error) stepErrors[field] = error;
      });
      
      if (Object.keys(stepErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...stepErrors }));
        setSnackbar({
          open: true,
          message: 'Please fill in all required fields',
          severity: 'warning',
        });
        return;
      }
    } else if (activeStep === 1) {
      const stepFields = ['unit_price', 'total_qty', 'total_value'];
      const stepErrors = {};
      stepFields.forEach(field => {
        const error = validateField(field, formData[field]);
        if (error) stepErrors[field] = error;
      });
      
      if (Object.keys(stepErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...stepErrors }));
        setSnackbar({
          open: true,
          message: 'Please enter valid pricing information',
          severity: 'warning',
        });
        return;
      }
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fix the errors before submitting',
        severity: 'error',
      });
      return;
    }

    setLoading(true);

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

      const response = await createOrder(formattedData);
      
      setSnackbar({
        open: true,
        message: 'Order created successfully!',
        severity: 'success',
      });

      // Navigate to the new order detail page
      setTimeout(() => {
        navigate(`/orders/${response.data.id}`);
      }, 1500);

    } catch (error) {
      console.error('Error creating order:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.response?.data?.detail || 'Error creating order',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (field) => {
    return touched[field] && errors[field] ? errors[field] : '';
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Style"
                name="style"
                value={formData.style}
                onChange={handleChange}
                error={!!getFieldError('style')}
                helperText={getFieldError('style')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Inventory color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="PO Number"
                name="po_no"
                value={formData.po_no}
                onChange={handleChange}
                error={!!getFieldError('po_no')}
                helperText={getFieldError('po_no')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Description color="primary" />
                    </InputAdornment>
                  ),
                }}
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
                required
                label="Customer"
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                error={!!getFieldError('customer')}
                helperText={getFieldError('customer')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business color="primary" />
                    </InputAdornment>
                  ),
                }}
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
                required
                label="Supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                error={!!getFieldError('supplier')}
                helperText={getFieldError('supplier')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Shipment Month"
                name="shipment_month"
                value={formData.shipment_month}
                onChange={handleChange}
                placeholder="e.g., January 2024"
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
                placeholder="Enter fabrication details..."
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Size Range"
                name="size_range"
                value={formData.size_range}
                onChange={handleChange}
                placeholder="e.g., S-XXL"
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
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="Unit Price ($)"
                name="unit_price"
                type="number"
                value={formData.unit_price}
                onChange={handleChange}
                error={!!getFieldError('unit_price')}
                helperText={getFieldError('unit_price')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="Total Quantity"
                name="total_qty"
                type="number"
                value={formData.total_qty}
                onChange={handleChange}
                error={!!getFieldError('total_qty')}
                helperText={getFieldError('total_qty')}
                InputProps={{
                  inputProps: { min: 0 }
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="Total Value ($)"
                name="total_value"
                type="number"
                value={formData.total_value}
                onChange={handleChange}
                error={!!getFieldError('total_value')}
                helperText={getFieldError('total_value')}
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

            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                <CheckCircle color="success" sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                Total value auto-calculated from unit price × quantity
              </Typography>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Final Inspection Date"
                value={formData.final_inspection_date}
                onChange={(date) => handleDateChange('final_inspection_date', date)}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarToday color="primary" />
                        </InputAdornment>
                      ),
                    }
                  } 
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Ex-Factory Date"
                value={formData.ex_factory}
                onChange={(date) => handleDateChange('ex_factory', date)}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Factory color="primary" />
                        </InputAdornment>
                      ),
                    }
                  } 
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="ETD (Estimated Time of Departure)"
                value={formData.etd}
                onChange={(date) => handleDateChange('etd', date)}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocalShipping color="primary" />
                        </InputAdornment>
                      ),
                    }
                  } 
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="ETA (Estimated Time of Arrival)"
                value={formData.eta}
                onChange={(date) => handleDateChange('eta', date)}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocalShipping color="primary" />
                        </InputAdornment>
                      ),
                    }
                  } 
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Shipment Date"
                value={formData.shipment_date}
                onChange={(date) => handleDateChange('shipment_date', date)}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarToday color="primary" />
                        </InputAdornment>
                      ),
                    }
                  } 
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Group Name"
                name="group_name"
                value={formData.group_name}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Group color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
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
                placeholder="Enter physical test results..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                      <Science color="primary" />
                    </InputAdornment>
                  ),
                }}
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
                placeholder="Enter chemical test results..."
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
                placeholder="Enter production inspection details..."
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
                placeholder="Enter final inspection results..."
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
                placeholder="Enter any additional remarks..."
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Create New Order
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Fill in the details below to create a new order
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Cancel />}
          onClick={() => navigate('/orders')}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
      </Box>

      {/* Main Form */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          {/* Stepper */}
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 4 }}>
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel StepIconComponent={() => (
                  <Avatar sx={{ bgcolor: activeStep >= index ? 'primary.main' : 'grey.300', width: 32, height: 32 }}>
                    {step.icon}
                  </Avatar>
                )}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {step.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
                <StepContent>
                  {renderStepContent(index)}
                  
                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      startIcon={<ArrowBack />}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      onClick={index === steps.length - 1 ? handleSubmit : handleNext}
                      endIcon={index === steps.length - 1 ? <Save /> : <ArrowForward />}
                      disabled={loading}
                    >
                      {index === steps.length - 1 
                        ? (loading ? 'Creating...' : 'Create Order') 
                        : 'Continue'}
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {/* Summary Card for last step */}
          {activeStep === steps.length && (
            <Card sx={{ mt: 2, bgcolor: '#f8fafc' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <CheckCircle color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Ready to Create Order
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Please review all information before submitting
                    </Typography>
                  </Box>
                </Box>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary">
                      PO Number
                    </Typography>
                    <Typography variant="body1">{formData.po_no || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary">
                      Style
                    </Typography>
                    <Typography variant="body1">{formData.style || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary">
                      Total Value
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      ${formData.total_value || '0'}
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setActiveStep(0)}
                  >
                    Edit Information
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? 'Creating...' : 'Create Order'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </form>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

export default AddOrder;