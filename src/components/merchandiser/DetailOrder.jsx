// pages/orders/DetailOrder.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Chip,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  LinearProgress,
  Stack,
  Avatar,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Rating,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
} from "@mui/material";
import {
  Edit,
  Print,
  Email,
  Download,
  ArrowBack,
  CheckCircle,
  Warning,
  LocalShipping,
  CalendarToday,
  Person,
  Business,
  AttachMoney,
  Inventory,
  Description,
  Science,
  Factory,
  Group,
  Info,
  Assignment,
  Timeline,
  Event,
  ShoppingCart,
  Schedule,
  Assessment,
  Receipt,
  TrendingUp,
  Delete,
  TrendingDown,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { getOrderById, deleteOrder } from "../../api/merchandiser";

const statusColors = {
  Running: {
    color: "success",
    icon: <CheckCircle />,
    bg: "#e8f5e9",
    label: "Active Order",
  },
  Shipped: {
    color: "info",
    icon: <LocalShipping />,
    bg: "#e3f2fd",
    label: "Shipped",
  },
  Pending: {
    color: "warning",
    icon: <Warning />,
    bg: "#fff3e0",
    label: "Pending",
  },
  Cancelled: {
    color: "error",
    icon: <Warning />,
    bg: "#ffebee",
    label: "Cancelled",
  },
};

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

const DetailOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await getOrderById(id);
      setOrder(response.data);
    } catch (error) {
      console.error("Error fetching order:", error);
      setSnackbar({
        open: true,
        message: "Error loading order details",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDelete = async () => {
    try {
      await deleteOrder(id);
      setSnackbar({
        open: true,
        message: "Order deleted successfully",
        severity: "success",
      });
      setTimeout(() => {
        navigate("/orders");
      }, 1500);
    } catch (error) {
      console.error("Error deleting order:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Error deleting order",
        severity: "error",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    // Implement email functionality
    console.log("Emailing order...");
  };

  const handleDownload = () => {
    // Implement download functionality
    console.log("Downloading order...");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return format(new Date(dateString), "dd MMM yyyy");
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return "N/A";
    return new Intl.NumberFormat("en-US").format(value);
  };

  const calculateCompletion = () => {
    if (!order || !order.total_qty) return 0;
    return (((order.shipped_qty || 0) / order.total_qty) * 100).toFixed(1);
  };

  const calculateDaysToShipment = () => {
    if (!order || !order.shipment_date) return null;
    const today = new Date();
    const shipmentDate = new Date(order.shipment_date);
    const days = differenceInDays(shipmentDate, today);
    return days;
  };

  const getStatusIcon = (status) => {
    return statusColors[status]?.icon || <Info />;
  };

  const InfoRow = ({ label, value, icon }) => (
    <TableRow>
      <TableCell
        component="th"
        scope="row"
        sx={{
          width: "40%",
          fontWeight: 500,
          color: "text.secondary",
          borderBottom: "none",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {icon}
          {label}
        </Box>
      </TableCell>
      <TableCell sx={{ borderBottom: "none", fontWeight: 500 }}>
        {value || "N/A"}
      </TableCell>
    </TableRow>
  );

  const MetricCard = ({ title, value, icon, color, trend, trendValue }) => (
    <Card sx={{ height: "100%", bgcolor: "#f8fafc" }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>{icon}</Avatar>
          {trend && (
            <Chip
              icon={trend === "up" ? <TrendingUp /> : <TrendingDown />}
              label={`${trendValue}%`}
              size="small"
              color={trend === "up" ? "success" : "error"}
              variant="outlined"
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h5" fontWeight="bold">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2 }} color="text.secondary">
            Loading order details...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Warning sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
        <Typography variant="h5" color="error" gutterBottom>
          Order not found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          The order you're looking for doesn't exist or has been deleted.
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/orders")}
          sx={{ mt: 2 }}
        >
          Back to Orders
        </Button>
      </Box>
    );
  }

  const daysToShipment = calculateDaysToShipment();
  const completionPercentage = calculateCompletion();
  const statusConfig = statusColors[order.status] || statusColors.Pending;

  return (
    <Box>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <IconButton onClick={() => navigate("/orders")} sx={{ mr: 1 }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h4" fontWeight="bold">
                Order #{order.po_no || order.id}
              </Typography>
              <Chip
                icon={getStatusIcon(order.status)}
                label={order.status}
                color={statusConfig.color}
                sx={{
                  fontWeight: 500,
                  px: 1,
                  "& .MuiChip-icon": { ml: 0.5 },
                }}
              />
              {daysToShipment !== null &&
                daysToShipment <= 7 &&
                daysToShipment > 0 && (
                  <Chip
                    icon={<Schedule />}
                    label={`${daysToShipment} days to shipment`}
                    color="warning"
                    variant="outlined"
                    size="small"
                  />
                )}
            </Box>
            <Typography variant="body1" color="text.secondary">
              {order.style} • {order.item || "No item"} • Created{" "}
              {formatDate(order.created_at)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Edit Order">
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate(`/orders/edit/${id}`)}
                sx={{ textTransform: "none" }}
              >
                Edit
              </Button>
            </Tooltip>
            <Tooltip title="Print">
              <IconButton onClick={handlePrint} sx={{ bgcolor: "#f5f5f5" }}>
                <Print />
              </IconButton>
            </Tooltip>
            <Tooltip title="Email">
              <IconButton onClick={handleEmail} sx={{ bgcolor: "#f5f5f5" }}>
                <Email />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton onClick={handleDownload} sx={{ bgcolor: "#f5f5f5" }}>
                <Download />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Progress Bar */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Shipment Progress
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                {completionPercentage}% Complete
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatNumber(order.shipped_qty)} /{" "}
                {formatNumber(order.total_qty)} pcs
              </Typography>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completionPercentage}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: "#e0e0e0",
              "& .MuiLinearProgress-bar": {
                borderRadius: 5,
                bgcolor: completionPercentage >= 100 ? "#2e7d32" : "#1976d2",
              },
            }}
          />
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            px: 2,
            pt: 2,
            bgcolor: "#fafafa",
          }}
        >
          <Tab icon={<Info />} label="Overview" iconPosition="start" />
          <Tab icon={<Assignment />} label="Details" iconPosition="start" />
          <Tab icon={<Timeline />} label="Timeline" iconPosition="start" />
          <Tab icon={<Science />} label="Test Results" iconPosition="start" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Metrics */}
            <Grid item xs={12} md={3}>
              <MetricCard
                title="Total Value"
                value={formatCurrency(order.total_value)}
                icon={<AttachMoney />}
                color="#1976d2"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                title="Quantity"
                value={formatNumber(order.total_qty)}
                icon={<Inventory />}
                color="#2e7d32"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                title="Unit Price"
                value={formatCurrency(order.unit_price)}
                icon={<AttachMoney />}
                color="#ed6c02"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                title="Shipped"
                value={`${formatNumber(order.shipped_qty)} pcs`}
                icon={<LocalShipping />}
                color="#0288d1"
                trend={completionPercentage >= 50 ? "up" : "down"}
                trendValue={completionPercentage}
              />
            </Grid>

            {/* Key Information */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Business color="primary" />
                    Order Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <InfoRow
                          label="Customer"
                          value={order.customer}
                          icon={<Person fontSize="small" />}
                        />
                        <InfoRow
                          label="Supplier"
                          value={order.supplier}
                          icon={<Factory fontSize="small" />}
                        />
                        <InfoRow
                          label="Style"
                          value={order.style}
                          icon={<Inventory fontSize="small" />}
                        />
                        <InfoRow
                          label="Garment"
                          value={order.garment}
                          icon={<Description fontSize="small" />}
                        />
                        <InfoRow
                          label="Item"
                          value={order.item}
                          icon={<ShoppingCart fontSize="small" />}
                        />
                        <InfoRow
                          label="Fabrication"
                          value={order.fabrication}
                          icon={<Description fontSize="small" />}
                        />
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Dates */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Event color="primary" />
                    Important Dates
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <InfoRow
                          label="Final Inspection"
                          value={formatDate(order.final_inspection_date)}
                          icon={<CalendarToday fontSize="small" />}
                        />
                        <InfoRow
                          label="Ex-Factory"
                          value={formatDate(order.ex_factory)}
                          icon={<Factory fontSize="small" />}
                        />
                        <InfoRow
                          label="ETD"
                          value={formatDate(order.etd)}
                          icon={<LocalShipping fontSize="small" />}
                        />
                        <InfoRow
                          label="ETA"
                          value={formatDate(order.eta)}
                          icon={<LocalShipping fontSize="small" />}
                        />
                        <InfoRow
                          label="Shipment Date"
                          value={formatDate(order.shipment_date)}
                          icon={<CalendarToday fontSize="small" />}
                        />
                        <InfoRow
                          label="Shipment Month"
                          value={order.shipment_month}
                          icon={<Event fontSize="small" />}
                        />
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Details Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Info color="primary" />
                    Basic Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <InfoRow
                          label="PO Number"
                          value={order.po_no}
                          icon={<Receipt fontSize="small" />}
                        />
                        <InfoRow
                          label="Department"
                          value={order.department}
                          icon={<Business fontSize="small" />}
                        />
                        <InfoRow
                          label="Ref No"
                          value={order.ref_no}
                          icon={<Description fontSize="small" />}
                        />
                        <InfoRow
                          label="Gender"
                          value={order.gender}
                          icon={<Person fontSize="small" />}
                        />
                        <InfoRow
                          label="Size Range"
                          value={order.size_range}
                          icon={<Group fontSize="small" />}
                        />
                        <InfoRow
                          label="WGR"
                          value={order.wgr}
                          icon={<Assessment fontSize="small" />}
                        />
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <AttachMoney color="primary" />
                    Pricing Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <InfoRow
                          label="Unit Price"
                          value={formatCurrency(order.unit_price)}
                          icon={<AttachMoney fontSize="small" />}
                        />
                        <InfoRow
                          label="Total Quantity"
                          value={formatNumber(order.total_qty)}
                          icon={<Inventory fontSize="small" />}
                        />
                        <InfoRow
                          label="Total Value"
                          value={formatCurrency(order.total_value)}
                          icon={<AttachMoney fontSize="small" />}
                        />
                        <InfoRow
                          label="Factory Value"
                          value={formatCurrency(order.factory_value)}
                          icon={<Factory fontSize="small" />}
                        />
                        <InfoRow
                          label="Shipped Qty"
                          value={formatNumber(order.shipped_qty)}
                          icon={<LocalShipping fontSize="small" />}
                        />
                        <InfoRow
                          label="Shipped Value"
                          value={formatCurrency(order.shipped_value)}
                          icon={<AttachMoney fontSize="small" />}
                        />
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Group color="primary" />
                    Additional Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Group Name
                      </Typography>
                      <Typography variant="body1">
                        {order.group_name || "N/A"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(order.updated_at)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Timeline Tab */}
        <TabPanel value={tabValue} index={2}>
          <Card variant="outlined">
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Timeline color="primary" />
                Order Timeline
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Stepper orientation="vertical" connector={<StepConnector />}>
                {order.final_inspection_date && (
                  <Step active>
                    <StepLabel>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Final Inspection
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(order.final_inspection_date)}
                      </Typography>
                    </StepLabel>
                  </Step>
                )}

                {order.ex_factory && (
                  <Step active>
                    <StepLabel>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Ex-Factory
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(order.ex_factory)}
                      </Typography>
                    </StepLabel>
                  </Step>
                )}

                {order.etd && (
                  <Step active>
                    <StepLabel>
                      <Typography variant="subtitle1" fontWeight="bold">
                        ETD
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(order.etd)}
                      </Typography>
                    </StepLabel>
                  </Step>
                )}

                {order.eta && (
                  <Step active>
                    <StepLabel>
                      <Typography variant="subtitle1" fontWeight="bold">
                        ETA
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(order.eta)}
                      </Typography>
                    </StepLabel>
                  </Step>
                )}

                {order.shipment_date && (
                  <Step active>
                    <StepLabel>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Shipment Date
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(order.shipment_date)}
                      </Typography>
                    </StepLabel>
                  </Step>
                )}

                <Step active>
                  <StepLabel>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Current Status: {order.status}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {completionPercentage}% completed •{" "}
                      {formatNumber(order.shipped_qty)} of{" "}
                      {formatNumber(order.total_qty)} pcs shipped
                    </Typography>
                  </StepLabel>
                </Step>
              </Stepper>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Test Results Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Science color="primary" />
                    Physical Test
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "#fafafa" }}>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                      {order.physical_test ||
                        "No physical test results recorded"}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Science color="primary" />
                    Chemical Test
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "#fafafa" }}>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                      {order.chemical_test ||
                        "No chemical test results recorded"}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Assignment color="primary" />
                    During Production Inspection
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "#fafafa" }}>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                      {order.during_production_inspection ||
                        "No production inspection records"}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Assessment color="primary" />
                    Final Random Inspection
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "#fafafa" }}>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                      {order.final_random_inspection ||
                        "No final inspection records"}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Remarks Section */}
      {order.remarks && (
        <Paper elevation={0} sx={{ p: 3, mt: 3, borderRadius: 2 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Description color="primary" />
            Remarks
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "#fafafa" }}>
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
              {order.remarks}
            </Typography>
          </Paper>
        </Paper>
      )}

      {/* Footer Actions */}
      <Box
        sx={{ mt: 4, display: "flex", justifyContent: "space-between", gap: 2 }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/orders")}
        >
          Back to List
        </Button>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate(`/orders/edit/${id}`)}
          >
            Edit Order
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          sx={{ width: "100%", borderRadius: 2 }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DetailOrder;
