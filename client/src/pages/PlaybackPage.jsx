import { useEffect, useMemo, useRef, useState } from 'react';
import { FolderOpen, HardDrive, RefreshCcw, Trash2, Upload } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import RecordingPlayer from '../components/playback/RecordingPlayer';
import { cameraHostLabel, fetchSdRecording, isMediaFileName, listSdRecordings, recordingKind } from '../utils/esp32Cam';
import {
  deleteDownloadedRecording,
  formatBytes,
  listDownloadedRecordings,
  saveDownloadedRecording,
} from '../utils/playbackStore';

const ACCEPT = 'video/*,image/*,.avi,.mp4,.webm,.mjpeg,.mjpg,.mov,.jpg,.jpeg,.png';

export default function PlaybackPage() {
  const fileRef = useRef(null);
  const [tab, setTab] = useState('downloaded');
  const [sdFiles, setSdFiles] = useState([]);
  const [downloaded, setDownloaded] = useState([]);
  const [selected, setSelected] = useState(null);
  const [objectUrl, setObjectUrl] = useState('');
  const [loadingSd, setLoadingSd] = useState(false);
  const [notice, setNotice] = useState(null);
  const host = useMemo(() => cameraHostLabel(), []);

  const refreshDownloaded = async () => {
    const rows = await listDownloadedRecordings();
    setDownloaded(rows);
    return rows;
  };

  const loadSd = async () => {
    setLoadingSd(true);
    setNotice(null);
    try {
      const files = await listSdRecordings();
      setSdFiles(files);
      if (!files.length) {
        setNotice({
          type: 'info',
          text: `No media files were listed on ${host}. If the camera is online, import files you copied from the SD card instead.`,
        });
      }
    } catch (err) {
      setSdFiles([]);
      setNotice({
        type: 'error',
        text: `Could not read the SD card on ${host}. Import downloaded recordings, or keep the ESP32-CAM on the same network.`,
      });
    } finally {
      setLoadingSd(false);
    }
  };

  useEffect(() => {
    refreshDownloaded().catch(() => {});
    loadSd();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playRecording = async (item) => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl('');
    setSelected(item);
    if (item.blob) {
      setObjectUrl(URL.createObjectURL(item.blob));
      return;
    }
    if (item.source === 'sd') {
      try {
        const blob = await fetchSdRecording(item.path || item.name);
        setObjectUrl(URL.createObjectURL(blob));
      } catch {
        setObjectUrl(item.url || '');
      }
    }
  };

  const importFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter(
      (file) => isMediaFileName(file.name) || file.type.startsWith('image/') || file.type.startsWith('video/'),
    );
    if (!files.length) {
      setNotice({ type: 'error', text: 'Choose photo or video files copied from the SD card.' });
      return;
    }
    let last = null;
    for (const file of files) {
      last = await saveDownloadedRecording({ name: file.name, blob: file, source: 'sd-download' });
    }
    const rows = await refreshDownloaded();
    setTab('downloaded');
    setNotice({
      type: 'success',
      text: `Saved ${files.length} recording${files.length === 1 ? '' : 's'} from the SD card.`,
    });
    const next = rows.find((r) => r.id === last?.id) || rows[0];
    if (next) playRecording(next);
  };

  const downloadSelected = async () => {
    if (!selected) return;
    let blob = selected.blob;
    if (!blob && selected.source === 'sd') {
      blob = await fetchSdRecording(selected.path || selected.name);
      await saveDownloadedRecording({ name: selected.name, blob, source: 'sd-download' });
      await refreshDownloaded();
      setNotice({ type: 'success', text: `${selected.name} was saved to Playback.` });
    }
    if (!blob) return;
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = selected.name;
    link.click();
    URL.revokeObjectURL(href);
  };

  const saveSdToLibrary = async (item) => {
    const blob = await fetchSdRecording(item.path || item.name);
    const saved = await saveDownloadedRecording({ name: item.name, blob, source: 'sd-download' });
    const rows = await refreshDownloaded();
    setTab('downloaded');
    setNotice({ type: 'success', text: `${item.name} was downloaded from the SD card.` });
    const next = rows.find((r) => r.id === saved.id);
    if (next) playRecording(next);
  };

  const removeDownloaded = async (item) => {
    await deleteDownloadedRecording(item.id);
    const rows = await refreshDownloaded();
    if (selected?.id === item.id) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setObjectUrl('');
      setSelected(rows[0] || null);
      if (rows[0]?.blob) setObjectUrl(URL.createObjectURL(rows[0].blob));
    }
  };

  const visible = tab === 'sd' ? sdFiles : downloaded;

  return (
    <>
      <PageHeader
        breadcrumbSection="OPERATIONS"
        breadcrumbPage="PLAYBACK"
        title="Playback"
        description="Watch recordings saved on the ESP32-CAM SD card, or import clips you already downloaded from the card."
        actions={
          <>
            <Button variant="outline" onClick={loadSd} disabled={loadingSd}>
              <RefreshCcw className="h-4 w-4" />
              {loadingSd ? 'Reading SD…' : 'Refresh SD card'}
            </Button>
            <Button onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Import from SD card
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              multiple
              hidden
              onChange={(e) => {
                importFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </>
        }
      />

      {notice && (
        <p
          className={`mt-4 rounded-btn px-3 py-2 text-body ${
            notice.type === 'success'
              ? 'bg-success-bg text-success-text'
              : notice.type === 'error'
                ? 'bg-red-50 text-danger'
                : 'bg-info-bg text-info-text'
          }`}
        >
          {notice.text}
        </p>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <RecordingPlayer
          recording={selected}
          objectUrl={objectUrl}
          onDownload={selected ? downloadSelected : undefined}
        />

        <section className="rounded-card border border-border-light bg-white p-4 shadow-card">
          <div className="flex rounded-btn border border-border bg-[#f8fafc] p-0.5">
            <button
              type="button"
              onClick={() => setTab('downloaded')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-body font-medium ${
                tab === 'downloaded' ? 'bg-white text-slate-900 shadow-card' : 'text-slate-500'
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              Downloaded · {downloaded.length}
            </button>
            <button
              type="button"
              onClick={() => setTab('sd')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-body font-medium ${
                tab === 'sd' ? 'bg-white text-slate-900 shadow-card' : 'text-slate-500'
              }`}
            >
              <HardDrive className="h-4 w-4" />
              SD card · {sdFiles.length}
            </button>
          </div>

          <p className="mt-3 text-secondary text-slate-500">
            {tab === 'sd'
              ? `Files on the camera SD card at ${host}.`
              : 'Clips imported or downloaded from the SD card stay here for playback.'}
          </p>

          <ul className="mt-3 max-h-[60vh] divide-y divide-border-light overflow-auto">
            {tab === 'sd' && loadingSd && (
              <li className="py-8 text-center text-body text-slate-500">Reading SD card…</li>
            )}
            {!loadingSd && visible.length === 0 && (
              <li className="py-8 text-center text-body text-slate-500">
                {tab === 'sd'
                  ? 'No SD-card recordings listed. Import downloaded files to watch them here.'
                  : 'No downloaded recordings yet. Import photos or videos copied from the SD card.'}
              </li>
            )}
            {visible.map((item) => {
              const active = selected?.id === item.id;
              return (
                <li key={item.id}>
                  <div
                    className={`flex items-start gap-2 py-3 ${active ? 'rounded-btn bg-[#f8fafc] px-2' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => playRecording(item)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-body font-semibold text-slate-900">{item.name}</p>
                      <p className="text-label text-slate-500">
                        {recordingKind(item.name, item.type) === 'image' ? 'Photo' : 'Video'}
                        {item.size ? ` · ${formatBytes(item.size)}` : ''}
                      </p>
                    </button>
                    {tab === 'sd' ? (
                      <button
                        type="button"
                        onClick={() => saveSdToLibrary(item)}
                        className="shrink-0 text-label font-semibold text-primary"
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeDownloaded(item)}
                        className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-[#f8fafc] hover:text-danger"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
