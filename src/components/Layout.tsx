
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, FileText, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, userRole, signOut } = useAuth();

  const getRoleDisplay = (role: string | null) => {
    switch (role) {
      case 'mahasiswa':
        return 'Mahasiswa';
      case 'tu':
        return 'TU';
      case 'dekan':
        return 'Dekan';
      default:
        return role || 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Sistem Manajemen Surat
                </h1>
                <p className="text-sm text-gray-500">Fakultas Teknik</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Card className="py-1 px-3">
                <CardContent className="p-0">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{getRoleDisplay(userRole)}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
