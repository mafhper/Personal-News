/**
 * dateUtils.ts
 *
 * Utilitários para formatação de data e hora
 *
 * @author Matheus Pereira
 * @version 1.0.0
 */

/**
 * Formata data e opcionalmente hora baseado nas configurações do usuário
 */
export const formatDateTime = (
  date: Date,
  options: {
    timeFormat: "12h" | "24h";
    showTime: boolean;
    locale?: string;
  }
): string => {
  const { timeFormat, showTime, locale = "pt-BR" } = options;

  if (!showTime) {
    return date.toLocaleDateString(locale);
  }

  const dateStr = date.toLocaleDateString(locale);
  const timeStr = timeFormat === "12h"
    ? date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    : date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

  return `${dateStr} às ${timeStr}`;
};

/**
 * Formata apenas o horário baseado no formato escolhido
 */
export const formatTime = (
  date: Date,
  timeFormat: "12h" | "24h",
  locale: string = "pt-BR"
): string => {
  return timeFormat === "12h"
    ? date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    : date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
};

/**
 * Calcula tempo relativo (ex: "há 2 horas")
 */
export const getRelativeTime = (date: Date, locale: string = "pt-BR"): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return "agora";
  } else if (diffInMinutes < 60) {
    return `há ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`;
  } else if (diffInHours < 24) {
    return `há ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
  } else if (diffInDays < 7) {
    return `há ${diffInDays} dia${diffInDays !== 1 ? 's' : ''}`;
  } else {
    return date.toLocaleDateString(locale);
  }
};
