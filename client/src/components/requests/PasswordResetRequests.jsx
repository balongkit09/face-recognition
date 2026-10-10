import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import Button from '../common/Button';
import { useConfirm } from '../common/ConfirmDialog';
import { approvePasswordReset, rejectPasswordReset } from '../../firebase/passwordResets';
import { useFaculty } from '../../hooks/useFaculty';
import { usePasswordResets } from '../../hooks/usePasswordResets';

export default function PasswordResetRequests({ embedded = false }) {
  const { requests, loading, error } = usePasswordResets();
  const { faculty } = useFaculty();
  const { confirm, dialog } = useConfirm();
  const [notice, setNotice] = useState(null);

  const findMember = (username) =>
    faculty.find((f) => String(f.idNumber || '').trim() === String(username || '').trim());

  const handleApprove = (request) => {
    const member = findMember(request.username);
    confirm({
      title: 'Approve password reset',
      message: (
        <>
          Update the portal password for <strong>{member?.name || `ID ${request.username}`}</strong>
          {request.email ? ` (${request.email})` : ''}? They will sign in with the password they submitted.
        </>
      ),
      confirmLabel: 'Approve',
      danger: false,
      onConfirm: async () => {
        await approvePasswordReset(request, member);
        setNotice({ type: 'success', text: `Password updated for ${member?.name || request.username}.` });
      },
    });
  };

  const handleReject = (request) =>
    confirm({
      title: 'Reject password reset',
      message: (
        <>
          Reject the reset request for ID <strong>{request.username}</strong>? The current password stays unchanged.
        </>
      ),
      confirmLabel: 'Reject',
      onConfirm: async () => {
        await rejectPasswordReset(request);
        setNotice({ type: 'success', text: `Request for ID ${request.username} was rejected.` });
      },
    });

  return (
    <section className={embedded ? '' : 'rounded-card border border-border-light bg-white p-5 shadow-card'}>
      {embedded && (
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-slate-900">Forgot-password requests</h2>
          {requests.length > 0 && (
            <span className="rounded-full bg-info-bg px-2 py-0.5 text-label font-semibold text-info-text">
              {requests.length} pending
            </span>
          )}
        </div>
      )}
      {error && <p className="mt-3 rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>}
      {notice && (
        <p
          className={`${embedded ? 'mt-3' : 'mb-3'} rounded-btn px-3 py-2 text-body ${
            notice.type === 'success' ? 'bg-success-bg text-success-text' : 'bg-red-50 text-danger'
          }`}
        >
          {notice.text}
        </p>
      )}
      {loading && <p className="mt-4 text-body text-slate-500">Loading requests…</p>}
      {!loading && requests.length === 0 && (
        <p className="mt-4 rounded-card border border-border-light bg-white py-10 text-center text-body text-slate-500 shadow-card">
          No pending password-reset requests.
        </p>
      )}
      {!loading && requests.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {requests.map((request) => {
            const member = findMember(request.username);
            return (
              <li
                key={request.id}
                className="flex flex-col gap-3 rounded-card border border-border-light bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-body font-semibold text-slate-900">
                    {member?.name || 'Unknown faculty'} · ID {request.username}
                  </p>
                  <p className="text-secondary text-slate-500">{request.email || 'No e-mail provided'}</p>
                  <p className="mt-1 text-label font-semibold uppercase tracking-wide text-amber-700">
                    Password reset
                  </p>
                  {!member && (
                    <p className="text-secondary text-danger">No faculty record matches this ID number.</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" onClick={() => handleReject(request)}>
                    Reject
                  </Button>
                  <Button onClick={() => handleApprove(request)} disabled={!member}>
                    Approve
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {dialog}
    </section>
  );
}
