export interface CambioRed {
  operacion: 'agregar' | 'actualizar' | 'eliminar' | 'restaurar'
  id: string
  lat: number
  lon: number
  conexiones: string[]
  quitar_conexiones?: string[]
  bidireccional: boolean
}
