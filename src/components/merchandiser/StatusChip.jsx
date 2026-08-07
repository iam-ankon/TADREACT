// src/components/StatusChip.jsx
import React from 'react';
import { Chip } from '@mui/material';

const statusConfig = {
  booked: { label: 'Booked', color: '#3b82f6', bg: '#dbeafe' },
  picked_up: { label: 'Picked Up', color: '#8b5cf6', bg: '#ede9fe' },
  in_transit: { label: 'In Transit', color: '#f59e0b', bg: '#fef3c7' },
  out_for_delivery: { label: 'Out for Delivery', color: '#06b6d4', bg: '#cffafe' },
  delivered: { label: 'Delivered', color: '#22c55e', bg: '#dcfce7' },
  delayed: { label: 'Delayed', color: '#ef4444', bg: '#fee2e2' },
  customs_hold: { label: 'Customs Hold', color: '#f97316', bg: '#ffedd5' },
  returned: { label: 'Returned', color: '#6b7280', bg: '#f3f4f6' },
  cancelled: { label: 'Cancelled', color: '#dc2626', bg: '#fee2e2' },
};

const StatusChip = ({ status, size = 'small' }) => {
  const config = statusConfig[status] || statusConfig.booked;
  
  return (
    <Chip
      label={config.label}
      size={size}
      sx={{
        bgcolor: config.bg,
        color: config.color,
        fontWeight: 500,
        '& .MuiChip-label': {
          px: 1.5,
        },
      }}
    />
  );
};

export default StatusChip;