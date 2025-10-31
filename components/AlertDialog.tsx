import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import type { NotificationOptions } from "../contexts/NotificationContext";

interface AlertDialogProps {
  isOpen: boolean;
  message: string;
  options: NotificationOptions;
  onClose: () => void;
}

const getIcon = (type: NotificationOptions["type"]) => {
  switch (type) {
    case "success":
      return <CheckCircle size={24} className="text-green-500" />;
    case "error":
      return <AlertCircle size={24} className="text-red-500" />;
    case "warning":
      return <AlertTriangle size={24} className="text-yellow-500" />;
    case "info":
    default:
      return <Info size={24} className="text-blue-500" />;
  }
};

const getTitle = (type: NotificationOptions["type"]) => {
  switch (type) {
    case "success":
      return "Sucesso";
    case "error":
      return "Erro";
    case "warning":
      return "Aviso";
    case "info":
    default:
      return "Informação";
  }
};

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  message,
  options,
  onClose,
}) => {
  const type = options.type || "info";

  const handleClose = () => {
    onClose();
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
          {getTitle(type)}
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

      <DialogActions sx={{ padding: 3, paddingTop: 1 }}>
        <Button
          onClick={handleClose}
          variant="contained"
          sx={{
            backgroundColor: "#3b82f6",
            "&:hover": {
              backgroundColor: "#2563eb",
            },
          }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};
