import { useState } from 'react'
import {
  usePlantSpecies, useCreatePlantSpecies, useDeletePlantSpecies,
  useGrowthPhases, useCreateGrowthPhase,
} from '../api/cloudApi'

export default function Species() {
  const { data, isLoading } = usePlantSpecies()
  const createSpecies  = useCreatePlantSpecies()
  const deleteSpecies  = useDeletePlantSpecies()
  const [selected, setSelected] = useState(null)
  const [showSpeciesForm, setShowSpeciesForm] = useState(false)
  const [showPhaseForm, setShowPhaseForm]     = useState(false)
  const [speciesForm, setSpeciesForm]         = useState({ name: '', scientific_name: '' })
  const [phaseForm, setPhaseForm]             = useState({ name: '', phase_order: '', typical_duration_days: '', description: '' })

  const { data: phases } = useGrowthPhases(selected?.id_plant_species)
  const createPhase    = useCreateGrowthPhase()

  const list = Array.isArray(data) ? data : (data?.data ?? [])
  const phaseList = Array.isArray(phases) ? phases.filter(p => !p.is_default) : []

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
            <div key={s.id_plant_species}
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
              <button
                onClick={e => { e.stopPropagation(); deleteSpecies.mutate(s.id_plant_species) }}
                className="text-gray-600 hover:text-red-400 text-xs"
              >Delete</button>
            </div>
          ))}
        </div>

        {/* Growth phases for selected species */}
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
                <li key={p.id_growth_phase} className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-brand-900 text-brand-400 text-xs flex items-center justify-center font-bold">
                    {p.phase_order}
                  </span>
                  <div>
                    <div className="font-medium text-gray-200">{p.name}</div>
                    {p.typical_duration_days && (
                      <div className="text-xs text-gray-500">{p.typical_duration_days}d typical</div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
