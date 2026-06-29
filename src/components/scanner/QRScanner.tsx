import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CameraOff } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Props {
  onScan: (value: string) => void
  active?: boolean
}

export default function QRScanner({ onScan, active = true }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [torch, setTorch] = useState(false)
  const lockedRef = useRef(false)  // empêche les scans multiples
  const divId = 'qr-reader-container'

  const handleDecode = useCallback((decodedText: string) => {
    // Si déjà en train de traiter un scan, on ignore
    if (lockedRef.current) return
    lockedRef.current = true

    // Une seule vibration courte
    navigator.vibrate?.(80)

    onScan(decodedText)

    // Déblocage après 3 secondes pour éviter les scans répétés
    setTimeout(() => {
      lockedRef.current = false
    }, 3000)
  }, [onScan])

  const startScanner = async () => {
    try {
      // Nettoie l'instance précédente si elle existe
      if (scannerRef.current) {
        try { await scannerRef.current.stop() } catch { /* ignore */ }
        scannerRef.current.clear()
        scannerRef.current = null
      }

      const scanner = new Html5Qrcode(divId)
      scannerRef.current = scanner
      setError(null)
      lockedRef.current = false

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        handleDecode,
        undefined
      )
      setScanning(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setError('Accès à la caméra refusé. Autorisez la caméra dans les paramètres de votre navigateur.')
      } else {
        setError('Impossible de démarrer la caméra. Réessayez.')
      }
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch { /* ignore */ }
      scannerRef.current = null
      setScanning(false)
    }
  }

  const toggleTorch = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      const track = stream.getVideoTracks()[0]
      const capabilities = track.getCapabilities() as { torch?: boolean }
      if (capabilities.torch) {
        await track.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] })
        setTorch(!torch)
      }
    } catch { /* non supporté */ }
  }

  useEffect(() => {
    if (active) startScanner()
    return () => { stopScanner() }
  }, [active])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-sm">
        {/* Conteneur caméra */}
        <div
          id={divId}
          className="w-full rounded-2xl overflow-hidden bg-slate-900 min-h-[300px]"
          style={{ aspectRatio: '1' }}
        />

        {/* Coins de visée */}
        {scanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-52 h-52">
              {[
                'top-0 left-0 border-t-2 border-l-2',
                'top-0 right-0 border-t-2 border-r-2',
                'bottom-0 left-0 border-b-2 border-l-2',
                'bottom-0 right-0 border-b-2 border-r-2'
              ].map((pos, i) => (
                <div key={i} className={`absolute w-6 h-6 ${pos} border-amber-400 rounded-sm`} />
              ))}
              {/* Ligne de scan animée */}
              <div className="absolute inset-x-0 h-0.5 bg-amber-400/60 animate-bounce top-1/2" />
            </div>
          </div>
        )}

        {/* Bouton torche */}
        {scanning && (
          <button
            onClick={toggleTorch}
            className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              torch ? 'bg-amber-500 text-slate-900' : 'bg-black/50 text-white'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill={torch ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="m8 1 4 8 4-8"/>
              <path d="M12 9v6l3 5H9l3-5V9"/>
            </svg>
          </button>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <div className="w-full max-w-sm bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
          <CameraOff className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400 text-sm">{error}</p>
          <Button onClick={startScanner} variant="danger" size="sm" className="mt-3">
            Réessayer
          </Button>
        </div>
      )}

      {!scanning && !error && (
        <div className="text-center">
          <Camera className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Démarrage de la caméra…</p>
        </div>
      )}

      {scanning && (
        <p className="text-slate-400 text-sm text-center">
          Pointez la caméra vers un QR code CrateTracker
        </p>
      )}
    </div>
  )
}
