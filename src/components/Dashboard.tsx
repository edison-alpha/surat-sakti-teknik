
import { useAuth } from '@/hooks/useAuth';
import MahasiswaDashboard from './dashboards/MahasiswaDashboard';
import TUDashboard from './dashboards/TUDashboard';
import DekanDashboard from './dashboards/DekanDashboard';

const Dashboard = () => {
  const { userRole } = useAuth();

  switch (userRole) {
    case 'mahasiswa':
      return <MahasiswaDashboard />;
    case 'tu':
      return <TUDashboard />;
    case 'dekan':
      return <DekanDashboard />;
    default:
      return <div>Loading...</div>;
  }
};

export default Dashboard;
