import PageHeader from '../components/common/PageHeader';
import PasswordResetRequests from '../components/requests/PasswordResetRequests';
import FaceEnrollRequests from '../components/requests/FaceEnrollRequests';

export default function RequestsPage() {
  return (
    <>
      <PageHeader
        breadcrumbSection="SYSTEM"
        breadcrumbPage="REQUESTS"
        title="Faculty requests"
        description="Password-reset requests from the login page, and face-enrollment requests from faculty. Approving a face request marks that student for face recognition."
      />
      <div className="mt-4 flex flex-col gap-4">
        <FaceEnrollRequests />
        <PasswordResetRequests />
      </div>
    </>
  );
}
