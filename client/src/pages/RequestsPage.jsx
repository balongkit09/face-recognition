import PageHeader from '../components/common/PageHeader';
import PasswordResetRequests from '../components/requests/PasswordResetRequests';

export default function RequestsPage() {
  return (
    <>
      <PageHeader
        breadcrumbSection="SYSTEM"
        breadcrumbPage="REQUESTS"
        title="Faculty requests"
        description="Password-reset requests submitted from the login page. Approving updates the faculty portal password they confirmed."
      />
      <div className="mt-4">
        <PasswordResetRequests />
      </div>
    </>
  );
}
