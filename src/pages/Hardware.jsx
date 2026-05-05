import { useState } from 'react'
import {
  useSensorModels, useActuatorModels, useVariables, useUnits,
  useCreateSensorModel, useCreateActuatorModel,
} from '../api/cloudApi'

function Table({ items, columns }) {
  if (!items) return <div className="text-gray-500 text-sm">Loading…</div>
  if (items.length === 0) return <div className="text-gray-500 text-sm">No entries.</div>
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-900">
          <tr>{columns.map(c => <th key={c.key} className="th">{c.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {items.map((row, i) => (
            <tr key={i} className="bg-gray-950 hover:bg-gray-900">
              {columns.map(c => (
                <td key={c.key} className="td">
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SensorModelSection() {
  const { data }       = useSensorModels()
  const createModel    = useCreateSensorModel()
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ model_name: '', manufacturer: '' })

  const items = Array.isArray(data) ? data : (data?.data ?? [])

  async function handleCreate(e) {
    e.preventDefault()
    await createModel.mutateAsync(form)
    setForm({ model_name: '', manufacturer: '' })
    setShow(false)
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Sensor Models</h3>
        <button onClick={() => setShow(v => !v)} className="btn-secondary text-xs px-2 py-1">
          {show ? 'Cancel' : '+ New'}
        </button>
      </div>

      {show && (
        <form onSubmit={handleCreate} className="bg-gray-900 rounded-lg p-3 space-y-2">
          <div>
            <label className="label">Model name *</label>
            <input value={form.model_name} onChange={e => setForm(f => ({ ...f, model_name: e.target.value }))}
              required className="input" placeholder="TSL2561" />
          </div>
          <div>
            <label className="label">Manufacturer</label>
            <input value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))}
              className="input" placeholder="Adafruit" />
          </div>
          <button type="submit" disabled={createModel.isPending} className="btn-primary text-xs">
            {createModel.isPending ? 'Saving…' : 'Create'}
          </button>
        </form>
      )}

      <Table items={items} columns={[
        { key: 'id_sensor_model', label: 'ID' },
        { key: 'model_name',      label: 'Model' },
        { key: 'manufacturer',    label: 'Manufacturer' },
      ]} />
    </div>
  )
}

function ActuatorModelSection() {
  const { data }       = useActuatorModels()
  const createModel    = useCreateActuatorModel()
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ model_name: '', actuator_type: '', manufacturer: '', model_config_json: '{}' })
  const [jsonError, setJsonError] = useState(null)

  const items = Array.isArray(data) ? data : (data?.data ?? [])

  async function handleCreate(e) {
    e.preventDefault()
    let parsed
    try { parsed = JSON.parse(form.model_config_json) } catch { setJsonError('Invalid JSON'); return }
    setJsonError(null)
    await createModel.mutateAsync({ ...form, model_config_json: parsed })
    setForm({ model_name: '', actuator_type: '', manufacturer: '', model_config_json: '{}' })
    setShow(false)
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Actuator Models</h3>
        <button onClick={() => setShow(v => !v)} className="btn-secondary text-xs px-2 py-1">
          {show ? 'Cancel' : '+ New'}
        </button>
      </div>

      {show && (
        <form onSubmit={handleCreate} className="bg-gray-900 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="label">Model name *</label>
              <input value={form.model_name} onChange={e => setForm(f => ({ ...f, model_name: e.target.value }))}
                required className="input" placeholder="NF-A4x10 Fan" />
            </div>
            <div>
              <label className="label">Actuator type (registry key) *</label>
              <input value={form.actuator_type} onChange={e => setForm(f => ({ ...f, actuator_type: e.target.value }))}
                required className="input" placeholder="FAN" />
            </div>
            <div>
              <label className="label">Manufacturer</label>
              <input value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))}
                className="input" placeholder="Noctua" />
            </div>
          </div>
          <div>
            <label className="label">Model config (JSON — shared specs for all instances)</label>
            <textarea value={form.model_config_json}
              onChange={e => { setForm(f => ({ ...f, model_config_json: e.target.value })); setJsonError(null) }}
              className="input font-mono text-xs" rows={3} placeholder='{"max_rpm": 5000}' />
            {jsonError && <p className="text-red-400 text-xs mt-1">{jsonError}</p>}
          </div>
          <button type="submit" disabled={createModel.isPending} className="btn-primary text-xs">
            {createModel.isPending ? 'Saving…' : 'Create'}
          </button>
        </form>
      )}

      <Table items={items} columns={[
        { key: 'id_actuator_model', label: 'ID' },
        { key: 'model_name',        label: 'Model' },
        { key: 'actuator_type',     label: 'Type' },
        { key: 'manufacturer',      label: 'Manufacturer' },
      ]} />
    </div>
  )
}

export default function Hardware() {
  const { data: variables } = useVariables()
  const { data: units }     = useUnits()

  const vr = Array.isArray(variables) ? variables : (variables?.data ?? [])
  const un = Array.isArray(units)     ? units     : (units?.data     ?? [])

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Hardware Catalog</h2>

      <SensorModelSection />
      <ActuatorModelSection />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Variables</h3>
          <Table items={vr} columns={[
            { key: 'id_variable', label: 'ID' },
            { key: 'name',        label: 'Name' },
            { key: 'description', label: 'Description' },
          ]} />
        </div>
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Units</h3>
          <Table items={un} columns={[
            { key: 'id_unit', label: 'ID' },
            { key: 'symbol', label: 'Symbol' },
            { key: 'name',   label: 'Name' },
          ]} />
        </div>
      </div>
    </div>
  )
}
