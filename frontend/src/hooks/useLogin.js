import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./useToast.js";
import { loginRequest } from "../services/api.js";
import { setStoredAuth } from "../utils/authStorage.js";
import { usePermissions } from "../context/PermissionsContext.jsx";
import { useAppBranding } from "../context/AppBrandingContext.jsx";

export function useLogin() {
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshPermissions } = usePermissions();
  const { refreshBranding } = useAppBranding();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = useCallback(
    async (e) => {
      e.preventDefault();

      const uid = userId.trim();
      if (!uid) {
        toast.error("Please enter your username.");
        return;
      }
      if (!password) {
        toast.error("Please enter your password.");
        return;
      }

      setLoading(true);
      const toastId = toast.loading("Signing in…");
      try {
        const res = await loginRequest(uid, password);
        const { token, user } = res.data || {};
        if (!token || !user) {
          throw new Error("Invalid response from server.");
        }
        setStoredAuth({ token, user }, rememberMe);
        
        // Refresh permissions immediately after login
        if (refreshPermissions) {
          await refreshPermissions();
        }
        await refreshBranding();

        toast.success(
          `Welcome back, ${user.name || user.userName || user.userEmail || "User"}!`,
          { id: toastId }
        );
        navigate("/app/dashboard", { replace: true });
      } catch (err) {
        toast.dismiss(toastId);
        const msg =
          err.data?.message || err.message || "Unable to sign in. Try again.";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [userId, password, rememberMe, navigate, toast, refreshPermissions, refreshBranding]
  );

  return {
    userId,
    setUserId,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    loading,
    submit,
  };
}
