import PageHeader from '../components/common/PageHeader';
import Esp32CamFeed from '../components/monitoring/Esp32CamFeed';

export default function MonitoringPage() {
  return (
    <>
      <PageHeader
        breadcrumbSection="OPERATIONS"
        breadcrumbPage="LIVE MONITORING"
        title="Monitoring"
        description="Live ESP32-CAM stream, enroll faces from the camera, or open the OV3660 console. The camera must be on the same network."
      />
      <Esp32CamFeed />
    </>
  );
}
