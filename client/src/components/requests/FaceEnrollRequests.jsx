import { useState } from 'react';
import { ScanFace } from 'lucide-react';
import Button from '../common/Button';
import { useConfirm } from '../common/ConfirmDialog';
import { approveFaceEnroll, rejectFaceEnroll } from '../../firebase/faceEnrollRequests';
import { useFaceEnrollRequests } from '../../hooks/useFaceEnrollRequests';

export default function FaceEnrollRequests() {
  const { requests, loading, error } = useFaceEnrollRequests({ pendingOnly: true });
  const { confirm, dialog } = useConfirm();
  const [notice, setNotice] = useState(null);

  const handleApprove = (request) =>
    confirm({
      title: 'Approve face enrollment',
      message: (
        <>
          Approve the request to enroll the face of <strong>{request.studentName}</strong> (ID{' '}
          {request.idNumber})?
        </>
      ),
      confirmLabel: 'Approve',
      danger: false,
      onConfirm: async () => {
        await approveFaceEnroll(request);
        setNotice({ type: 'success', text: `Face enroll approved for ${request.studentName}.` });
      },
    });

  const handleReject = (request) =>
    confirm({
      title: 'Reject face enrollment',
      message: (
        <>
          Reject the face-enroll request for <strong>{request.studentName}</strong>? The student stays
          without a registered face.
        </>
      ),
      confirmLabel: 'Reject',
      onConfirm: async () => {
        await rejectFaceEnroll(request);
        setNotice({ type: 'success', text: `Request for ${request.studentName} was rejected.` });
      },
    });

  return (
    <section className="rounded-card border border-border-light bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <ScanFace className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-slate-900">Face enrollment requests</h2>
        {requests.length > 0 && (
          <span className="rounded-full bg-info-bg px-2 py-0.5 text-label font-semibold text-info-text">
            {requests.length} pending
          </span>
        )}
      </div>
      <p className="mt-1 text-secondary text-slate-500">
        Faculty asked to enroll a student’s face. Approving marks the student as face-enrolled.
      </p>
      {error && <p className="mt-3 rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>}
      {notice && (
        <p
          className={`mt-3 rounded-btn px-3 py-2 text-body ${
            notice.type === 'success' ? 'bg-success-bg text-success-text' : 'bg-red-50 text-danger'
          }`}
        >
          {notice.text}
        </p>
      )}
      {loading && <p className="mt-4 text-body text-slate-500">Loading requests…</p>}
      {!loading && requests.length === 0 && (
        <p className="mt-4 rounded-card border border-border-light bg-[#f8fafc] py-8 text-center text-body text-slate-500">
          No pending face enrollment requests.
        </p>
      )}
      {!loading && requests.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {requests.map((request) => (
            <li
              key={request.id}
              className="flex flex-col gap-3 rounded-card border border-border-light bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-body font-semibold text-slate-900">
                  {request.studentName} · ID {request.idNumber}
                </p>
                <p className="text-secondary text-slate-500">
                  {request.program || '—'}
                  {request.edpCode ? ` · EDP ${request.edpCode}` : ''}
                  {request.email ? ` · ${request.email}` : ''}
                </p>
                <p className="mt-1 text-label font-semibold uppercase tracking-wide text-amber-700">
                  Face enroll · requested by {request.facultyName || 'Faculty'}
                </p>
                {request.note && <p className="mt-1 text-secondary text-slate-600">{request.note}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" onClick={() => handleReject(request)}>
                  Reject
                </Button>
                <Button onClick={() => handleApprove(request)}>Approve</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {dialog}
    </section>
  );
}
