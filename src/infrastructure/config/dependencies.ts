import { HttpClient } from '@/infrastructure/http/httpClient'
import { HttpRuteaRepository } from '@/infrastructure/api/HttpRuteaRepository'

export const ruteaRepository = new HttpRuteaRepository(new HttpClient())
