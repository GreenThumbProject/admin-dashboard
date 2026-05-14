import { useState, Fragment } from 'react'
import {
  useSensorModels, useActuatorModels, useVariables, useUnits,
  useCreateSensorModel, useUpdateSensorModel, useDeleteSensorModel,
  useCreateActuatorModel, useDeleteActuatorModel,
  useSensorCapabilities, useCreateSensorCapability, useDeleteSensorCapability,
  useCreateUnit, useDeleteUnit, useCreateVariable, useDeleteVariable,
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

// ---------------------------------------------------------------------------
// Inline capability manager for a single sensor model row
// ---------------------------------------------------------------------------

function SensorModelCapabilities({ model, variables, units }) {
  const { data: caps }        = useSensorCapabilities(model.id_sensor_model)
  const createCap             = useCreateSensorCapability()
  const deleteCap             = useDeleteSensorCapability()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ id_variable: '', min_range: '', max_range: '', precision: '', accuracy: '' })

  const capList  = Array.isArray(caps) ? caps : (caps?.data ?? [])
  const unitList = Array.isArray(units) ? units : (units?.data ?? [])
  const unitMap  = Object.fromEntries(unitList.map(u => [u.id_unit, u.symbol]))
  const varMap   = Object.fromEntries(variables.map(v => [
    v.id_variable,
    v.default_unit_id && unitMap[v.default_unit_id]
      ? `${v.name} (${unitMap[v.default_unit_id]})`
      : v.name,
  ]))

  async function handleAdd(e) {
    e.preventDefault()
    await createCap.mutateAsync({
      id_sensor_model: model.id_sensor_model,
      id_variable:     Number(form.id_variable),
      min_range:       form.min_range !== '' ? Number(form.min_range) : 0,
      max_range:       form.max_range !== '' ? Number(form.max_range) : null,
      precision:       form.precision !== '' ? Number(form.precision) : null,
      accuracy:        form.accuracy  !== '' ? Number(form.accuracy)  : null,
    })
    setForm({ id_variable: '', min_range: '', max_range: '', precision: '', accuracy: '' })
    setShowForm(false)
  }

  return (
    <div className="px-4 pb-3 pt-2 border-t border-gray-800 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Capabilities</p>
        <button onClick={() => setShowForm(v => !v)} className="btn-secondary text-xs px-2 py-0.5">
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-gray-950 rounded p-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="label">Variable *</label>
              <select value={form.id_variable} onChange={e => setForm(f => ({ ...f, id_variable: e.target.value }))}
                required className="input text-xs">
                <option value="">Select…</option>
                {variables.map(v => <option key={v.id_variable} value={v.id_variable}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Min range</label>
              <input type="number" step="any" value={form.min_range}
                onChange={e => setForm(f => ({ ...f, min_range: e.target.value }))}
                className="input text-xs" placeholder="0" />
            </div>
            <div>
              <label className="label">Max range</label>
              <input type="number" step="any" value={form.max_range}
                onChange={e => setForm(f => ({ ...f, max_range: e.target.value }))}
                className="input text-xs" placeholder="100" />
            </div>
            <div>
              <label className="label">Precision</label>
              <input type="number" step="any" value={form.precision}
                onChange={e => setForm(f => ({ ...f, precision: e.target.value }))}
                className="input text-xs" placeholder="0.01" />
            </div>
            <div>
              <label className="label">Accuracy (±)</label>
              <input type="number" step="any" value={form.accuracy}
                onChange={e => setForm(f => ({ ...f, accuracy: e.target.value }))}
                className="input text-xs" placeholder="0.5" />
            </div>
          </div>
          <button type="submit" disabled={createCap.isPending} className="btn-primary text-xs">
            {createCap.isPending ? 'Adding…' : 'Add capability'}
          </button>
        </form>
      )}

      {capList.length === 0 ? (
        <p className="text-gray-600 text-xs">No capabilities defined.</p>
      ) : (
        <div className="space-y-1">
          {capList.map(c => (
            <div key={c.id_variable} className="flex items-center justify-between text-xs text-gray-400">
              <span>
                • {varMap[c.id_variable] ?? `Variable #${c.id_variable}`}
                {(c.min_range != null || c.max_range != null) && (
                  <span className="text-gray-600"> [{c.min_range ?? '—'} – {c.max_range ?? '—'}]</span>
                )}
              </span>
              <button
                onClick={() => deleteCap.mutateAsync({ id_sensor_model: model.id_sensor_model, id_variable: c.id_variable })}
                className="text-red-500 hover:text-red-400 ml-3"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sensor models section
// ---------------------------------------------------------------------------

function SensorModelSection() {
  const { data }              = useSensorModels()
  const { data: varsData }    = useVariables()
  const { data: unitsData }   = useUnits()
  const createModel           = useCreateSensorModel()
  const updateModel         = useUpdateSensorModel()
  const deleteModel         = useDeleteSensorModel()
  const [show, setShow]     = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [editingId, setEditingId]   = useState(null)
  const [editForm, setEditForm] = useState({ model_name: '', manufacturer: '', connection_type: '' })
  const [form, setForm]       = useState({ model_name: '', manufacturer: '', connection_type: '' })

  const items     = Array.isArray(data)      ? data      : (data?.data      ?? [])
  const varList   = Array.isArray(varsData)  ? varsData  : (varsData?.data  ?? [])
  const unitList  = Array.isArray(unitsData) ? unitsData : (unitsData?.data ?? [])

  async function handleCreate(e) {
    e.preventDefault()
    await createModel.mutateAsync(form)
    setForm({ model_name: '', manufacturer: '', connection_type: '' })
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
          <div>
            <label className="label">Connection type</label>
            <select value={form.connection_type} onChange={e => setForm(f => ({ ...f, connection_type: e.target.value }))}
              className="input">
              <option value="">—</option>
              {['I2C', 'SPI', 'UART', 'Analog', 'Digital', '1-Wire'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={createModel.isPending} className="btn-primary text-xs">
            {createModel.isPending ? 'Saving…' : 'Create'}
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <div className="text-gray-500 text-sm">No entries.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="th">ID</th>
                <th className="th">Model</th>
                <th className="th">Manufacturer</th>
                <th className="th">Connection</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {items.map(m => (
                <Fragment key={m.id_sensor_model}>
                  <tr className="bg-gray-950 hover:bg-gray-900">
                    <td className="td text-gray-500">{m.id_sensor_model}</td>
                    <td className="td text-gray-200">{m.model_name}</td>
                    <td className="td text-gray-400">{m.manufacturer ?? '—'}</td>
                    <td className="td text-gray-400">{m.connection_type ?? '—'}</td>
                    <td className="td text-right space-x-3">
                      <button
                        onClick={() => setExpandedId(v => v === m.id_sensor_model ? null : m.id_sensor_model)}
                        className="text-xs text-gray-500 hover:text-gray-300"
                      >
                        {expandedId === m.id_sensor_model ? 'Hide caps' : 'Capabilities'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(v => v === m.id_sensor_model ? null : m.id_sensor_model)
                          setEditForm({ model_name: m.model_name, manufacturer: m.manufacturer ?? '', connection_type: m.connection_type ?? '' })
                        }}
                        className="text-xs text-blue-500 hover:text-blue-400"
                      >
                        {editingId === m.id_sensor_model ? 'Cancel' : 'Edit'}
                      </button>
                      <button
                        onClick={() => deleteModel.mutateAsync(m.id_sensor_model)}
                        className="text-xs text-red-500 hover:text-red-400"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {editingId === m.id_sensor_model && (
                    <tr>
                      <td colSpan={4} className="bg-gray-950 px-4 py-2">
                        <form
                          onSubmit={async e => {
                            e.preventDefault()
                            await updateModel.mutateAsync({ id: m.id_sensor_model, ...editForm })
                            setEditingId(null)
                          }}
                          className="flex gap-2 items-end"
                        >
                          <div>
                            <label className="label">Model name</label>
                            <input value={editForm.model_name}
                              onChange={e => setEditForm(f => ({ ...f, model_name: e.target.value }))}
                              required className="input text-xs" />
                          </div>
                          <div>
                            <label className="label">Manufacturer</label>
                            <input value={editForm.manufacturer}
                              onChange={e => setEditForm(f => ({ ...f, manufacturer: e.target.value }))}
                              className="input text-xs" />
                          </div>
                          <div>
                            <label className="label">Connection</label>
                            <select value={editForm.connection_type}
                              onChange={e => setEditForm(f => ({ ...f, connection_type: e.target.value }))}
                              className="input text-xs">
                              <option value="">—</option>
                              {['I2C', 'SPI', 'UART', 'Analog', 'Digital', '1-Wire'].map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                          <button type="submit" disabled={updateModel.isPending} className="btn-primary text-xs">
                            {updateModel.isPending ? 'Saving…' : 'Save'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  )}
                  {expandedId === m.id_sensor_model && (
                    <tr>
                      <td colSpan={4} className="bg-gray-950">
                        <SensorModelCapabilities model={m} variables={varList} units={unitList} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Actuator models section (unchanged)
// ---------------------------------------------------------------------------

function ActuatorModelSection() {
  const { data }       = useActuatorModels()
  const createModel    = useCreateActuatorModel()
  const deleteModel    = useDeleteActuatorModel()
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ model_name: '', actuator_type: '', manufacturer: '', connection_type: '', power_w: '', voltage_v: '', model_config_json: '{}' })
  const [jsonError, setJsonError] = useState(null)

  const items = Array.isArray(data) ? data : (data?.data ?? [])

  async function handleCreate(e) {
    e.preventDefault()
    let parsed
    try { parsed = JSON.parse(form.model_config_json) } catch { setJsonError('Invalid JSON'); return }
    setJsonError(null)
    await createModel.mutateAsync({
      ...form,
      power_w:           form.power_w   !== '' ? Number(form.power_w)   : undefined,
      voltage_v:         form.voltage_v !== '' ? Number(form.voltage_v) : undefined,
      model_config_json: parsed,
    })
    setForm({ model_name: '', actuator_type: '', manufacturer: '', connection_type: '', power_w: '', voltage_v: '', model_config_json: '{}' })
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
            <div>
              <label className="label">Connection type</label>
              <select value={form.connection_type} onChange={e => setForm(f => ({ ...f, connection_type: e.target.value }))}
                className="input">
                <option value="">—</option>
                {['USB', '3PIN', 'I2C', 'PWM', 'Relay', 'UART', 'SPI'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Power (W)</label>
              <input type="number" step="0.01" value={form.power_w}
                onChange={e => setForm(f => ({ ...f, power_w: e.target.value }))}
                className="input" placeholder="5" />
            </div>
            <div>
              <label className="label">Voltage (V)</label>
              <input type="number" step="0.1" value={form.voltage_v}
                onChange={e => setForm(f => ({ ...f, voltage_v: e.target.value }))}
                className="input" placeholder="12" />
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
        { key: 'connection_type',   label: 'Connection', render: v => v ?? '—' },
        { key: 'power_w',           label: 'Power (W)',  render: v => v != null ? `${v} W` : '—' },
        { key: 'voltage_v',         label: 'Voltage (V)', render: v => v != null ? `${v} V` : '—' },
        { key: '_actions', label: '', render: (_, row) => (
          <button onClick={() => deleteModel.mutateAsync(row.id_actuator_model)}
            className="text-xs text-red-500 hover:text-red-400">Delete</button>
        )},
      ]} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Variables section
// ---------------------------------------------------------------------------

function VariableSection() {
  const { data }        = useVariables()
  const { data: unitData } = useUnits()
  const createVar       = useCreateVariable()
  const deleteVar       = useDeleteVariable()
  const [show, setShow]  = useState(false)
  const [form, setForm]  = useState({ name: '', description: '', default_unit_id: '' })

  const items    = Array.isArray(data)     ? data     : (data?.data     ?? [])
  const unitList = Array.isArray(unitData) ? unitData : (unitData?.data ?? [])
  const unitMap  = Object.fromEntries(unitList.map(u => [u.id_unit, u.symbol]))

  async function handleCreate(e) {
    e.preventDefault()
    await createVar.mutateAsync({
      name: form.name,
      description: form.description || undefined,
      default_unit_id: Number(form.default_unit_id),
    })
    setForm({ name: '', description: '', default_unit_id: '' })
    setShow(false)
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Variables</h3>
        <button onClick={() => setShow(v => !v)} className="btn-secondary text-xs px-2 py-1">
          {show ? 'Cancel' : '+ New'}
        </button>
      </div>
      {show && (
        <form onSubmit={handleCreate} className="bg-gray-900 rounded-lg p-3 space-y-2">
          <div>
            <label className="label">Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required className="input" placeholder="temperature" />
          </div>
          <div>
            <label className="label">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input" placeholder="Air temperature" />
          </div>
          <div>
            <label className="label">Unit *</label>
            <select value={form.default_unit_id} onChange={e => setForm(f => ({ ...f, default_unit_id: e.target.value }))}
              required className="input">
              <option value="">Select unit…</option>
              {unitList.map(u => <option key={u.id_unit} value={u.id_unit}>{u.name} ({u.symbol})</option>)}
            </select>
          </div>
          <button type="submit" disabled={createVar.isPending} className="btn-primary text-xs">
            {createVar.isPending ? 'Saving…' : 'Create'}
          </button>
        </form>
      )}
      <Table items={items} columns={[
        { key: 'id_variable', label: 'ID' },
        { key: 'name', label: 'Name', render: (val, row) => (
          <span>{val}{unitMap[row.default_unit_id] ? <span className="text-gray-500 ml-1">({unitMap[row.default_unit_id]})</span> : null}</span>
        )},
        { key: 'description', label: 'Description' },
        { key: '_actions', label: '', render: (_, row) => (
          <button onClick={() => deleteVar.mutateAsync(row.id_variable)}
            className="text-xs text-red-500 hover:text-red-400">Delete</button>
        )},
      ]} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Units section
// ---------------------------------------------------------------------------

function UnitSection() {
  const { data }        = useUnits()
  const createUnit      = useCreateUnit()
  const deleteUnit      = useDeleteUnit()
  const [show, setShow]  = useState(false)
  const [form, setForm]  = useState({ symbol: '', name: '' })

  const items = Array.isArray(data) ? data : (data?.data ?? [])

  async function handleCreate(e) {
    e.preventDefault()
    await createUnit.mutateAsync(form)
    setForm({ symbol: '', name: '' })
    setShow(false)
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Units</h3>
        <button onClick={() => setShow(v => !v)} className="btn-secondary text-xs px-2 py-1">
          {show ? 'Cancel' : '+ New'}
        </button>
      </div>
      {show && (
        <form onSubmit={handleCreate} className="bg-gray-900 rounded-lg p-3 space-y-2">
          <div>
            <label className="label">Symbol *</label>
            <input value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
              required className="input" placeholder="°C" />
          </div>
          <div>
            <label className="label">Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required className="input" placeholder="Celsius" />
          </div>
          <button type="submit" disabled={createUnit.isPending} className="btn-primary text-xs">
            {createUnit.isPending ? 'Saving…' : 'Create'}
          </button>
        </form>
      )}
      <Table items={items} columns={[
        { key: 'id_unit', label: 'ID' },
        { key: 'symbol',  label: 'Symbol' },
        { key: 'name',    label: 'Name' },
        { key: '_actions', label: '', render: (_, row) => (
          <button onClick={() => deleteUnit.mutateAsync(row.id_unit)}
            className="text-xs text-red-500 hover:text-red-400">Delete</button>
        )},
      ]} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Hardware() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Hardware Catalog</h2>

      <SensorModelSection />
      <ActuatorModelSection />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VariableSection />
        <UnitSection />
      </div>
    </div>
  )
}
