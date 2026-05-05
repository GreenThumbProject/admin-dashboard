/**
 * Cloud API client for the admin dashboard.
 *
 * All admin routes are prefixed with /admin/.
 * JWT from localStorage is sent on every request.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

function getToken() {
  return localStorage.getItem('gt_token')
}

async function apiFetch(path, options = {}) {
  const token = getToken()
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })
  if (res.status === 401) {
    localStorage.removeItem('gt_token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`${res.status} ${text}`)
  }
  if (res.status === 204) return null
  return res.json()
}

const get    = (path)        => apiFetch(path)
const post   = (path, body)  => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) })
const patch  = (path, body)  => apiFetch(path, { method: 'PATCH',  body: JSON.stringify(body) })
const del    = (path)        => apiFetch(path, { method: 'DELETE' })

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export async function loginUser(email, password) {
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Invalid credentials')
  return res.json()   // { token }
}

export async function registerUser(name, email, password) {
  const res = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || 'Registration failed')
  }
  return res.json()   // { token }
}

// ---------------------------------------------------------------------------
// Devices
// ---------------------------------------------------------------------------
export function useDevices() {
  return useQuery({ queryKey: ['devices'], queryFn: () => get('/admin/devices') })
}
export function useDevice(id) {
  return useQuery({
    queryKey: ['device', id],
    queryFn: () => get(`/admin/devices/${id}`),
    enabled: !!id,
  })
}
export function useCreateDevice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => post('/admin/devices', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  })
}
export function useUpdateDevice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }) => patch(`/admin/devices/${id}`, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['devices'] })
      qc.invalidateQueries({ queryKey: ['device', id] })
    },
  })
}
export function useRotateDeviceToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => post(`/sync/devices/${id}/token`, {}),
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: ['device', id] }),
  })
}

// ---------------------------------------------------------------------------
// Plant species
// ---------------------------------------------------------------------------
export function usePlantSpecies() {
  return useQuery({ queryKey: ['plant-species'], queryFn: () => get('/admin/plant-species') })
}
export function useCreatePlantSpecies() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => post('/admin/plant-species', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plant-species'] }),
  })
}
export function useDeletePlantSpecies() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => del(`/admin/plant-species/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plant-species'] }),
  })
}

// Growth phases (per species)
export function useGrowthPhases(speciesId) {
  return useQuery({
    queryKey: ['growth-phases', speciesId],
    queryFn: () => get(`/admin/growth-phases?id_plant_species=${speciesId}`),
    enabled: !!speciesId,
  })
}
export function useCreateGrowthPhase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => post('/admin/growth-phases', body),
    onSuccess: (_, body) => qc.invalidateQueries({ queryKey: ['growth-phases', body.id_plant_species] }),
  })
}

// ---------------------------------------------------------------------------
// Cultivations
// ---------------------------------------------------------------------------
export function useCultivations() {
  return useQuery({ queryKey: ['cultivations'], queryFn: () => get('/admin/cultivations') })
}
export function useCreateCultivation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => post('/admin/cultivations', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cultivations'] }),
  })
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------
export function useThresholds(cultivationId) {
  return useQuery({
    queryKey: ['thresholds', cultivationId],
    queryFn: () => get(`/admin/thresholds?id_cultivation=${cultivationId}`),
    enabled: !!cultivationId,
  })
}
export function useCreateThreshold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => post('/admin/thresholds', body),
    onSuccess: (_, body) => qc.invalidateQueries({ queryKey: ['thresholds', body.id_cultivation] }),
  })
}
export function useUpdateThreshold() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }) => patch(`/admin/thresholds/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['thresholds'] }),
  })
}

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------
export function useMeasurements({ deviceId, varId, limit = 500 } = {}) {
  const params = new URLSearchParams()
  if (deviceId) params.set('id_device_sensor', deviceId)
  if (varId)    params.set('id_variable', varId)
  params.set('limit', limit)
  return useQuery({
    queryKey: ['measurements', deviceId, varId, limit],
    queryFn: () => get(`/admin/measurements?${params}`),
    enabled: true,
  })
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------
export function usePhotos({ deviceId, cultivationId } = {}) {
  const params = new URLSearchParams()
  if (deviceId)      params.set('id_device', deviceId)
  if (cultivationId) params.set('id_cultivation', cultivationId)
  return useQuery({
    queryKey: ['photos', deviceId, cultivationId],
    queryFn: () => get(`/admin/photos?${params}`),
  })
}

// ---------------------------------------------------------------------------
// Hardware catalog
// ---------------------------------------------------------------------------
export function useSensorModels()   { return useQuery({ queryKey: ['sensor-models'],   queryFn: () => get('/admin/sensor-models')   }) }
export function useActuatorModels() { return useQuery({ queryKey: ['actuator-models'], queryFn: () => get('/admin/actuator-models') }) }
export function useVariables()      { return useQuery({ queryKey: ['variables'],        queryFn: () => get('/admin/variables')        }) }
export function useUnits()          { return useQuery({ queryKey: ['units'],            queryFn: () => get('/admin/units')            }) }
