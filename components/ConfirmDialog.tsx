import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import type { ConfirmDialogOptions } from "../contexts/NotificationContext";

interface ConfirmDialogProps {
  isOpen: boolean;
  options: ConfirmDialogOptions;
  onClose: (result: boolean) => void;
}

const getIcon = (type: ConfirmDialogOptions["type"]) => {
  switch (type) {
    case "danger":
      return <AlertCircle size={24} className="text-red-500" />;
    case "warning":
      return <AlertTriangle size={24} className="text-yellow-500" />;
    case "info":
    default:
      return <Info size={24} className="text-blue-500" />;
  }
};

const getButtonColor = (type: ConfirmDialogOptions["type"]) => {
  switch (type) {
    case "danger":
      return "error";
    case "warning":
      return "warning";
    case "info":
    default:
      return "primary";
  }
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  options,
  onClose,
}) => {
  const {
    title = "Confirmação",
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    type = "info",
  } = options;

  const handleConfirm = () => {
    onClose(true);
  };

  const handleCancel = () => {
    onClose(false);
  };

  const handleClose = () => {
    onClose(false);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#1e1e1e",
          color: "white",
          border: "1px solid #374151",
          borderRadius: "8px",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          color: "white",
          borderBottom: "1px solid #374151",
          paddingBottom: 2,
        }}
      >
        {getIcon(type)}
        <Typography variant="h6" component="span" sx={{ color: "white" }}>
          {title}
        </Typography>
        <Button
          onClick={handleClose}
          sx={{
            marginLeft: "auto",
            minWidth: "auto",
            padding: "4px",
            color: "#9ca3af",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              color: "white",
            },
          }}
        >
          <X size={20} />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ paddingTop: 3, paddingBottom: 2 }}>
        <Typography sx={{ color: "#d1d5db", lineHeight: 1.6 }}>
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ padding: 3, paddingTop: 1, gap: 1 }}>
        <Button
          onClick={handleCancel}
          variant="outlined"
          sx={{
            color: "#9ca3af",
            borderColor: "#4b5563",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderColor: "#6b7280",
              color: "white",
            },
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={getButtonColor(type) as any}
          sx={{
            backgroundColor:
              type === "danger"
                ? "#ef4444"
                : type === "warning"
                ? "#f59e0b"
                : "#3b82f6",
            "&:hover": {
              backgroundColor:
                type === "danger"
                  ? "#dc2626"
                  : type === "warning"
                  ? "#d97706"
                  : "#2563eb",
            },
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
