import { useState } from 'react'
import {
  usePlantSpecies, useCreatePlantSpecies, useDeletePlantSpecies, useUpdatePlantSpecies,
  useGrowthPhases, useCreateGrowthPhase, useUpdateGrowthPhase, useDeleteGrowthPhase,
  useVariables, useUnits,
  useSpeciesThresholds, useCreateSpeciesThreshold, useUpdateSpeciesThreshold, useDeleteSpeciesThreshold,
} from '../api/cloudApi'

export default function Species() {
  const { data, isLoading } = usePlantSpecies()
  const createSpecies  = useCreatePlantSpecies()
  const deleteSpecies  = useDeletePlantSpecies()
  const updateSpecies  = useUpdatePlantSpecies()
  const [selected, setSelected]         = useState(null)
  const [showSpeciesForm, setShowSpeciesForm] = useState(false)
  const [showPhaseForm, setShowPhaseForm]     = useState(false)
  const [speciesForm, setSpeciesForm]         = useState({ name: '', scientific_name: '' })
  const [phaseForm, setPhaseForm]             = useState({ name: '', phase_order: '', typical_duration_days: '', description: '' })
  const [editingSpeciesId, setEditingSpeciesId] = useState(null)
  const [editSpeciesForm, setEditSpeciesForm]   = useState({ name: '', scientific_name: '' })
  const [editingPhaseId, setEditingPhaseId]     = useState(null)
  const [editPhaseForm, setEditPhaseForm]       = useState({ name: '', phase_order: '', typical_duration_days: '' })

  const { data: phases }     = useGrowthPhases(selected?.id_plant_species)
  const { data: varsData }   = useVariables()
  const { data: unitsData }  = useUnits()
  const createPhase  = useCreateGrowthPhase()
  const updatePhase  = useUpdateGrowthPhase()
  const deletePhase  = useDeleteGrowthPhase()

  const list      = Array.isArray(data)   ? data   : (data?.data   ?? [])
  const phaseList = Array.isArray(phases) ? phases : []
  const varList   = Array.isArray(varsData)  ? varsData  : (varsData?.data  ?? [])
  const unitList  = Array.isArray(unitsData) ? unitsData : (unitsData?.data ?? [])

  const unitMap = Object.fromEntries(unitList.map(u => [u.id_unit, u.symbol]))
  const varMap  = Object.fromEntries(varList.map(v => [
    v.id_variable,
    v.default_unit_id && unitMap[v.default_unit_id] ? `${v.name} (${unitMap[v.default_unit_id]})` : v.name,
  ]))
  const phaseMap = Object.fromEntries(phaseList.map(p => [p.id_growth_phase, p.name]))

  async function handleCreateSpecies(e) {
    e.preventDefault()
    await createSpecies.mutateAsync(speciesForm)
    setSpeciesForm({ name: '', scientific_name: '' })
    setShowSpeciesForm(false)
  }

  async function handleCreatePhase(e) {
    e.preventDefault()
    await createPhase.mutateAsync({
      ...phaseForm,
      id_plant_species: selected.id_plant_species,
      phase_order: Number(phaseForm.phase_order),
      typical_duration_days: phaseForm.typical_duration_days ? Number(phaseForm.typical_duration_days) : undefined,
    })
    setPhaseForm({ name: '', phase_order: '', typical_duration_days: '', description: '' })
    setShowPhaseForm(false)
  }

  async function handleUpdateSpecies(e) {
    e.preventDefault()
    await updateSpecies.mutateAsync({ id: editingSpeciesId, ...editSpeciesForm })
    if (selected?.id_plant_species === editingSpeciesId) {
      setSelected(s => ({ ...s, ...editSpeciesForm }))
    }
    setEditingSpeciesId(null)
  }

  async function handleUpdatePhase(e) {
    e.preventDefault()
    await updatePhase.mutateAsync({
      id: editingPhaseId,
      speciesId: selected.id_plant_species,
      ...editPhaseForm,
      phase_order: Number(editPhaseForm.phase_order),
      typical_duration_days: editPhaseForm.typical_duration_days ? Number(editPhaseForm.typical_duration_days) : undefined,
    })
    setEditingPhaseId(null)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Plant Species</h2>
        <button onClick={() => setShowSpeciesForm(v => !v)} className="btn-primary">
          {showSpeciesForm ? 'Cancel' : '+ New species'}
        </button>
      </div>

      {showSpeciesForm && (
        <form onSubmit={handleCreateSpecies} className="card space-y-3 max-w-md">
          <div>
            <label className="label">Common name</label>
            <input value={speciesForm.name} required className="input"
              onChange={e => setSpeciesForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Scientific name</label>
            <input value={speciesForm.scientific_name} className="input"
              onChange={e => setSpeciesForm(f => ({ ...f, scientific_name: e.target.value }))} />
          </div>
          <button type="submit" disabled={createSpecies.isPending} className="btn-primary">
            {createSpecies.isPending ? 'Creating…' : 'Create'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Species list */}
        <div className="card space-y-2">
          <h3 className="text-sm font-semibold text-gray-300">Species</h3>
          {isLoading ? (
            <div className="text-gray-500 text-sm">Loading…</div>
          ) : list.map(s => (
            <div key={s.id_plant_species}>
              {editingSpeciesId === s.id_plant_species ? (
                <form onSubmit={handleUpdateSpecies}
                  className="flex gap-2 items-end px-3 py-2 rounded-lg bg-gray-800">
                  <div className="flex-1">
                    <input value={editSpeciesForm.name} required className="input text-xs mb-1"
                      placeholder="Common name"
                      onChange={e => setEditSpeciesForm(f => ({ ...f, name: e.target.value }))} />
                    <input value={editSpeciesForm.scientific_name} className="input text-xs"
                      placeholder="Scientific name"
                      onChange={e => setEditSpeciesForm(f => ({ ...f, scientific_name: e.target.value }))} />
                  </div>
                  <button type="submit" disabled={updateSpecies.isPending}
                    className="btn-primary text-xs px-2 py-1">
                    {updateSpecies.isPending ? '…' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setEditingSpeciesId(null)}
                    className="btn-secondary text-xs px-2 py-1">Cancel</button>
                </form>
              ) : (
                <div
                  onClick={() => setSelected(s)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selected?.id_plant_species === s.id_plant_species
                      ? 'bg-brand-900/40 text-brand-300'
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <div>
                    <div className="font-medium text-sm">{s.name}</div>
                    {s.scientific_name && <div className="text-xs text-gray-500 italic">{s.scientific_name}</div>}
                  </div>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setEditingSpeciesId(s.id_plant_species)
                        setEditSpeciesForm({ name: s.name, scientific_name: s.scientific_name ?? '' })
                      }}
                      className="text-gray-500 hover:text-blue-400 text-xs"
                    >Edit</button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteSpecies.mutate(s.id_plant_species) }}
                      className="text-gray-600 hover:text-red-400 text-xs"
                    >Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right column: growth phases + template thresholds */}
        <div className="space-y-6">
          {/* Growth phases */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300">
                Growth phases{selected ? ` — ${selected.name}` : ''}
              </h3>
              {selected && (
                <button onClick={() => setShowPhaseForm(v => !v)} className="btn-secondary text-xs px-3 py-1">
                  {showPhaseForm ? 'Cancel' : '+ Phase'}
                </button>
              )}
            </div>

            {!selected && <p className="text-gray-500 text-sm">Select a species to view phases.</p>}

            {selected && showPhaseForm && (
              <form onSubmit={handleCreatePhase} className="space-y-2 pt-2 border-t border-gray-800">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-xs">Name</label>
                    <input value={phaseForm.name} required className="input text-sm"
                      onChange={e => setPhaseForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label text-xs">Order</label>
                    <input type="number" value={phaseForm.phase_order} required className="input text-sm"
                      onChange={e => setPhaseForm(f => ({ ...f, phase_order: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label text-xs">Typical days</label>
                    <input type="number" value={phaseForm.typical_duration_days} className="input text-sm"
                      onChange={e => setPhaseForm(f => ({ ...f, typical_duration_days: e.target.value }))} />
                  </div>
                </div>
                <button type="submit" disabled={createPhase.isPending} className="btn-primary text-sm">
                  {createPhase.isPending ? 'Adding…' : 'Add phase'}
                </button>
              </form>
            )}

            {selected && (
              <ol className="space-y-2">
                {phaseList.sort((a,b) => a.phase_order - b.phase_order).map(p => (
                  <li key={p.id_growth_phase}>
                    {editingPhaseId === p.id_growth_phase ? (
                      <form onSubmit={handleUpdatePhase}
                        className="flex gap-2 items-end bg-gray-800 rounded-lg px-3 py-2">
                        <div className="grid grid-cols-3 gap-2 flex-1">
                          <div className="col-span-3">
                            <input value={editPhaseForm.name} required className="input text-xs"
                              placeholder="Phase name"
                              onChange={e => setEditPhaseForm(f => ({ ...f, name: e.target.value }))} />
                          </div>
                          <div>
                            <input type="number" value={editPhaseForm.phase_order} required
                              className="input text-xs" placeholder="Order"
                              onChange={e => setEditPhaseForm(f => ({ ...f, phase_order: e.target.value }))} />
                          </div>
                          <div>
                            <input type="number" value={editPhaseForm.typical_duration_days}
                              className="input text-xs" placeholder="Days"
                              onChange={e => setEditPhaseForm(f => ({ ...f, typical_duration_days: e.target.value }))} />
                          </div>
                        </div>
                        <button type="submit" disabled={updatePhase.isPending}
                          className="btn-primary text-xs px-2 py-1">
                          {updatePhase.isPending ? '…' : 'Save'}
                        </button>
                        <button type="button" onClick={() => setEditingPhaseId(null)}
                          className="btn-secondary text-xs px-2 py-1">Cancel</button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="w-6 h-6 rounded-full bg-brand-900 text-brand-400 text-xs flex items-center justify-center font-bold shrink-0">
                          {p.phase_order}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-200">{p.name}</div>
                          {p.typical_duration_days && (
                            <div className="text-xs text-gray-500">{p.typical_duration_days}d typical</div>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setEditingPhaseId(p.id_growth_phase)
                              setEditPhaseForm({
                                name: p.name,
                                phase_order: String(p.phase_order),
                                typical_duration_days: p.typical_duration_days ? String(p.typical_duration_days) : '',
                              })
                            }}
                            className="text-gray-500 hover:text-blue-400 text-xs"
                          >Edit</button>
                          <button
                            onClick={() => deletePhase.mutate({ id: p.id_growth_phase, speciesId: selected.id_plant_species })}
                            className="text-gray-600 hover:text-red-400 text-xs"
                          >Delete</button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Template thresholds */}
          {selected && (
            <SpeciesThresholdPanel
              species={selected}
              varList={varList}
              varMap={varMap}
              phaseList={phaseList}
              phaseMap={phaseMap}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function SpeciesThresholdPanel({ species, varList, varMap, phaseList, phaseMap }) {
  const { data }          = useSpeciesThresholds(species.id_plant_species)
  const createThr         = useCreateSpeciesThreshold()
  const deleteThr         = useDeleteSpeciesThreshold()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ id_variable: '', id_growth_phase: '', min_value: '', max_value: '', target_value: '', source: 'manual' })

  const list = Array.isArray(data) ? data : (data?.data ?? [])

  async function handleCreate(e) {
    e.preventDefault()
    await createThr.mutateAsync({
      id_plant_species: species.id_plant_species,
      id_variable:      Number(form.id_variable),
      id_growth_phase:  Number(form.id_growth_phase),
      min_value:        form.min_value    !== '' ? Number(form.min_value)    : null,
      max_value:        form.max_value    !== '' ? Number(form.max_value)    : null,
      target_value:     form.target_value !== '' ? Number(form.target_value) : null,
      source:           form.source,
    })
    setForm({ id_variable: '', id_growth_phase: '', min_value: '', max_value: '', target_value: '', source: 'manual' })
    setShowForm(false)
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Template Thresholds</h3>
        <button onClick={() => setShowForm(v => !v)} className="btn-secondary text-xs px-3 py-1">
          {showForm ? 'Cancel' : '+ Template'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800">
          <div className="col-span-2">
            <label className="label text-xs">Variable *</label>
            <select value={form.id_variable} required className="input text-sm"
              onChange={e => setForm(f => ({ ...f, id_variable: e.target.value }))}>
              <option value="">Select variable…</option>
              {varList.map(v => <option key={v.id_variable} value={v.id_variable}>{varMap[v.id_variable]}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label text-xs">Growth phase *</label>
            <select value={form.id_growth_phase} required className="input text-sm"
              onChange={e => setForm(f => ({ ...f, id_growth_phase: e.target.value }))}>
              <option value="">Select phase…</option>
              {phaseList.map(p => <option key={p.id_growth_phase} value={p.id_growth_phase}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Min</label>
            <input type="number" step="any" value={form.min_value} className="input text-sm"
              onChange={e => setForm(f => ({ ...f, min_value: e.target.value }))} />
          </div>
          <div>
            <label className="label text-xs">Target</label>
            <input type="number" step="any" value={form.target_value} className="input text-sm"
              onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} />
          </div>
          <div>
            <label className="label text-xs">Max</label>
            <input type="number" step="any" value={form.max_value} className="input text-sm"
              onChange={e => setForm(f => ({ ...f, max_value: e.target.value }))} />
          </div>
          <div>
            <label className="label text-xs">Source</label>
            <select value={form.source} className="input text-sm"
              onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
              <option value="manual">Manual</option>
              <option value="ml">ML</option>
              <option value="community">Community</option>
            </select>
          </div>
          <div className="col-span-2">
            <button type="submit" disabled={createThr.isPending} className="btn-primary text-sm">
              {createThr.isPending ? 'Adding…' : 'Add template'}
            </button>
          </div>
        </form>
      )}

      {list.length === 0 ? (
        <p className="text-gray-600 text-xs">No templates defined.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-xs">
            <thead className="bg-gray-900">
              <tr>
                <th className="th">Variable</th>
                <th className="th">Phase</th>
                <th className="th text-right">Min</th>
                <th className="th text-right">Target</th>
                <th className="th text-right">Max</th>
                <th className="th">Source</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {list.map(t => (
                <tr key={t.id_species_threshold} className="bg-gray-950 hover:bg-gray-900">
                  <td className="td text-gray-300">{varMap[t.id_variable] ?? `#${t.id_variable}`}</td>
                  <td className="td text-gray-400">{phaseMap[t.id_growth_phase] ?? `#${t.id_growth_phase}`}</td>
                  <td className="td text-right tabular-nums">{t.min_value ?? '—'}</td>
                  <td className="td text-right tabular-nums">{t.target_value ?? '—'}</td>
                  <td className="td text-right tabular-nums">{t.max_value ?? '—'}</td>
                  <td className="td">
                    <span className="badge-gray capitalize">{t.source}</span>
                  </td>
                  <td className="td">
                    <button
                      onClick={() => deleteThr.mutate({ id: t.id_species_threshold, speciesId: species.id_plant_species })}
                      className="text-red-500 hover:text-red-400 text-xs"
                    >Delete</button>
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
