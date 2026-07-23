/**
 * Logger central de la app.
 *
 * Punto único para registrar eventos: en desarrollo escribe a la consola; en
 * release se silencian `debug/info/warn` para no ensuciar la salida ni filtrar
 * detalles internos. Los errores se registran siempre porque son útiles para
 * diagnóstico. Centralizarlo aquí permite, más adelante, enviar los errores a
 * un servicio remoto (Sentry, etc.) sin tocar el resto del código.
 */
type LogArgs = readonly unknown[];

export const logger = {
  debug(...args: LogArgs): void {
    if (__DEV__) console.debug(...args);
  },
  info(...args: LogArgs): void {
    if (__DEV__) console.info(...args);
  },
  warn(...args: LogArgs): void {
    if (__DEV__) console.warn(...args);
  },
  error(...args: LogArgs): void {
    console.error(...args);
  },
};
