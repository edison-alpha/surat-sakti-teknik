
import { useAuth } from '@/hooks/useAuth';
import MahasiswaDashboard from './dashboards/MahasiswaDashboard';
import TUDashboard from './dashboards/TUDashboard';
import DekanDashboard from './dashboards/DekanDashboard';

const Dashboard = () => {
  const { userRole, user } = useAuth();

  console.log('Dashboard - userRole:', userRole, 'user:', user);

  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading user role...</p>
        </div>
      </div>
    );
  }

  switch (userRole) {
    case 'mahasiswa':
      return <MahasiswaDashboard />;
    case 'tu':
      return <TUDashboard />;
    case 'dekan':
      return <DekanDashboard />;
    default:
      return (
        <div className="text-center text-red-600">
          <p>Role tidak dikenal: {userRole}</p>
          <p className="text-sm text-gray-500 mt-2">
            Silakan logout dan login kembali
          </p>
        </div>
      );
  }
};

export default Dashboard;
