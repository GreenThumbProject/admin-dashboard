import { useState } from 'react'
import { useDevices, useCreateDevice, useRotateDeviceToken } from '../api/cloudApi'
import { Link } from 'react-router-dom'

export default function Devices() {
  const { data, isLoading }  = useDevices()
  const createDevice         = useCreateDevice()
  const rotateToken          = useRotateDeviceToken()
  const [showForm, setShowForm] = useState(false)
  const [newToken, setNewToken] = useState(null)
  const [form, setForm]      = useState({ name: '', location: '', device_mode: 'MEDIUM' })

  const list = Array.isArray(data) ? data : (data?.data ?? [])

  async function handleCreate(e) {
    e.preventDefault()
    await createDevice.mutateAsync(form)
    setForm({ name: '', location: '', device_mode: 'MEDIUM' })
    setShowForm(false)
  }

  async function handleRotate(id) {
    const result = await rotateToken.mutateAsync(id)
    setNewToken({ id, token: result.device_token })
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
        <form onSubmit={handleCreate} className="card space-y-4 max-w-md">
          <h3 className="text-sm font-semibold text-gray-300">Register device</h3>
          <div>
            <label className="label">Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required className="input" placeholder="Greenhouse A" />
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
          <button type="submit" disabled={createDevice.isPending} className="btn-primary">
            {createDevice.isPending ? 'Creating…' : 'Create'}
          </button>
        </form>
      )}

      {/* Token reveal after rotation */}
      {newToken && (
        <div className="card border-yellow-700 space-y-2">
          <p className="text-sm font-medium text-yellow-400">⚠ New device token — copy now, it won't be shown again</p>
          <code className="block text-xs bg-gray-800 rounded p-3 break-all text-gray-200">{newToken.token}</code>
          <button onClick={() => setNewToken(null)} className="btn-secondary text-xs">Dismiss</button>
        </div>
      )}

      {/* Devices table */}
      {isLoading ? (
        <div className="text-gray-500">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="th">ID</th>
                <th className="th">Name</th>
                <th className="th">Location</th>
                <th className="th">Mode</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {list.map(d => (
                <tr key={d.id_device} className="bg-gray-950 hover:bg-gray-900">
                  <td className="td text-gray-500">{d.id_device}</td>
                  <td className="td font-medium text-gray-200">{d.name}</td>
                  <td className="td">{d.location ?? '—'}</td>
                  <td className="td"><span className="badge-gray">{d.device_mode}</span></td>
                  <td className="td">
                    <div className="flex gap-2">
                      <Link to={`/devices/${d.id_device}`} className="btn-secondary text-xs px-3 py-1">Details</Link>
                      <button
                        onClick={() => handleRotate(d.id_device)}
                        disabled={rotateToken.isPending}
                        className="btn-secondary text-xs px-3 py-1"
                      >
                        Rotate token
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
