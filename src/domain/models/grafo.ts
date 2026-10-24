export interface EstadoServidor {
  datasetDisponible: boolean
}

export interface ResumenGrafo {
  cantidadNodos: number
  cantidadAristas: number
  dirigido: boolean
  fuente: string
  atribucion: string
}

export type EstadoGrafo =
  | { tipo: 'listo'; resumen: ResumenGrafo }
  | { tipo: 'sin_dataset' }
