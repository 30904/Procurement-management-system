import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import {
  listNotificationsRequest,
  getUnreadCountRequest,
  markNotificationReadRequest,
  markAllNotificationsReadRequest,
} from "../../services/api.js";
import styles from "./NotificationBell.module.css";

const POLL_INTERVAL = 30_000;

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const TYPE_COLORS = {
  info: "var(--brand-primary)",
  success: "#009696",
  warning: "#e07b00",
  error: "#e53e3e",
  system: "#7c3aed",
};

export default function NotificationBell({ isActive, onActiveChange }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCountRequest();
      setUnreadCount(res?.data?.unreadCount ?? 0);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listNotificationsRequest({ limit: 20 });
      setNotifications(res?.data?.rows || []);
      setUnreadCount(res?.data?.unreadCount ?? 0);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    onActiveChange?.(next);
    if (next) fetchNotifications();
  }, [open, onActiveChange, fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (dropdownRef.current?.contains(e.target)) return;
      if (bellRef.current?.contains(e.target)) return;
      setOpen(false);
      onActiveChange?.(false);
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        onActiveChange?.(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, onActiveChange]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationReadRequest(id);
      setNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id) === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* silent */
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadRequest();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      /* silent */
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    onActiveChange?.(false);
    navigate(appPath("notifications"));
  };

  const handleItemClick = (notif) => {
    if (!notif.isRead) handleMarkRead(notif._id || notif.id);
    if (notif.link) {
      setOpen(false);
      onActiveChange?.(false);
      navigate(notif.link.startsWith("/") ? notif.link : appPath(notif.link));
    }
  };

  return (
    <>
      <button
        ref={bellRef}
        type="button"
        className={`erp-header-square${isActive ? " erp-header-square--active" : ""}`}
        aria-label="Notifications"
        onClick={handleToggle}
      >
        <div className={styles.bellWrap}>
          <svg viewBox="0 0 24 24" className={styles.bellIcon} fill="none">
            <path
              d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
              stroke={isActive ? "var(--brand-primary, #197dfa)" : "#5d6f91"}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.73 21a2 2 0 0 1-3.46 0"
              stroke={isActive ? "var(--brand-primary, #197dfa)" : "#5d6f91"}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {unreadCount > 0 && (
            <span className={styles.badge}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </button>

      {open &&
        createPortal(
          <div ref={dropdownRef} className={styles.dropdown}>
            <div className={styles.header}>
              <span className={styles.headerTitle}>Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className={styles.markAllBtn}
                  onClick={handleMarkAllRead}
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className={styles.list}>
              {loading && notifications.length === 0 && (
                <div className={styles.empty}>Loading...</div>
              )}
              {!loading && notifications.length === 0 && (
                <div className={styles.empty}>
                  <svg viewBox="0 0 24 24" className={styles.emptyIcon} fill="none">
                    <path
                      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                    />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#cbd5e1" strokeWidth="1.5" />
                  </svg>
                  <span>No notifications yet</span>
                </div>
              )}
              {notifications.map((notif) => {
                const id = notif._id || notif.id;
                return (
                  <div
                    key={id}
                    className={`${styles.item} ${!notif.isRead ? styles.unread : ""}`}
                    onClick={() => handleItemClick(notif)}
                    role="button"
                    tabIndex={0}
                  >
                    <div
                      className={styles.dot}
                      style={{
                        background: notif.isRead
                          ? "transparent"
                          : TYPE_COLORS[notif.type] || TYPE_COLORS.info,
                      }}
                    />
                    <div className={styles.itemBody}>
                      <p className={styles.itemTitle}>{notif.title}</p>
                      {notif.body && (
                        <p className={styles.itemText}>{notif.body}</p>
                      )}
                      <span className={styles.itemTime}>
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className={styles.viewAll}
              onClick={handleViewAll}
            >
              View all notifications
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
