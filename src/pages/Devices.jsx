import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useDevices, useCreateDevice, useUpdateDevice, useRotateDeviceToken,
  useUsers, useSensorModels, useActuatorModels, useVariables,
  useDeviceSensors, useCreateDeviceSensor, useDeleteDeviceSensor, useUpdateDeviceSensor,
  useDeviceActuators, useCreateDeviceActuator, useDeleteDeviceActuator, useUpdateDeviceActuator,
  useSensorCapabilities,
} from '../api/cloudApi'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function onlineStatus(lastSeenAt, syncIntervalSec = 600) {
  if (!lastSeenAt) return 'never'
  const diffSec = (Date.now() - new Date(lastSeenAt).getTime()) / 1000
  return diffSec < syncIntervalSec * 2 ? 'online' : 'offline'
}

function StatusBadge({ lastSeenAt }) {
  const status = onlineStatus(lastSeenAt)
  const colors = { online: 'text-green-400', offline: 'text-red-400', never: 'text-gray-500' }
  const labels = { online: '● Online', offline: '● Offline', never: '— Never synced' }
  return <span className={`text-xs font-medium ${colors[status]}`}>{labels[status]}</span>
}

function TokenReveal({ data, onDismiss }) {
  if (!data) return null
  return (
    <div className="card border border-yellow-700 space-y-2">
      <p className="text-sm font-medium text-yellow-400">⚠ Device token — copy now, it won't be shown again</p>
      <code className="block text-xs bg-gray-800 rounded p-3 break-all text-gray-200">{data.token}</code>
      <button onClick={onDismiss} className="btn-secondary text-xs">Dismiss</button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sensor/Actuator management panel (shown in device detail)
// ---------------------------------------------------------------------------

function SensorCapabilities({ sensorModelId }) {
  const { data: caps, isLoading } = useSensorCapabilities(sensorModelId)
  const { data: vars } = useVariables()
  const capList = Array.isArray(caps) ? caps : (caps?.data ?? [])
  const varList = Array.isArray(vars) ? vars : (vars?.data ?? [])
  const varMap  = Object.fromEntries(varList.map(v => [v.id_variable, v.name]))

  if (isLoading) return <p className="text-gray-600 text-xs">Loading…</p>
  if (!capList.length) return <p className="text-gray-600 text-xs">No capabilities defined for this model.</p>
  return (
    <div className="space-y-1">
      {capList.map(c => (
        <p key={c.id_sensor_capability ?? c.id_variable} className="text-xs text-gray-400">
          • {varMap[c.id_variable] ?? `Variable #${c.id_variable}`}
          {(c.min_range != null || c.max_range != null) && (
            <span className="text-gray-600"> [{c.min_range ?? '—'} – {c.max_range ?? '—'}]</span>
          )}
        </p>
      ))}
    </div>
  )
}

function SensorsPanel({ deviceId }) {
  const { data: sensors, isLoading } = useDeviceSensors(deviceId)
  const { data: models }   = useSensorModels()
  const createSensor       = useCreateDeviceSensor()
  const deleteSensor       = useDeleteDeviceSensor()
  const updateSensor       = useUpdateDeviceSensor()
  const [showForm, setShowForm]     = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [form, setForm] = useState({ id_sensor_model: '', port_address: '', is_active: true })

  const list      = Array.isArray(sensors) ? sensors : (sensors?.data ?? [])
  const modelList = Array.isArray(models)  ? models  : (models?.data  ?? [])
  const modelMap  = Object.fromEntries(modelList.map(m => [m.id_sensor_model, m.model_name]))

  async function handleAdd(e) {
    e.preventDefault()
    await createSensor.mutateAsync({ ...form, id_device: deviceId, id_sensor_model: Number(form.id_sensor_model) })
    setForm({ id_sensor_model: '', port_address: '', is_active: true })
    setShowForm(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-300">Sensors</h4>
        <button onClick={() => setShowForm(v => !v)} className="btn-secondary text-xs px-2 py-1">
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-gray-900 rounded-lg p-3 space-y-2">
          <div>
            <label className="label">Sensor model</label>
            <select value={form.id_sensor_model} onChange={e => setForm(f => ({ ...f, id_sensor_model: e.target.value }))}
              required className="input">
              <option value="">Select…</option>
              {modelList.map(m => <option key={m.id_sensor_model} value={m.id_sensor_model}>{m.model_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Port / I2C address</label>
            <input value={form.port_address} onChange={e => setForm(f => ({ ...f, port_address: e.target.value }))}
              className="input" placeholder="0x29" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
            Active
          </label>
          <button type="submit" disabled={createSensor.isPending} className="btn-primary text-xs">
            {createSensor.isPending ? 'Adding…' : 'Add sensor'}
          </button>
        </form>
      )}

      {isLoading ? <div className="text-gray-500 text-xs">Loading…</div> : (
        <div className="space-y-1">
          {list.length === 0 && <div className="text-gray-600 text-xs">No sensors attached.</div>}
          {list.map(s => (
            <div key={s.id_device_sensor} className="bg-gray-900 rounded">
              <div className="flex items-center justify-between px-3 py-2 text-sm">
                <button
                  onClick={() => setExpandedId(v => v === s.id_device_sensor ? null : s.id_device_sensor)}
                  className="flex items-center gap-2 text-left min-w-0"
                >
                  <span className={s.is_active ? 'text-green-400 text-xs' : 'text-gray-600 text-xs'}>●</span>
                  <span className="text-gray-200">{modelMap[s.id_sensor_model] ?? `#${s.id_sensor_model}`}</span>
                  <span className="text-gray-500 text-xs">addr: {s.port_address ?? '—'}</span>
                  <span className="text-gray-700 text-xs">{expandedId === s.id_device_sensor ? '▲' : '▼'}</span>
                </button>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => updateSensor.mutateAsync({ id: s.id_device_sensor, deviceId, is_active: !s.is_active })}
                    disabled={updateSensor.isPending}
                    className="text-xs text-gray-500 hover:text-gray-300"
                  >
                    {s.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => deleteSensor.mutateAsync({ id: s.id_device_sensor, deviceId })}
                    className="text-red-400 hover:text-red-300 text-xs">Remove</button>
                </div>
              </div>
              {expandedId === s.id_device_sensor && (
                <div className="px-4 pb-3 pt-1 border-t border-gray-800">
                  <p className="text-xs text-gray-500 mb-1">Capabilities</p>
                  <SensorCapabilities sensorModelId={s.id_sensor_model} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActuatorsPanel({ deviceId }) {
  const { data: actuators, isLoading } = useDeviceActuators(deviceId)
  const { data: models }   = useActuatorModels()
  const createActuator     = useCreateDeviceActuator()
  const deleteActuator     = useDeleteDeviceActuator()
  const updateActuator     = useUpdateDeviceActuator()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ id_actuator_model: '', name: '', instance_config: '{}', is_active: true })
  const [jsonError, setJsonError] = useState(null)

  const list      = Array.isArray(actuators) ? actuators : (actuators?.data ?? [])
  const modelList = Array.isArray(models)    ? models    : (models?.data    ?? [])
  const modelMap  = Object.fromEntries(modelList.map(m => [m.id_actuator_model, m.model_name]))

  async function handleAdd(e) {
    e.preventDefault()
    let parsed
    try { parsed = JSON.parse(form.instance_config) } catch { setJsonError('Invalid JSON'); return }
    setJsonError(null)
    await createActuator.mutateAsync({
      id_device: deviceId,
      id_actuator_model: Number(form.id_actuator_model),
      name: form.name,
      instance_config: parsed,
      is_active: form.is_active,
    })
    setForm({ id_actuator_model: '', name: '', instance_config: '{}', is_active: true })
    setShowForm(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-300">Actuators</h4>
        <button onClick={() => setShowForm(v => !v)} className="btn-secondary text-xs px-2 py-1">
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-gray-900 rounded-lg p-3 space-y-2">
          <div>
            <label className="label">Actuator model</label>
            <select value={form.id_actuator_model} onChange={e => setForm(f => ({ ...f, id_actuator_model: e.target.value }))}
              required className="input">
              <option value="">Select…</option>
              {modelList.map(m => <option key={m.id_actuator_model} value={m.id_actuator_model}>{m.model_name} ({m.actuator_type})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Name (friendly label)</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input" placeholder="Fan A" />
          </div>
          <div>
            <label className="label">Instance config (JSON)</label>
            <textarea value={form.instance_config}
              onChange={e => { setForm(f => ({ ...f, instance_config: e.target.value })); setJsonError(null) }}
              className="input font-mono text-xs" rows={3} placeholder='{"gpio_pin": 17}' />
            {jsonError && <p className="text-red-400 text-xs mt-1">{jsonError}</p>}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
            Active
          </label>
          <button type="submit" disabled={createActuator.isPending} className="btn-primary text-xs">
            {createActuator.isPending ? 'Adding…' : 'Add actuator'}
          </button>
        </form>
      )}

      {isLoading ? <div className="text-gray-500 text-xs">Loading…</div> : (
        <div className="space-y-1">
          {list.length === 0 && <div className="text-gray-600 text-xs">No actuators attached.</div>}
          {list.map(a => (
            <div key={a.id_device_actuator} className="flex items-center justify-between bg-gray-900 rounded px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                <span className={a.is_active ? 'text-green-400 text-xs' : 'text-gray-600 text-xs'}>●</span>
                <span className="text-gray-200">{a.name || modelMap[a.id_actuator_model] || `#${a.id_actuator_model}`}</span>
                <span className="text-gray-500 text-xs">({modelMap[a.id_actuator_model] ?? `model #${a.id_actuator_model}`})</span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateActuator.mutateAsync({ id: a.id_device_actuator, deviceId, is_active: !a.is_active })}
                  disabled={updateActuator.isPending}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  {a.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => deleteActuator.mutateAsync({ id: a.id_device_actuator, deviceId })}
                  className="text-red-400 hover:text-red-300 text-xs">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Device detail panel (inline expand)
// ---------------------------------------------------------------------------

function DeviceDetail({ device, onClose }) {
  const updateDevice  = useUpdateDevice()
  const rotateToken   = useRotateDeviceToken()
  const [newToken, setNewToken]     = useState(null)
  const [saveStatus, setSaveStatus] = useState(null)
  const [editForm, setEditForm] = useState({
    name: device.name,
    location: device.location ?? '',
    mac_address: device.mac_address ?? '',
    device_mode: device.device_mode,
    tailscale_ip: device.tailscale_ip ?? '',
  })

  async function handleUpdate(e) {
    e.preventDefault()
    setSaveStatus(null)
    try {
      await updateDevice.mutateAsync({ id: device.id_device, ...editForm })
      setSaveStatus('success')
      setTimeout(() => setSaveStatus(null), 3000)
    } catch {
      setSaveStatus('error')
    }
  }

  async function handleRotate() {
    const result = await rotateToken.mutateAsync(device.id_device)
    setNewToken(result.device_token)
  }

  const localUrl = device.tailscale_ip ? `http://${device.tailscale_ip}:80` : null

  return (
    <div className="card space-y-6 border border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">Device #{device.id_device} — {device.name}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xs">✕ Close</button>
      </div>

      <TokenReveal data={newToken ? { token: newToken } : null} onDismiss={() => setNewToken(null)} />

      {/* Edit form */}
      <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="label">Name</label>
          <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
            required className="input" />
        </div>
        <div>
          <label className="label">MAC address</label>
          <input value={editForm.mac_address} onChange={e => setEditForm(f => ({ ...f, mac_address: e.target.value }))}
            className="input" placeholder="AA:BB:CC:DD:EE:FF" />
        </div>
        <div>
          <label className="label">Location</label>
          <input value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
            className="input" placeholder="Room 1" />
        </div>
        <div>
          <label className="label">Mode</label>
          <select value={editForm.device_mode} onChange={e => setEditForm(f => ({ ...f, device_mode: e.target.value }))}
            className="input">
            {['LOW', 'MEDIUM', 'HIGH'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Tailscale IP (for local dashboard link)</label>
          <input value={editForm.tailscale_ip} onChange={e => setEditForm(f => ({ ...f, tailscale_ip: e.target.value }))}
            className="input" placeholder="100.x.y.z" />
        </div>
        <div className="md:col-span-2 flex items-center gap-2 flex-wrap">
          <button type="submit" disabled={updateDevice.isPending} className="btn-primary text-xs">
            {updateDevice.isPending ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={handleRotate} disabled={rotateToken.isPending}
            className="btn-secondary text-xs">
            {rotateToken.isPending ? 'Rotating…' : 'Rotate token'}
          </button>
          {localUrl && (
            <a href={localUrl} target="_blank" rel="noreferrer" className="btn-secondary text-xs">
              Open Local Dashboard ↗
            </a>
          )}
          {saveStatus === 'success' && <span className="text-green-400 text-xs">Saved!</span>}
          {saveStatus === 'error'   && <span className="text-red-400 text-xs">Save failed.</span>}
        </div>
      </form>

      <hr className="border-gray-800" />
      <SensorsPanel deviceId={device.id_device} />
      <hr className="border-gray-800" />
      <ActuatorsPanel deviceId={device.id_device} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Devices page
// ---------------------------------------------------------------------------

export default function Devices() {
  const { data, isLoading }  = useDevices()
  const { data: usersData }  = useUsers()
  const createDevice         = useCreateDevice()
  const [searchParams]       = useSearchParams()

  const [showForm, setShowForm] = useState(false)
  const [newToken, setNewToken] = useState(null)
  const [expandedId, setExpandedId] = useState(
    searchParams.get('open') ? Number(searchParams.get('open')) : null
  )
  const [form, setForm] = useState({
    name: '', location: '', mac_address: '', device_mode: 'MEDIUM', id_user: '',
  })

  const list = Array.isArray(data) ? data : (data?.data ?? [])
  const users = Array.isArray(usersData) ? usersData : (usersData?.data ?? [])

  async function handleCreate(e) {
    e.preventDefault()
    const body = { ...form }
    if (!body.id_user) delete body.id_user   // backend auto-assigns logged-in user
    const result = await createDevice.mutateAsync(body)
    setNewToken({ token: result.device_token })
    setForm({ name: '', location: '', mac_address: '', device_mode: 'MEDIUM', id_user: '' })
    setShowForm(false)
  }

  function toggleDetail(id) {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Devices</h2>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary">
          {showForm ? 'Cancel' : '+ New device'}
        </button>
      </div>

      {/* New device form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-4 max-w-lg">
          <h3 className="text-sm font-semibold text-gray-300">Register device</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required className="input" placeholder="Greenhouse A" />
            </div>
            <div>
              <label className="label">MAC address</label>
              <input value={form.mac_address} onChange={e => setForm(f => ({ ...f, mac_address: e.target.value }))}
                className="input" placeholder="AA:BB:CC:DD:EE:FF" />
            </div>
            <div>
              <label className="label">Location</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="input" placeholder="Room 1" />
            </div>
            <div>
              <label className="label">Mode</label>
              <select value={form.device_mode} onChange={e => setForm(f => ({ ...f, device_mode: e.target.value }))}
                className="input">
                {['LOW', 'MEDIUM', 'HIGH'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Owner (leave blank to assign to yourself)</label>
              <select value={form.id_user} onChange={e => setForm(f => ({ ...f, id_user: e.target.value }))}
                className="input">
                <option value="">— My account (default) —</option>
                {users.map(u => <option key={u.id_user} value={u.id_user}>{u.name} ({u.email})</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={createDevice.isPending} className="btn-primary">
            {createDevice.isPending ? 'Creating…' : 'Create device'}
          </button>
        </form>
      )}

      {/* Token reveal after creation or rotation */}
      <TokenReveal data={newToken} onDismiss={() => setNewToken(null)} />

      {/* Devices table */}
      {isLoading ? (
        <div className="text-gray-500">Loading…</div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="th">ID</th>
                  <th className="th">Name</th>
                  <th className="th">MAC</th>
                  <th className="th">Location</th>
                  <th className="th">Mode</th>
                  <th className="th">Status</th>
                  <th className="th">Last seen</th>
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {list.map(d => (
                  <>
                    <tr key={d.id_device} className="bg-gray-950 hover:bg-gray-900">
                      <td className="td text-gray-500">{d.id_device}</td>
                      <td className="td font-medium text-gray-200">{d.name}</td>
                      <td className="td text-gray-400 font-mono text-xs">{d.mac_address ?? '—'}</td>
                      <td className="td">{d.location ?? '—'}</td>
                      <td className="td"><span className="badge-gray">{d.device_mode}</span></td>
                      <td className="td"><StatusBadge lastSeenAt={d.last_seen_at} /></td>
                      <td className="td text-gray-500 text-xs">
                        {d.last_seen_at ? new Date(d.last_seen_at).toLocaleString() : '—'}
                      </td>
                      <td className="td">
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => toggleDetail(d.id_device)}
                            className="btn-secondary text-xs px-3 py-1"
                          >
                            {expandedId === d.id_device ? 'Close' : 'Details'}
                          </button>
                          {d.tailscale_ip && (
                            <a href={`http://${d.tailscale_ip}:80`} target="_blank" rel="noreferrer"
                               className="btn-secondary text-xs px-3 py-1">
                              Dashboard ↗
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === d.id_device && (
                      <tr key={`${d.id_device}-detail`}>
                        <td colSpan={8} className="p-4 bg-gray-950">
                          <DeviceDetail device={d} onClose={() => setExpandedId(null)} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
