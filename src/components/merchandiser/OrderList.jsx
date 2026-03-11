// pages/orders/OrderList.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  InputAdornment,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  ListItemIcon,
  CircularProgress,
  Alert,
  Snackbar,
  Avatar,
  Stack,
  Badge,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  Download,
  Refresh,
  MoreVert,
  LocalShipping,
  CheckCircle,
  Warning,
  Cancel,
  Pending,
  Print,
  Email,
  Assessment,
  DateRange,
  AttachMoney,
  Inventory,
  Business,
  Person,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getOrders, deleteOrder, getOrderStats } from '../../api/merchandiser';

const statusColors = {
  Running: { color: 'success', icon: <CheckCircle />, bg: '#e8f5e9' },
  Shipped: { color: 'info', icon: <LocalShipping />, bg: '#e3f2fd' },
  Pending: { color: 'warning', icon: <Pending />, bg: '#fff3e0' },
  Cancelled: { color: 'error', icon: <Cancel />, bg: '#ffebee' },
};

const OrderList = () => {
  const navigate = useNavigate();
  
  // State for orders data
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_orders: 0,
    total_value: 0,
    running_count: 0,
    shipped_count: 0,
    pending_count: 0,
    cancelled_count: 0,
  });
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({
    count: 0,
    current_page: 1,
    page_size: 25,
    total_pages: 1
  });

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    customer: '',
    shipment_month: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  // Fetch orders when dependencies change
  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage, searchTerm, filters]);

  // Fetch stats on component mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Build filter object
      const filterParams = {};
      if (filters.status) filterParams.status = filters.status;
      if (filters.customer) filterParams.customer = filters.customer;
      if (filters.shipment_month) filterParams.shipment_month = filters.shipment_month;
      if (searchTerm) filterParams.search = searchTerm;

      const response = await getOrders(page + 1, rowsPerPage, {
        filters: filterParams
      });
      
      setOrders(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
        setTotalCount(response.pagination.count || 0);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error fetching orders',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getOrderStats();
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleFilterChange = (event) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value,
    });
    setPage(0);
  };

  const handleMenuOpen = (event, order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleView = () => {
    if (selectedOrder) {
      navigate(`/orders/${selectedOrder.id}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedOrder) {
      navigate(`/orders/edit/${selectedOrder.id}`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedOrder && window.confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteOrder(selectedOrder.id);
        setSnackbar({
          open: true,
          message: 'Order deleted successfully',
          severity: 'success',
        });
        fetchOrders();
        fetchStats();
      } catch (error) {
        console.error('Error deleting order:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Error deleting order',
          severity: 'error',
        });
      }
    }
    handleMenuClose();
  };

  const handleRefresh = () => {
    fetchOrders();
    fetchStats();
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting orders...');
  };

  const handlePrint = (order) => {
    // Implement print functionality
    console.log('Printing order:', order);
  };

  const handleEmail = (order) => {
    // Implement email functionality
    console.log('Emailing order:', order);
  };

  const getStatusChip = (status) => {
    const statusConfig = statusColors[status] || { color: 'default', icon: null, bg: '#f5f5f5' };
    return (
      <Chip
        icon={statusConfig.icon}
        label={status || 'N/A'}
        color={statusConfig.color}
        size="small"
        sx={{ 
          fontWeight: 500,
          '& .MuiChip-icon': { fontSize: 16, ml: 0.5 }
        }}
      />
    );
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const StatCard = ({ title, value, icon, color, bgColor, subtitle }) => (
    <Card elevation={0} sx={{ bgcolor: bgColor || '#f5f5f5', height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color={color || 'text.secondary'} gutterBottom variant="body2" sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color || 'primary.main', width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ p: 5, mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ color: '#1e293b' }}>
          Orders Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and track all your orders in one place
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Orders"
            value={stats.total_orders || 0}
            icon={<Assessment />}
            color="#1976d2"
            bgColor="#e3f2fd"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Value"
            value={formatCurrency(stats.total_value)}
            icon={<AttachMoney />}
            color="#2e7d32"
            bgColor="#e8f5e9"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Running"
            value={stats.running_count || 0}
            icon={<CheckCircle />}
            color="#2e7d32"
            bgColor="#e8f5e9"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Shipped"
            value={stats.shipped_count || 0}
            icon={<LocalShipping />}
            color="#0288d1"
            bgColor="#e3f2fd"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Pending"
            value={stats.pending_count || 0}
            icon={<Pending />}
            color="#ed6c02"
            bgColor="#fff3e0"
          />
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by PO, Style, Customer..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ bgcolor: 'white' }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small" sx={{ bgcolor: 'white' }}>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={filters.status}
                label="Status"
                onChange={handleFilterChange}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="Running">Running</MenuItem>
                <MenuItem value="Shipped">Shipped</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              name="customer"
              label="Customer"
              value={filters.customer}
              onChange={handleFilterChange}
              placeholder="Filter by customer"
              sx={{ bgcolor: 'white' }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              name="shipment_month"
              label="Shipment Month"
              value={filters.shipment_month}
              onChange={handleFilterChange}
              placeholder="e.g., January"
              sx={{ bgcolor: 'white' }}
            />
          </Grid>
          
          <Grid item xs={12} md={2} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Tooltip title="Add New Order">
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/orders/add')}
                sx={{ textTransform: 'none' }}
              >
                New Order
              </Button>
            </Tooltip>
            
            <Tooltip title="Export">
              <IconButton onClick={handleExport} color="primary">
                <Download />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} color="primary">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Orders Table */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell><strong>PO No / Style</strong></TableCell>
              <TableCell><strong>Customer</strong></TableCell>
              <TableCell><strong>Supplier</strong></TableCell>
              <TableCell align="right"><strong>Quantity</strong></TableCell>
              <TableCell align="right"><strong>Unit Price</strong></TableCell>
              <TableCell align="right"><strong>Total Value</strong></TableCell>
              <TableCell><strong>Shipment</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Loading orders...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                  <Inventory sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Orders Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your search or filter criteria
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => navigate('/orders/add')}
                    sx={{ mt: 2 }}
                  >
                    Create New Order
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow 
                  key={order.id} 
                  hover
                  sx={{ '&:hover': { bgcolor: '#f8fafc', cursor: 'pointer' } }}
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {order.po_no || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.style || 'No Style'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Business fontSize="small" sx={{ color: '#64748b' }} />
                      <Typography variant="body2">
                        {order.customer || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" sx={{ color: '#64748b' }} />
                      <Typography variant="body2">
                        {order.supplier || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Badge badgeContent={order.shipped_qty > 0 ? `${((order.shipped_qty / order.total_qty) * 100).toFixed(0)}%` : 0} color="primary">
                      <Typography variant="body2" fontWeight="medium">
                        {formatNumber(order.total_qty)}
                      </Typography>
                    </Badge>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatCurrency(order.unit_price)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {formatCurrency(order.total_value)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {order.shipment_date ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DateRange fontSize="small" sx={{ color: '#64748b' }} />
                        <Typography variant="body2">
                          {format(new Date(order.shipment_date), 'dd MMM yyyy')}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">N/A</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(order.status)}
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/orders/${order.id}`);
                          }}
                          sx={{ color: '#1976d2' }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/orders/edit/${order.id}`);
                          }}
                          sx={{ color: '#0288d1' }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Print">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint(order);
                          }}
                          sx={{ color: '#64748b' }}
                        >
                          <Print fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Email">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmail(order);
                          }}
                          sx={{ color: '#64748b' }}
                        >
                          <Email fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="More Actions">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuOpen(e, order);
                          }}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        <Divider />
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid #e2e8f0',
            '.MuiTablePagination-select': {
              borderRadius: 1,
            }
          }}
        />
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 200, borderRadius: 2 }
        }}
      >
        <MenuItem onClick={handleView} sx={{ py: 1.5 }}>
          <ListItemIcon><Visibility fontSize="small" sx={{ color: '#1976d2' }} /></ListItemIcon>
          View Details
        </MenuItem>
        <MenuItem onClick={handleEdit} sx={{ py: 1.5 }}>
          <ListItemIcon><Edit fontSize="small" sx={{ color: '#0288d1' }} /></ListItemIcon>
          Edit Order
        </MenuItem>
        <MenuItem onClick={() => handlePrint(selectedOrder)} sx={{ py: 1.5 }}>
          <ListItemIcon><Print fontSize="small" sx={{ color: '#64748b' }} /></ListItemIcon>
          Print Order
        </MenuItem>
        <MenuItem onClick={() => handleEmail(selectedOrder)} sx={{ py: 1.5 }}>
          <ListItemIcon><Email fontSize="small" sx={{ color: '#64748b' }} /></ListItemIcon>
          Send Email
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete} sx={{ py: 1.5, color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          Delete Order
        </MenuItem>
      </Menu>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: 3
          }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrderList;