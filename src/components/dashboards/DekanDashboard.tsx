
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye, Clock, Award } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DocumentSubmission {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  submitted_file_url: string;
  tu_review_notes: string;
  dekan_review_notes: string;
  document_templates: {
    name: string;
  };
  users: {
    full_name: string;
    username: string;
  };
}

const DekanDashboard = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<DocumentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<DocumentSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('document_submissions')
        .select(`
          *,
          document_templates (name),
          users!document_submissions_student_id_fkey (full_name, username)
        `)
        .in('status', ['approved_by_tu', 'reviewed_by_dekan'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengajuan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (submissionId: string, action: 'approve' | 'reject') => {
    if (!user) return;

    setReviewLoading(true);
    
    try {
      const status = action === 'approve' ? 'completed' : 'rejected_by_dekan';
      
      const { error } = await supabase
        .from('document_submissions')
        .update({
          status,
          dekan_review_notes: reviewNotes,
          dekan_reviewed_at: new Date().toISOString(),
          dekan_reviewed_by: user.id,
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Sukses",
        description: `Pengajuan berhasil ${action === 'approve' ? 'disetujui dan ditandatangani' : 'ditolak'}`,
      });

      setSelectedSubmission(null);
      setReviewNotes('');
      fetchSubmissions();

    } catch (error) {
      console.error('Error reviewing submission:', error);
      toast({
        title: "Error",
        description: "Gagal memproses review",
        variant: "destructive",
      });
    } finally {
      setReviewLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved_by_tu':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed_by_dekan':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved_by_tu':
        return 'Menunggu Persetujuan Dekan';
      case 'reviewed_by_dekan':
        return 'Sedang Direview Dekan';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Dekan</h2>
        <p className="text-gray-600">Review final dan penandatanganan surat</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengajuan</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Tanda Tangan</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions.filter(s => s.status === 'approved_by_tu').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sedang Direview</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions.filter(s => s.status === 'reviewed_by_dekan').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Daftar Pengajuan</h3>
        {submissions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Tidak ada pengajuan surat untuk ditinjau</p>
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
                        {submission.document_templates?.name} • 
                        Mahasiswa: {submission.users?.full_name} ({submission.users?.username}) • 
                        {new Date(submission.created_at).toLocaleDateString('id-ID')}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(submission.status)}>
                      {getStatusText(submission.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {submission.description && (
                      <div>
                        <p className="text-sm font-medium">Deskripsi:</p>
                        <p className="text-gray-600 text-sm">{submission.description}</p>
                      </div>
                    )}
                    
                    {submission.tu_review_notes && (
                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-green-800">Catatan dari TU:</p>
                        <p className="text-sm text-green-700">{submission.tu_review_notes}</p>
                      </div>
                    )}

                    {submission.dekan_review_notes && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-blue-800">Catatan Dekan:</p>
                        <p className="text-sm text-blue-700">{submission.dekan_review_notes}</p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setReviewNotes(submission.dekan_review_notes || '');
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review & Tandatangani
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review Final & Penandatanganan</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Template:</p>
              <p className="text-sm text-gray-600">{selectedSubmission?.document_templates?.name}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Mahasiswa:</p>
              <p className="text-sm text-gray-600">
                {selectedSubmission?.users?.full_name} ({selectedSubmission?.users?.username})
              </p>
            </div>

            {selectedSubmission?.description && (
              <div>
                <p className="text-sm font-medium">Deskripsi:</p>
                <p className="text-sm text-gray-600">{selectedSubmission.description}</p>
              </div>
            )}

            {selectedSubmission?.tu_review_notes && (
              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-sm font-medium text-green-800">Catatan dari TU:</p>
                <p className="text-sm text-green-700">{selectedSubmission.tu_review_notes}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Catatan Dekan:</label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Tambahkan catatan dekan..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedSubmission(null)}
                disabled={reviewLoading}
              >
                Batal
              </Button>
              <Button 
                variant="destructive"
                onClick={() => selectedSubmission && handleReview(selectedSubmission.id, 'reject')}
                disabled={reviewLoading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Tolak
              </Button>
              <Button 
                onClick={() => selectedSubmission && handleReview(selectedSubmission.id, 'approve')}
                disabled={reviewLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Award className="h-4 w-4 mr-2" />
                Setujui & Tandatangani
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DekanDashboard;
