/** Convierte el minuto del día usado por la API a HH:mm. */
export function formatearHora(minuto: number): string {
  return `${Math.floor(minuto / 60).toString().padStart(2, '0')}:${(minuto % 60).toString().padStart(2, '0')}`
}
