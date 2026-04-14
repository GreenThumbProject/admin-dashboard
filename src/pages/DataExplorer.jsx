import { useState } from 'react'
import { useMeasurements, useDevices, useVariables } from '../api/cloudApi'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLOURS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6']

export default function DataExplorer() {
  const [deviceId, setDeviceId] = useState('')
  const [varId, setVarId]       = useState('')
  const [limit, setLimit]       = useState(500)

  const { data: devices }  = useDevices()
  const { data: variables } = useVariables()
  const { data: measurements, isLoading } = useMeasurements({ deviceId: deviceId || undefined, varId: varId || undefined, limit })

  const deviceList = Array.isArray(devices)   ? devices   : (devices?.data   ?? [])
  const varList    = Array.isArray(variables)  ? variables : (variables?.data ?? [])
  const mList      = Array.isArray(measurements) ? measurements : (measurements?.data ?? [])

  // Format for chart
  const chartData = mList.map(m => ({
    ts:    new Date(m.collected_at).toLocaleString(),
    value: m.value,
    var:   m.id_variable,
  }))

  function handleExportCsv() {
    const header = 'id_measurement,collected_at,id_device_sensor,id_variable,value\n'
    const rows   = mList.map(m =>
      `${m.id_measurement},${m.collected_at},${m.id_device_sensor},${m.id_variable},${m.value}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'measurements.csv' })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Data Explorer</h2>
        <button onClick={handleExportCsv} disabled={mList.length === 0} className="btn-secondary">
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label">Device sensor</label>
          <select value={deviceId} onChange={e => setDeviceId(e.target.value)} className="input">
            <option value="">All</option>
            {deviceList.map(d => <option key={d.id_device} value={d.id_device}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Variable</label>
          <select value={varId} onChange={e => setVarId(e.target.value)} className="input">
            <option value="">All</option>
            {varList.map(v => <option key={v.id_variable} value={v.id_variable}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Limit</label>
          <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="input">
            {[100, 500, 1000, 5000].map(n => <option key={n} value={n}>{n} rows</option>)}
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-gray-500">Loading…</div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">No data</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="ts" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke={COLOURS[0]} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Raw table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800 max-h-96 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-900 sticky top-0">
            <tr>
              <th className="th">ID</th>
              <th className="th">Collected at</th>
              <th className="th">Sensor</th>
              <th className="th">Variable</th>
              <th className="th text-right">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {mList.map(m => (
              <tr key={m.id_measurement} className="bg-gray-950 hover:bg-gray-900">
                <td className="td text-gray-500">{m.id_measurement}</td>
                <td className="td font-mono">{new Date(m.collected_at).toLocaleString()}</td>
                <td className="td">{m.id_device_sensor}</td>
                <td className="td">{m.id_variable}</td>
                <td className="td text-right tabular-nums">{m.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
