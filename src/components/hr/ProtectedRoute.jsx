import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { canAccessPath, homePath } from "../../utils/routeAccess";

// Logged in + allowed to open this page (same rules as the user's menus,
// see utils/routeAccess.js). Not logged in -> login page. Logged in but not
// permitted -> back to the user's own home page, with a notice.
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (!canAccessPath(location.pathname)) {
    return <Navigate to={homePath()} replace state={{ accessDenied: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
