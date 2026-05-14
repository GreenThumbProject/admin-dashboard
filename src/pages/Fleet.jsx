import { useDevices } from '../api/cloudApi'
import { Link } from 'react-router-dom'

function statusBadge(lastSeenAt) {
  if (!lastSeenAt) return <span className="badge-gray">Never synced</span>
  const hoursAgo = (Date.now() - new Date(lastSeenAt)) / 3_600_000
  if (hoursAgo < 26)  return <span className="badge-green">Synced</span>
  if (hoursAgo < 50)  return <span className="badge-yellow">Stale</span>
  return <span className="badge-red">Offline</span>
}

export default function Fleet() {
  const { data: devices, isLoading, error } = useDevices()
  const list = Array.isArray(devices) ? devices : (devices?.data ?? [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Fleet Overview</h2>
        <div className="text-sm text-gray-500">{list.length} device(s)</div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total devices',  value: list.length },
          { label: 'Synced today',    value: list.filter(d => d.last_seen_at && (Date.now() - new Date(d.last_seen_at)) < 86_400_000).length },
          { label: 'Pending sync',   value: '—' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className="text-3xl font-bold text-brand-400">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Device table */}
      {isLoading ? (
        <div className="text-gray-500">Loading…</div>
      ) : error ? (
        <div className="text-red-400">{error.message}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="th">Device</th>
                <th className="th">Location</th>
                <th className="th">Mode</th>
                <th className="th">Status</th>
                <th className="th">Last updated</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {list.map(d => (
                <tr key={d.id_device} className="bg-gray-950 hover:bg-gray-900 transition-colors">
                  <td className="td font-medium text-gray-200">{d.name}</td>
                  <td className="td">{d.location ?? '—'}</td>
                  <td className="td">
                    <span className={`badge ${
                      d.device_mode === 'HIGH' ? 'badge-red' :
                      d.device_mode === 'MEDIUM' ? 'badge-yellow' : 'badge-gray'
                    }`}>{d.device_mode}</span>
                  </td>
                  <td className="td">{statusBadge(d.last_seen_at)}</td>
                  <td className="td text-gray-500">
                    {d.last_seen_at ? new Date(d.last_seen_at).toLocaleString() : '—'}
                  </td>
                  <td className="td">
                    <div className="flex gap-2 items-center">
                      <Link to={`/devices?open=${d.id_device}`} className="btn-secondary text-xs px-3 py-1">
                        View
                      </Link>
                      {d.tailscale_ip && (
                        <a href={`http://${d.tailscale_ip}:80`} target="_blank" rel="noreferrer"
                           className="btn-secondary text-xs px-3 py-1">
                          Local ↗
                        </a>
                      )}
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
