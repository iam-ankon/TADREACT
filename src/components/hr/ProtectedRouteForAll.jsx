import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRouteForAll = ({ children }) => {
  // Check if user is logged in (you might have a different auth check)
  const token = localStorage.getItem("token") || 
                localStorage.getItem("access_token") || 
                sessionStorage.getItem("token");
  
  const isAuthenticated = !!token;

  if (!isAuthenticated) {
    // If not authenticated, redirect to login
    return <Navigate to="/" replace />;
  }

  // If authenticated, render the children (any authenticated user can access)
  return children;
};

export default ProtectedRouteForAll;