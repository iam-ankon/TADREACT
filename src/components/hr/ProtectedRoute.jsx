import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // Check if user is logged in
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("token");

  const isAuthenticated = !!token;

  if (!isAuthenticated) {
    // If not authenticated, redirect to login
    return <Navigate to="/" replace />;
  }

  // For regular ProtectedRoute, just check authentication
  // For full access check, you'll need to handle it in the backend
  return children;
};

export default ProtectedRoute;
