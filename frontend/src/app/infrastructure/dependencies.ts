import { HttpClient } from '@/shared/infrastructure/http/httpClient'
import { HttpRuteaRepository } from '@/planificacion-rutas/infrastructure/api/HttpRuteaRepository'

export const ruteaRepository = new HttpRuteaRepository(new HttpClient())
