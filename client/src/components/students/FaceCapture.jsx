import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCcw } from 'lucide-react';
import Button from '../common/Button';
import { cameraStreamDisplayUrl, captureEsp32Still, snapshotFromElement } from '../../utils/esp32Cam';

export const FACE_POSES = [
  { key: 'front', label: 'Front', hint: 'Look straight at the camera' },
  { key: 'right', label: 'Right side', hint: 'Turn the head to the right' },
  { key: 'left', label: 'Left side', hint: 'Turn the head to the left' },
];

export function emptyCaptures() {
  return { front: '', right: '', left: '' };
}

export function allPosesCaptured(captures) {
  return FACE_POSES.every((pose) => Boolean(captures?.[pose.key]));
}

export default function FaceCapture({ captures, onChange, disabled = false, source = 'webcam' }) {
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const streamRef = useRef(null);
  const [poseIndex, setPoseIndex] = useState(0);
  const [cameraError, setCameraError] = useState('');
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const fromEsp32 = source === 'esp32';

  const pose = FACE_POSES[poseIndex];

  useEffect(() => {
    let cancelled = false;
    if (fromEsp32) {
      setCameraError('');
      setReady(false);
      return undefined;
    }
    async function start() {
      setCameraError('');
      setReady(false);
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('This browser cannot open the camera.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 540 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch (err) {
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Allow camera access to capture the front, right, and left face photos.'
            : err.message || 'Could not open the camera.',
        );
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [fromEsp32]);

  const capture = async () => {
    if (!ready || capturing) return;
    setCapturing(true);
    setCameraError('');
    try {
      let dataUrl = '';
      if (fromEsp32) {
        try {
          dataUrl = await captureEsp32Still();
        } catch {
          const img = imageRef.current;
          if (!img) throw new Error('ESP32-CAM stream is not ready.');
          dataUrl = snapshotFromElement(img);
        }
      } else {
        const video = videoRef.current;
        if (!video) return;
        dataUrl = snapshotFromElement(video);
      }
      onChange({ ...captures, [pose.key]: dataUrl });
      if (poseIndex < FACE_POSES.length - 1) setPoseIndex((i) => i + 1);
    } catch (err) {
      setCameraError(err.message || 'Could not capture this pose from the camera.');
    } finally {
      setCapturing(false);
    }
  };

  const retake = (key) => {
    const index = FACE_POSES.findIndex((p) => p.key === key);
    onChange({ ...captures, [key]: '' });
    if (index >= 0) setPoseIndex(index);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {FACE_POSES.map((item, index) => {
          const done = Boolean(captures[item.key]);
          const active = index === poseIndex;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setPoseIndex(index)}
              className={`rounded-full px-3 py-1.5 text-label font-semibold uppercase tracking-wide ${
                active
                  ? 'bg-primary text-white'
                  : done
                    ? 'bg-success-bg text-success-text'
                    : 'border border-border bg-white text-slate-500'
              }`}
            >
              {index + 1}. {item.label}
              {done ? ' · Done' : ''}
            </button>
          );
        })}
      </div>

      {cameraError && <p className="rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{cameraError}</p>}

      <div className="overflow-hidden rounded-card border border-border-light bg-slate-900">
        <div className="relative aspect-[4/3] bg-slate-950">
          {fromEsp32 ? (
            <img
              ref={imageRef}
              src={cameraStreamDisplayUrl()}
              alt="ESP32-CAM enrollment stream"
              onLoad={() => setReady(true)}
              onError={() => {
                setReady(false);
                setCameraError('Could not open the ESP32-CAM stream. Keep the camera on the same network.');
              }}
              className="h-full w-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
              aria-label="Face enrollment camera"
            />
          )}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[72%] w-[54%] rounded-[50%] border-2 border-white/70 shadow-[0_0_0_999px_rgba(15,23,42,0.35)]" />
          </div>
          <p className="absolute bottom-3 left-3 right-3 rounded-btn bg-slate-900/70 px-3 py-2 text-center text-body text-white">
            {pose.label}: {pose.hint}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-secondary text-slate-500">
          {fromEsp32
            ? 'Use the ESP32-CAM. Capture front, right side, then left side.'
            : `Capture ${FACE_POSES.length} photos — front, right side, then left side.`}
        </p>
        <Button type="button" onClick={capture} disabled={disabled || capturing || !ready || Boolean(captures[pose.key])}>
          <Camera className="h-4 w-4" />
          {capturing ? 'Capturing…' : captures[pose.key] ? `${pose.label} captured` : `Capture ${pose.label}`}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {FACE_POSES.map((item) => (
          <figure key={item.key} className="overflow-hidden rounded-btn border border-border-light bg-[#f8fafc]">
            {captures[item.key] ? (
              <img src={captures[item.key]} alt={`${item.label} face capture`} className="h-24 w-full object-cover" />
            ) : (
              <div className="flex h-24 items-center justify-center text-label text-slate-400">{item.label}</div>
            )}
            <figcaption className="flex items-center justify-between px-2 py-1 text-label text-slate-500">
              <span>{item.label}</span>
              {captures[item.key] && (
                <button
                  type="button"
                  onClick={() => retake(item.key)}
                  className="inline-flex items-center gap-1 text-primary"
                >
                  <RefreshCcw className="h-3 w-3" />
                  Retake
                </button>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
