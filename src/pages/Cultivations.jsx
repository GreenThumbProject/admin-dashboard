import { useState } from 'react'
import { useCultivations, useCreateCultivation, useDevices, usePlantSpecies, useThresholds, useCreateThreshold, useUpdateThreshold } from '../api/cloudApi'

export default function Cultivations() {
  const { data: cultivations, isLoading } = useCultivations()
  const { data: devices }   = useDevices()
  const { data: species }   = usePlantSpecies()
  const createCultivation   = useCreateCultivation()
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ id_device: '', id_plant_species: '', notes: '' })

  const list       = Array.isArray(cultivations) ? cultivations : (cultivations?.data ?? [])
  const deviceList = Array.isArray(devices)  ? devices  : (devices?.data  ?? [])
  const speciesList = Array.isArray(species) ? species : (species?.data ?? [])

  async function handleCreate(e) {
    e.preventDefault()
    await createCultivation.mutateAsync({
      id_device: Number(form.id_device),
      id_plant_species: Number(form.id_plant_species),
      notes: form.notes || undefined,
    })
    setShowForm(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Cultivations</h2>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary">
          {showForm ? 'Cancel' : '+ New cultivation'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3 max-w-md">
          <div>
            <label className="label">Device</label>
            <select value={form.id_device} required className="input"
              onChange={e => setForm(f => ({ ...f, id_device: e.target.value }))}>
              <option value="">Select device…</option>
              {deviceList.map(d => <option key={d.id_device} value={d.id_device}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Plant species</label>
            <select value={form.id_plant_species} required className="input"
              onChange={e => setForm(f => ({ ...f, id_plant_species: e.target.value }))}>
              <option value="">Select species…</option>
              {speciesList.map(s => <option key={s.id_plant_species} value={s.id_plant_species}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <input value={form.notes} className="input"
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <button type="submit" disabled={createCultivation.isPending} className="btn-primary">
            {createCultivation.isPending ? 'Creating…' : 'Start cultivation'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cultivation list */}
        <div className="space-y-2 lg:col-span-1">
          {isLoading ? <div className="text-gray-500">Loading…</div> : list.map(c => (
            <div key={c.id_cultivation}
              onClick={() => setSelected(c)}
              className={`card cursor-pointer transition-colors ${
                selected?.id_cultivation === c.id_cultivation
                  ? 'border-brand-600 bg-brand-900/20'
                  : 'hover:border-gray-700'
              }`}
            >
              <div className="font-medium text-sm text-gray-200">Cultivation #{c.id_cultivation}</div>
              <div className="text-xs text-gray-500">
                {c.end_date ? 'Ended' : <span className="text-brand-400">Active</span>}
                {' · '}{c.start_date ? new Date(c.start_date).toLocaleDateString() : '—'}
              </div>
            </div>
          ))}
        </div>

        {/* Threshold editor for selected cultivation */}
        <div className="lg:col-span-2">
          {selected
            ? <ThresholdPanel cultivation={selected} />
            : <div className="card text-gray-500 text-sm">Select a cultivation to manage thresholds.</div>
          }
        </div>
      </div>
    </div>
  )
}

function ThresholdPanel({ cultivation }) {
  const { data, isLoading } = useThresholds(cultivation.id_cultivation)
  const createThreshold = useCreateThreshold()
  const updateThreshold = useUpdateThreshold()
  const [showForm, setShowForm] = useState(false)
  const [newT, setNewT] = useState({ id_variable: '', id_growth_phase: '', min_value: '', max_value: '' })
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState({})

  const list = Array.isArray(data) ? data : (data?.data ?? [])

  async function handleCreate(e) {
    e.preventDefault()
    await createThreshold.mutateAsync({
      id_cultivation: cultivation.id_cultivation,
      id_variable: Number(newT.id_variable),
      id_growth_phase: Number(newT.id_growth_phase),
      min_value: newT.min_value ? Number(newT.min_value) : undefined,
      max_value: newT.max_value ? Number(newT.max_value) : undefined,
    })
    setNewT({ id_variable: '', id_growth_phase: '', min_value: '', max_value: '' })
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">
          Thresholds — Cultivation #{cultivation.id_cultivation}
        </h3>
        <button onClick={() => setShowForm(v => !v)} className="btn-secondary text-xs px-3 py-1">
          {showForm ? 'Cancel' : '+ Threshold'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card grid grid-cols-2 gap-3">
          {[
            ['Variable ID', 'id_variable', 'number'],
            ['Growth phase ID', 'id_growth_phase', 'number'],
            ['Min value', 'min_value', 'number'],
            ['Max value', 'max_value', 'number'],
          ].map(([label, key, type]) => (
            <div key={key}>
              <label className="label text-xs">{label}</label>
              <input type={type} value={newT[key]} className="input text-sm"
                onChange={e => setNewT(n => ({ ...n, [key]: e.target.value }))} />
            </div>
          ))}
          <div className="col-span-2">
            <button type="submit" disabled={createThreshold.isPending} className="btn-primary text-sm">
              {createThreshold.isPending ? 'Adding…' : 'Add threshold'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-gray-500 text-sm">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="th">Variable</th>
                <th className="th">Phase</th>
                <th className="th text-right">Min</th>
                <th className="th text-right">Max</th>
                <th className="th text-center">Active</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {list.map(t => (
                <tr key={t.id_threshold} className="bg-gray-950 hover:bg-gray-900">
                  <td className="td">{t.id_variable}</td>
                  <td className="td">{t.id_growth_phase}</td>
                  {editing === t.id_threshold ? (
                    <>
                      <td className="px-4 py-2">
                        <input type="number" value={draft.min_value ?? ''} className="input w-20 text-right text-xs"
                          onChange={e => setDraft(d => ({ ...d, min_value: e.target.value }))} />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" value={draft.max_value ?? ''} className="input w-20 text-right text-xs"
                          onChange={e => setDraft(d => ({ ...d, max_value: e.target.value }))} />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input type="checkbox" checked={draft.is_active ?? true}
                          onChange={e => setDraft(d => ({ ...d, is_active: e.target.checked }))}
                          className="accent-brand-500" />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <button className="btn-primary text-xs px-2 py-1"
                            onClick={async () => {
                              await updateThreshold.mutateAsync({ id: t.id_threshold, ...draft })
                              setEditing(null)
                            }}>Save</button>
                          <button className="btn-secondary text-xs px-2 py-1" onClick={() => setEditing(null)}>✕</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="td text-right tabular-nums">{t.min_value ?? '—'}</td>
                      <td className="td text-right tabular-nums">{t.max_value ?? '—'}</td>
                      <td className="td text-center">
                        <span className={t.is_active ? 'badge-green' : 'badge-gray'}>
                          {t.is_active ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="td">
                        <button className="btn-secondary text-xs px-2 py-1"
                          onClick={() => { setEditing(t.id_threshold); setDraft({ min_value: t.min_value, max_value: t.max_value, is_active: t.is_active }) }}>
                          Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
