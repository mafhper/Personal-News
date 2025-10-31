import React from "react";
import { Alert, Snackbar, IconButton } from "@mui/material";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import {
  useNotification,
  type Notification,
} from "../contexts/NotificationContext";

interface NotificationToastProps {
  notification: Notification;
}

const getIcon = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return <CheckCircle size={20} />;
    case "error":
      return <AlertCircle size={20} />;
    case "warning":
      return <AlertTriangle size={20} />;
    case "info":
    default:
      return <Info size={20} />;
  }
};

const getSeverity = (
  type: Notification["type"]
): "success" | "error" | "warning" | "info" => {
  return type;
};

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
}) => {
  const { removeNotification } = useNotification();

  const handleClose = () => {
    removeNotification(notification.id);
  };

  return (
    <Snackbar
      open={true}
      autoHideDuration={notification.persistent ? null : notification.duration}
      onClose={notification.persistent ? undefined : handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      sx={{
        "& .MuiSnackbar-root": {
          position: "relative",
        },
      }}
    >
      <Alert
        severity={getSeverity(notification.type)}
        icon={getIcon(notification.type)}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
            sx={{
              color: "inherit",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <X size={16} />
          </IconButton>
        }
        sx={{
          backgroundColor: "rgba(30, 30, 30, 0.95)",
          color: "white",
          border: `1px solid ${
            notification.type === "success"
              ? "#10b981"
              : notification.type === "error"
              ? "#ef4444"
              : notification.type === "warning"
              ? "#f59e0b"
              : "#3b82f6"
          }`,
          "& .MuiAlert-icon": {
            color:
              notification.type === "success"
                ? "#10b981"
                : notification.type === "error"
                ? "#ef4444"
                : notification.type === "warning"
                ? "#f59e0b"
                : "#3b82f6",
          },
          "& .MuiAlert-message": {
            color: "white",
          },
        }}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

export const NotificationContainer: React.FC = () => {
  const { notifications } = useNotification();

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        maxWidth: "400px",
      }}
    >
      {notifications.map((notification) => (
        <NotificationToast key={notification.id} notification={notification} />
      ))}
    </div>
  );
};
