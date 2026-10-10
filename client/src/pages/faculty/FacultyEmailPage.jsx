import { useMemo, useState } from 'react';
import { Mail } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useStudents } from '../../hooks/useStudents';
import { useSchedules } from '../../hooks/useSchedules';
import { useMyClasses } from '../../hooks/useMyClasses';
import { useStudentMessages } from '../../hooks/useStudentMessages';
import { buildMailto, sendStudentMessage } from '../../firebase/studentMessages';

export default function FacultyEmailPage() {
  const { search = '' } = useOutletContext() || {};
  const { profile, account } = useAuth();
  const { students, loading: studentsLoading, error: studentsError } = useStudents();
  const { schedules } = useSchedules();
  const { myStudents } = useMyClasses(schedules, students);
  const { messages, loading: messagesLoading, error: messagesError } = useStudentMessages();

  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);

  const query = search.trim().toLowerCase();
  const options = useMemo(() => {
    const list = myStudents.length ? myStudents : students;
    if (!query) return list;
    return list.filter((s) =>
      [s.name, s.idNumber, s.email, s.program].join(' ').toLowerCase().includes(query),
    );
  }, [myStudents, students, query]);

  const selected = options.find((s) => s.id === studentId) || myStudents.find((s) => s.id === studentId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);
    if (!selected) {
      setNotice({ type: 'error', text: 'Select a student to message.' });
      return;
    }
    if (!selected.email) {
      setNotice({ type: 'error', text: `${selected.name} has no e-mail on file.` });
      return;
    }
    if (!subject.trim() || !body.trim()) {
      setNotice({ type: 'error', text: 'Subject and message are required.' });
      return;
    }
    setSending(true);
    try {
      await sendStudentMessage({
        student: selected,
        subject,
        body,
        facultyId: account?.facultyId || profile?.id || '',
        facultyName: profile?.name || account?.name || '',
      });
      window.open(
        buildMailto({
          email: selected.email,
          subject,
          body,
        }),
        '_blank',
      );
      setSubject('');
      setBody('');
      setNotice({
        type: 'success',
        text: `Message to ${selected.name} was saved. Your e-mail app should open next.`,
      });
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Could not send the message.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader
        breadcrumbSection="FACULTY"
        breadcrumbPage="EMAIL"
        title="Email Student"
        description="Message a student about attendance, classwork, or another concern. A copy is saved here and your e-mail app opens with the student’s address."
      />

      {(studentsError || messagesError) && (
        <p className="mt-4 rounded-btn bg-red-50 px-3 py-2 text-body text-danger">
          {studentsError || messagesError}
        </p>
      )}
      {notice && (
        <p
          className={`mt-4 rounded-btn px-3 py-2 text-body ${
            notice.type === 'success' ? 'bg-success-bg text-success-text' : 'bg-red-50 text-danger'
          }`}
        >
          {notice.text}
        </p>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-card border border-border-light bg-white p-5 shadow-card"
        >
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-slate-900">Compose</h2>
          </div>
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label htmlFor="email-student" className="mb-1 block text-label font-semibold uppercase tracking-wide text-slate-500">
                Student
              </label>
              <select
                id="email-student"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={studentsLoading}
                className="w-full rounded-btn border border-input-border bg-white px-3 py-2 text-body text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">{studentsLoading ? 'Loading…' : 'Select student…'}</option>
                {options.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · ID {s.idNumber}
                    {s.email ? ` · ${s.email}` : ' · no email'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="email-subject" className="mb-1 block text-label font-semibold uppercase tracking-wide text-slate-500">
                Subject
              </label>
              <input
                id="email-subject"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Concern about attendance…"
                className="w-full rounded-btn border border-input-border px-3 py-2 text-body text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="email-body" className="mb-1 block text-label font-semibold uppercase tracking-wide text-slate-500">
                Message
              </label>
              <textarea
                id="email-body"
                required
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your concern for the student…"
                className="w-full rounded-btn border border-input-border px-3 py-2 text-body text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={sending}>
                <Mail className="h-4 w-4" />
                {sending ? 'Sending…' : 'Send message'}
              </Button>
            </div>
          </div>
        </form>

        <section className="rounded-card border border-border-light bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold text-slate-900">Sent messages</h2>
          {messagesLoading && <p className="mt-4 text-body text-slate-500">Loading…</p>}
          {!messagesLoading && messages.length === 0 && (
            <p className="mt-4 text-body text-slate-500">No messages sent yet.</p>
          )}
          {!messagesLoading && messages.length > 0 && (
            <ul className="mt-3 flex flex-col divide-y divide-border-light">
              {messages.slice(0, 12).map((m) => (
                <li key={m.id} className="py-3">
                  <p className="text-body font-semibold text-slate-900">{m.studentName}</p>
                  <p className="truncate text-secondary text-slate-600">{m.subject}</p>
                  <p className="mt-0.5 text-label text-slate-400">
                    {m.createdAt ? m.createdAt.toLocaleString() : 'just now'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
