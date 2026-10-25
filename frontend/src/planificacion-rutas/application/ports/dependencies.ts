import type { InjectionKey } from 'vue'
import type { RuteaRepository } from '@/planificacion-rutas/domain/repositories/RuteaRepository'

export const ruteaRepositoryKey: InjectionKey<RuteaRepository> = Symbol('RuteaRepository')
