
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, Plus, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import CreateSubmissionDialog from './CreateSubmissionDialog';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  file_url: string;
}

interface DocumentSubmission {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  template_id: string;
  document_templates: {
    name: string;
  };
}

const MahasiswaDashboard = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [submissions, setSubmissions] = useState<DocumentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch templates
      const { data: templatesData } = await supabase
        .from('document_templates')
        .select('*');
      
      setTemplates(templatesData || []);

      // Fetch submissions
      const { data: submissionsData } = await supabase
        .from('document_submissions')
        .select(`
          *,
          document_templates (name)
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });
      
      setSubmissions(submissionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed_by_tu':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved_by_tu':
        return 'bg-green-100 text-green-800';
      case 'rejected_by_tu':
        return 'bg-red-100 text-red-800';
      case 'reviewed_by_dekan':
        return 'bg-purple-100 text-purple-800';
      case 'approved_by_dekan':
        return 'bg-green-100 text-green-800';
      case 'rejected_by_dekan':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Diajukan';
      case 'reviewed_by_tu':
        return 'Direview TU';
      case 'approved_by_tu':
        return 'Disetujui TU';
      case 'rejected_by_tu':
        return 'Ditolak TU';
      case 'reviewed_by_dekan':
        return 'Direview Dekan';
      case 'approved_by_dekan':
        return 'Disetujui Dekan';
      case 'rejected_by_dekan':
        return 'Ditolak Dekan';
      case 'completed':
        return 'Selesai';
      default:
        return status;
    }
  };

  const getProgressSteps = (status: string) => {
    const steps = [
      { key: 'submitted', label: 'Diajukan', completed: true },
      { key: 'tu_review', label: 'Review TU', completed: false },
      { key: 'dekan_review', label: 'Review Dekan', completed: false },
      { key: 'completed', label: 'Selesai', completed: false }
    ];

    switch (status) {
      case 'submitted':
        steps[0].completed = true;
        break;
      case 'reviewed_by_tu':
      case 'approved_by_tu':
        steps[0].completed = true;
        steps[1].completed = true;
        break;
      case 'reviewed_by_dekan':
      case 'approved_by_dekan':
        steps[0].completed = true;
        steps[1].completed = true;
        steps[2].completed = true;
        break;
      case 'completed':
        steps.forEach(step => step.completed = true);
        break;
    }

    return steps;
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Mahasiswa</h2>
          <p className="text-gray-600">Kelola pengajuan surat Anda</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Ajukan Surat Baru
        </Button>
      </div>

      {/* Templates Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submissions Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Pengajuan Surat Saya</h3>
        {submissions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada pengajuan surat</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{submission.title}</CardTitle>
                      <CardDescription>
                        {submission.document_templates?.name} • {new Date(submission.created_at).toLocaleDateString('id-ID')}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(submission.status)}>
                      {getStatusText(submission.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Steps */}
                    <div className="flex items-center space-x-4">
                      {getProgressSteps(submission.status).map((step, index) => (
                        <div key={step.key} className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {step.completed ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                          </div>
                          <span className={`ml-2 text-sm ${step.completed ? 'text-green-600' : 'text-gray-500'}`}>
                            {step.label}
                          </span>
                          {index < getProgressSteps(submission.status).length - 1 && (
                            <div className={`w-8 h-0.5 ml-4 ${
                              step.completed ? 'bg-green-500' : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Description */}
                    {submission.description && (
                      <p className="text-gray-600 text-sm">{submission.description}</p>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {submission.status === 'completed' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Download className="h-4 w-4 mr-2" />
                          Download Surat
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateSubmissionDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        templates={templates}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default MahasiswaDashboard;
