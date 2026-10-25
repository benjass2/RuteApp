export const zonas = [
  { id: 'centro', nombre: 'Miraflores + San Isidro', centro: [-12.105, -77.035] },
  { id: 'sur', nombre: 'Chorrillos + San Juan de Miraflores + Villa El Salvador + Barranco', centro: [-12.18, -76.99] },
] as const
export type ZonaId = typeof zonas[number]['id']
