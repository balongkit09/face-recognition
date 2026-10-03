import PageHeader from '../components/common/PageHeader';
import ComingSoonPlaceholder from '../components/common/ComingSoonPlaceholder';

export default function PlaybackPage() {
  return (
    <>
      <PageHeader
        breadcrumbSection="OPERATIONS"
        breadcrumbPage="PLAYBACK"
        title="Playback"
        description="Review recorded footage and historical monitoring events."
      />
      <ComingSoonPlaceholder />
    </>
  );
}
