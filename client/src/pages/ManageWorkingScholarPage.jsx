import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import BoxedPlusButton from '../components/common/BoxedPlusButton';
import WorkingScholarTable from '../components/scholars/WorkingScholarTable';
import WorkingScholarFormModal from '../components/scholars/WorkingScholarFormModal';
import EnrollFaceModal from '../components/students/EnrollFaceModal';
import { useConfirm } from '../components/common/ConfirmDialog';
import { DESIGNATIONS, useWorkingScholars } from '../hooks/useWorkingScholars';
import { enrollScholarFace } from '../firebase/faceEnrollRequests';

export default function ManageWorkingScholarPage() {
  const { search = '' } = useOutletContext() || {};
  const { scholars, loading, error, addScholar, updateScholar, deleteScholar } = useWorkingScholars();
  const { confirm, dialog } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [faceOpen, setFaceOpen] = useState(false);
  const [faceScholar, setFaceScholar] = useState(null);
  const [faceNotice, setFaceNotice] = useState(null);
  const [designationFilter, setDesignationFilter] = useState('');

  const eligibleFaces = useMemo(
    () => scholars.filter((s) => !s.faceEnrolled).map((s) => ({ ...s, kind: 'scholar' })),
    [scholars],
  );

  const query = search.trim().toLowerCase();
  const rows = useMemo(
    () =>
      scholars.filter((s) => {
        if (designationFilter && s.designation !== designationFilter) return false;
        if (!query) return true;
        return [s.name, s.firstName, s.lastName, s.idNumber, s.email, s.designation]
          .join(' ')
          .toLowerCase()
          .includes(query);
      }),
    [scholars, query, designationFilter],
  );

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (scholar) => {
    setEditing(scholar);
    setModalOpen(true);
  };

  const handleDelete = (scholar) =>
    confirm({
      title: 'Delete working scholar',
      message: (
        <>
          Delete <strong>{scholar.name}</strong> (ID {scholar.idNumber})? This cannot be undone.
        </>
      ),
      confirmLabel: 'Delete',
      onConfirm: () => deleteScholar(scholar.id),
    });

  const handleSubmit = async (form) => {
    if (editing) await updateScholar(editing.id, form);
    else await addScholar(form);
  };

  return (
    <>
      <PageHeader
        breadcrumbSection="STAFF"
        breadcrumbPage="WORKING SCHOLARS"
        title="Manage Working Scholar"
        description="Add office and laboratory scholars. Records are saved to the Firebase workingScholar collection."
        actions={
          <>
            <BoxedPlusButton
              label="Enroll Face"
              onClick={() => {
                setFaceScholar(null);
                setFaceOpen(true);
              }}
            />
            <BoxedPlusButton label="Add Working Scholar" onClick={openAdd} />
          </>
        }
      />

      {error && <p className="mt-4 rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>}
      {faceNotice && (
        <p
          className={`mt-4 rounded-btn px-3 py-2 text-body ${
            faceNotice.type === 'success' ? 'bg-success-bg text-success-text' : 'bg-red-50 text-danger'
          }`}
        >
          {faceNotice.text}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDesignationFilter('')}
          className={`rounded-full px-3 py-1.5 text-body font-medium transition-colors ${
            !designationFilter
              ? 'bg-primary text-white shadow-card'
              : 'border border-border bg-white text-slate-600 hover:bg-[#f8fafc]'
          }`}
        >
          All{scholars.length ? ` · ${scholars.length}` : ''}
        </button>
        {DESIGNATIONS.map((opt) => {
          const count = scholars.filter((s) => s.designation === opt.value).length;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDesignationFilter(opt.value)}
              className={`rounded-full px-3 py-1.5 text-body font-medium transition-colors ${
                designationFilter === opt.value
                  ? 'bg-primary text-white shadow-card'
                  : 'border border-border bg-white text-slate-600 hover:bg-[#f8fafc]'
              }`}
            >
              {opt.label}
              {count ? ` · ${count}` : ''}
            </button>
          );
        })}
      </div>

      <WorkingScholarTable
        scholars={rows}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
        onEnrollFace={(scholar) => {
          if (scholar.faceEnrolled) {
            setFaceNotice({ type: 'error', text: `${scholar.name} is already enrolled for face recognition.` });
            return;
          }
          setFaceScholar({ ...scholar, kind: 'scholar' });
          setFaceOpen(true);
        }}
      />

      <WorkingScholarFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editing}
        mode={editing ? 'edit' : 'add'}
      />

      <EnrollFaceModal
        open={faceOpen}
        onClose={() => {
          setFaceOpen(false);
          setFaceScholar(null);
        }}
        scholars={eligibleFaces}
        initialPerson={faceScholar}
        defaultKind="scholar"
        mode="enroll"
        onSubmit={async ({ scholar, captures }) => {
          if (scholar.faceEnrolled) {
            throw new Error(`${scholar.name} is already enrolled for face recognition.`);
          }
          await enrollScholarFace({ scholar, captures });
          setFaceNotice({ type: 'success', text: `${scholar.name}'s face is now enrolled.` });
        }}
      />

      {dialog}
    </>
  );
}
