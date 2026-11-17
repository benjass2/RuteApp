import type { InjectionKey } from 'vue'
import type { RuteaRepository } from '@/app/planificacion-rutas/domain/repositories/RuteaRepository'

export const ruteaRepositoryKey: InjectionKey<RuteaRepository> = Symbol('RuteaRepository')
