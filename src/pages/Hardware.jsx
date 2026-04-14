import { useSensorModels, useActuatorModels, useVariables, useUnits } from '../api/cloudApi'

function Section({ title, items, columns }) {
  return (
    <div className="card space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
      {!items ? (
        <div className="text-gray-500 text-sm">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500 text-sm">No entries.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>{columns.map(c => <th key={c.key} className="th">{c.label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {items.map((row, i) => (
                <tr key={i} className="bg-gray-950 hover:bg-gray-900">
                  {columns.map(c => (
                    <td key={c.key} className="td">{row[c.key] ?? '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function Hardware() {
  const { data: sensorModels }   = useSensorModels()
  const { data: actuatorModels } = useActuatorModels()
  const { data: variables }      = useVariables()
  const { data: units }          = useUnits()

  const sm = Array.isArray(sensorModels)   ? sensorModels   : (sensorModels?.data   ?? [])
  const am = Array.isArray(actuatorModels) ? actuatorModels : (actuatorModels?.data ?? [])
  const vr = Array.isArray(variables)      ? variables      : (variables?.data      ?? [])
  const un = Array.isArray(units)          ? units          : (units?.data          ?? [])

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Hardware Catalog</h2>

      <Section title="Sensor Models" items={sm} columns={[
        { key: 'id_sensor_model', label: 'ID' },
        { key: 'model_name',      label: 'Model' },
        { key: 'manufacturer',    label: 'Manufacturer' },
        { key: 'interface',       label: 'Interface' },
      ]} />

      <Section title="Actuator Models" items={am} columns={[
        { key: 'id_actuator_model', label: 'ID' },
        { key: 'model_name',        label: 'Model' },
        { key: 'actuator_type',     label: 'Type' },
      ]} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Variables" items={vr} columns={[
          { key: 'id_variable',  label: 'ID' },
          { key: 'name',         label: 'Name' },
          { key: 'description',  label: 'Description' },
        ]} />

        <Section title="Units" items={un} columns={[
          { key: 'id_unit', label: 'ID' },
          { key: 'symbol',  label: 'Symbol' },
          { key: 'name',    label: 'Name' },
        ]} />
      </div>
    </div>
  )
}
