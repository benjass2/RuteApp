export type TipoRecorrido = 'punto_a_punto' | 'multi_entrega'

export interface ParametrosPlanificador {
  tipoRecorrido: TipoRecorrido
  minutoDia: number
}
