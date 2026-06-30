import { Navigate, useLocation } from "react-router-dom";
import { consumeAuthTabBridge, getToken } from "../../utils/authStorage.js";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  consumeAuthTabBridge();
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
