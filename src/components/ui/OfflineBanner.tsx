import { WifiOff, RefreshCw } from 'lucide-react'
import { useCratesStore } from '@/stores/cratesStore'

export default function OfflineBanner() {
  const { isOnline, offlineQueue, syncing } = useCratesStore()

  if (isOnline && offlineQueue.length === 0) return null

  return (
    <div className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${
      isOnline ? 'bg-amber-500/10 text-amber-400 border-b border-amber-500/20' : 'bg-red-500/10 text-red-400 border-b border-red-500/20'
    }`}>
      {isOnline ? (
        syncing ? (
          <><RefreshCw className="w-4 h-4 animate-spin" /> Synchronisation en cours…</>
        ) : (
          <><WifiOff className="w-4 h-4" /> {offlineQueue.length} action(s) en attente de synchronisation</>
        )
      ) : (
        <><WifiOff className="w-4 h-4" /> Mode hors-ligne — les modifications seront synchronisées à la reconnexion</>
      )}
    </div>
  )
}
