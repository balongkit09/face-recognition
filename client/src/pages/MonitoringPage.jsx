// TODO: subscribe to `monitoringEvents` collection via onSnapshot for live camera/face-match feed.

import PageHeader from '../components/common/PageHeader';
import ComingSoonPlaceholder from '../components/common/ComingSoonPlaceholder';

export default function MonitoringPage() {
  return (
    <>
      <PageHeader
        breadcrumbSection="OPERATIONS"
        breadcrumbPage="LIVE MONITORING"
        title="Monitoring"
        description="Live camera feeds and face-match events from campus devices."
      />
      <ComingSoonPlaceholder />
    </>
  );
}
