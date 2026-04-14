import { useState } from 'react'
import { usePhotos, useDevices } from '../api/cloudApi'

export default function Photos() {
  const [deviceId, setDeviceId]   = useState('')
  const [cultivId, setCultivId]   = useState('')
  const [enlarged, setEnlarged]   = useState(null)

  const { data: devices }   = useDevices()
  const { data: photos, isLoading } = usePhotos({ deviceId: deviceId || undefined, cultivationId: cultivId || undefined })

  const deviceList = Array.isArray(devices) ? devices : (devices?.data ?? [])
  const photoList  = Array.isArray(photos)  ? photos  : (photos?.data  ?? [])

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Photos</h2>

      {/* Filters */}
      <div className="card grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
        <div>
          <label className="label">Device</label>
          <select value={deviceId} onChange={e => setDeviceId(e.target.value)} className="input">
            <option value="">All devices</option>
            {deviceList.map(d => <option key={d.id_device} value={d.id_device}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Cultivation ID</label>
          <input
            type="number"
            value={cultivId}
            onChange={e => setCultivId(e.target.value)}
            className="input"
            placeholder="All"
          />
        </div>
      </div>

      {/* Gallery */}
      {isLoading ? (
        <div className="text-gray-500">Loading…</div>
      ) : photoList.length === 0 ? (
        <div className="card text-gray-500 text-sm">No photos found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {photoList.map(p => (
            <button
              key={p.id_photo}
              onClick={() => setEnlarged(p)}
              className="rounded-xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-brand-600 transition-colors group"
            >
              {p.cloud_url ? (
                <img
                  src={p.cloud_url}
                  alt={`Photo ${p.id_photo}`}
                  className="w-full aspect-square object-cover group-hover:opacity-90 transition-opacity"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center text-gray-600 text-xs">
                  No image
                </div>
              )}
              <div className="px-2 py-1 text-xs text-gray-500 truncate">
                {new Date(p.captured_at).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {enlarged && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
          onClick={() => setEnlarged(null)}
        >
          <div
            className="bg-gray-900 rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {enlarged.cloud_url && (
              <img src={enlarged.cloud_url} alt="Enlarged" className="w-full max-h-[70vh] object-contain" />
            )}
            <div className="p-4 space-y-1 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Photo #{enlarged.id_photo}</span>
                <span>{new Date(enlarged.captured_at).toLocaleString()}</span>
              </div>
              {enlarged.file_size_bytes && (
                <div className="text-gray-500 text-xs">
                  {(enlarged.file_size_bytes / 1024).toFixed(1)} KB
                  {enlarged.width && ` · ${enlarged.width}×${enlarged.height}`}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {enlarged.cloud_url && (
                  <a href={enlarged.cloud_url} target="_blank" rel="noreferrer" className="btn-secondary text-xs">
                    Open original
                  </a>
                )}
                <button onClick={() => setEnlarged(null)} className="btn-secondary text-xs">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
