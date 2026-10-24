import type { InjectionKey } from 'vue'
import type { RuteaRepository } from '@/domain/repositories/RuteaRepository'

export const ruteaRepositoryKey: InjectionKey<RuteaRepository> = Symbol('RuteaRepository')
