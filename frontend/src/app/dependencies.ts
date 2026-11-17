import { HttpClient } from '@/app/shared/infrastructure/http/httpClient'
import { HttpRuteaRepository } from '@/app/planificacion-rutas/infrastructure/api/HttpRuteaRepository'

export const ruteaRepository = new HttpRuteaRepository(new HttpClient())
