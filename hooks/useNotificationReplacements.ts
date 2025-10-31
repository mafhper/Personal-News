import { useNotification } from "../contexts/NotificationContext";

/**
 * Hook que fornece substitutos para window.alert, window.confirm, etc.
 * usando o sistema de notificação integrado
 */
export const useNotificationReplacements = () => {
  const { showAlert, showConfirm, showNotification } = useNotification();

  // Substituto para window.alert()
  const alert = async (message: string) => {
    await showAlert(message, { type: "info" });
  };

  // Substituto para window.confirm()
  const confirm = async (message: string): Promise<boolean> => {
    return await showConfirm({
      message,
      title: "Confirmação",
      confirmText: "OK",
      cancelText: "Cancelar",
      type: "info",
    });
  };

  // Versões específicas para diferentes tipos de mensagem
  const alertSuccess = async (message: string) => {
    await showAlert(message, { type: "success" });
  };

  const alertError = async (message: string) => {
    await showAlert(message, { type: "error" });
  };

  const alertWarning = async (message: string) => {
    await showAlert(message, { type: "warning" });
  };

  const confirmDanger = async (
    message: string,
    title?: string
  ): Promise<boolean> => {
    return await showConfirm({
      message,
      title: title || "Atenção",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      type: "danger",
    });
  };

  const confirmWarning = async (
    message: string,
    title?: string
  ): Promise<boolean> => {
    return await showConfirm({
      message,
      title: title || "Aviso",
      confirmText: "Continuar",
      cancelText: "Cancelar",
      type: "warning",
    });
  };

  // Toast notifications (não bloqueiam a interface)
  const toast = {
    success: (message: string) =>
      showNotification(message, { type: "success" }),
    error: (message: string) => showNotification(message, { type: "error" }),
    warning: (message: string) =>
      showNotification(message, { type: "warning" }),
    info: (message: string) => showNotification(message, { type: "info" }),
  };

  return {
    alert,
    confirm,
    alertSuccess,
    alertError,
    alertWarning,
    confirmDanger,
    confirmWarning,
    toast,
  };
};
