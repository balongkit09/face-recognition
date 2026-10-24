import { Download, Film } from 'lucide-react';
import { recordingKind } from '../../utils/esp32Cam';
import { formatBytes } from '../../utils/playbackStore';

export default function RecordingPlayer({ recording, objectUrl, onDownload }) {
  if (!recording) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center gap-2 rounded-card border border-border-light bg-[#0b1220] text-center">
        <Film className="h-10 w-10 text-slate-500" />
        <p className="text-body font-medium text-slate-300">Select a recording to play</p>
        <p className="max-w-sm text-secondary text-slate-500">
          Open files from the ESP32-CAM SD card, or import clips you already downloaded.
        </p>
      </div>
    );
  }

  const kind = recordingKind(recording.name, recording.type);
  const src = objectUrl || recording.url;

  return (
    <div className="overflow-hidden rounded-card border border-border-light bg-[#0b1220] shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-body font-semibold text-white">{recording.name}</p>
          <p className="text-label text-slate-400">
            {kind === 'image' ? 'Photo' : 'Video'}
            {recording.size ? ` · ${formatBytes(recording.size)}` : ''}
            {recording.source === 'sd' ? ' · SD card' : ' · Downloaded'}
          </p>
        </div>
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 rounded-btn border border-white/10 bg-white/5 px-3 py-1.5 text-body font-medium text-slate-200 hover:bg-white/10"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        )}
      </div>
      <div className="flex min-h-[360px] items-center justify-center bg-black">
        {kind === 'image' ? (
          <img src={src} alt={recording.name} className="max-h-[70vh] w-full object-contain" />
        ) : (
          <video
            key={src}
            src={src}
            controls
            autoPlay
            className="max-h-[70vh] w-full bg-black"
          >
            This browser cannot play this SD-card file. Download it to view it locally.
          </video>
        )}
      </div>
    </div>
  );
}
