import { useState } from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import FacultyTable from '../components/faculty/FacultyTable';
import FacultyFormModal from '../components/faculty/FacultyFormModal';
import ImportExportButtons from '../components/faculty/ImportExportButtons';
import { useConfirm } from '../components/common/ConfirmDialog';
import { useFaculty } from '../hooks/useFaculty';

export default function ManageFacultyPage() {
  const { faculty, loading, error, addFaculty, updateFaculty, deleteFaculty, createLogin } =
    useFaculty();
  const { confirm, dialog } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null); // { type, text }

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (member) => {
    setEditing(member);
    setModalOpen(true);
  };

  const handleDelete = (member) =>
    confirm({
      title: 'Delete faculty',
      message: (
        <>
          Delete <strong>{member.name}</strong> (ID {member.idNumber})? Their faculty portal login will be
          revoked. This cannot be undone.
        </>
      ),
      confirmLabel: 'Delete',
      onConfirm: () => deleteFaculty(member.id),
    });

  const handleCreateLogin = async (member) => {
    setNotice(null);
    try {
      const account = await createLogin(member.id);
      setNotice({
        type: 'success',
        text: `Login created for ${member.name}: username ${account.username}, password ${account.password}`,
      });
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Could not create login' });
    }
  };

  const handleSubmit = async (form) => {
    setNotice(null);
    if (editing) {
      await updateFaculty(editing.id, form);
    } else {
      await addFaculty(form);
    }
  };

  return (
    <>
      <PageHeader
        breadcrumbSection="ACADEMICS"
        breadcrumbPage="FACULTY DIRECTORY"
        title="Faculty Directory"
        description="Add, update, and remove faculty. Each faculty record gets a portal login: username = ID number, password = UCMN-<ID number>."
        actions={
          <>
            <ImportExportButtons faculty={faculty} addFaculty={addFaculty} />
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add Faculty
            </Button>
          </>
        }
      />

      {error && (
        <p className="mt-4 rounded-btn bg-red-50 px-3 py-2 text-body text-danger">{error}</p>
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

      <FacultyTable
        faculty={faculty}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
        onCreateLogin={handleCreateLogin}
      />

      <FacultyFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editing}
        mode={editing ? 'edit' : 'add'}
      />

      {dialog}
    </>
  );
}
