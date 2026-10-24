import { useMemo, useState } from 'react';
import { ExternalLink, RefreshCcw, Video } from 'lucide-react';
import { cameraHostLabel, cameraPageUrl, cameraStreamDisplayUrl } from '../../utils/esp32Cam';
import Esp32FaceEnroll from './Esp32FaceEnroll';

export default function Esp32CamFeed() {
  const pageUrl = useMemo(() => cameraPageUrl(), []);
  const streamUrl = useMemo(() => cameraStreamDisplayUrl(), []);
  const host = useMemo(() => cameraHostLabel(), []);
  const [reloadKey, setReloadKey] = useState(0);
  const [mode, setMode] = useState('stream');

  return (
    <section className="mt-4 overflow-hidden rounded-card border border-border-light bg-[#111827] shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Video className="h-5 w-5 text-emerald-400" />
          <div className="min-w-0">
            <p className="truncate text-body font-semibold text-white">ESP32-CAM · OV3660</p>
            <p className="truncate text-label text-slate-400">{host}</p>
          </div>
          <span className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-label font-semibold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-btn border border-white/10 bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setMode('stream')}
              className={`rounded-md px-3 py-1.5 text-label font-semibold ${
                mode === 'stream' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Stream only
            </button>
            <button
              type="button"
              onClick={() => setMode('enroll')}
              className={`rounded-md px-3 py-1.5 text-label font-semibold ${
                mode === 'enroll' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Enrolled Face
            </button>
            <button
              type="button"
              onClick={() => setMode('console')}
              className={`rounded-md px-3 py-1.5 text-label font-semibold ${
                mode === 'console' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Camera console
            </button>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((n) => n + 1)}
            className="inline-flex items-center gap-1.5 rounded-btn border border-white/10 bg-white/5 px-3 py-1.5 text-body font-medium text-slate-200 hover:bg-white/10"
          >
            <RefreshCcw className="h-4 w-4" />
            Reload
          </button>
          <a
            href={pageUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-btn border border-white/10 bg-white/5 px-3 py-1.5 text-body font-medium text-slate-200 hover:bg-white/10"
          >
            <ExternalLink className="h-4 w-4" />
            Open camera
          </a>
        </div>
      </div>

      <div className="relative min-h-[70vh] w-full bg-black">
        {mode === 'stream' && (
          <img
            key={`stream-${reloadKey}`}
            src={`${streamUrl}${streamUrl.includes('?') ? '&' : '?'}_=${reloadKey}`}
            alt="ESP32-CAM live stream"
            className="h-[70vh] w-full object-contain"
          />
        )}
        {mode === 'console' && (
          <iframe
            key={`console-${reloadKey}`}
            title="ESP32-CAM OV3660 console"
            src={pageUrl}
            className="h-[70vh] w-full border-0 bg-black"
            allow="camera; microphone"
          />
        )}
        {mode === 'enroll' && (
          <div className="grid min-h-[70vh] bg-[#111827] xl:grid-cols-2">
            <iframe
              key={`enroll-console-${reloadKey}`}
              title="ESP32-CAM OV3660 console"
              src={pageUrl}
              className="h-[70vh] w-full border-0 bg-black"
              allow="camera; microphone"
            />
            <div className="h-[70vh] overflow-auto border-t border-white/10 xl:border-l xl:border-t-0">
              <Esp32FaceEnroll key={`enroll-form-${reloadKey}`} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
