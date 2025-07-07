
-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('mahasiswa', 'tu', 'dekan');

-- Create enum for document status
CREATE TYPE public.document_status AS ENUM ('submitted', 'reviewed_by_tu', 'approved_by_tu', 'rejected_by_tu', 'reviewed_by_dekan', 'approved_by_dekan', 'rejected_by_dekan', 'completed');

-- Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_templates table
CREATE TABLE public.document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_submissions table
CREATE TABLE public.document_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.users(id) NOT NULL,
    template_id UUID REFERENCES public.document_templates(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    submitted_file_url TEXT NOT NULL,
    approved_file_url TEXT,
    status document_status DEFAULT 'submitted',
    tu_review_notes TEXT,
    tu_reviewed_at TIMESTAMP WITH TIME ZONE,
    tu_reviewed_by UUID REFERENCES public.users(id),
    dekan_review_notes TEXT,
    dekan_reviewed_at TIMESTAMP WITH TIME ZONE,
    dekan_reviewed_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "TU and Dekan can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('tu', 'dekan')
        )
    );

-- RLS Policies for document_templates
CREATE POLICY "Anyone can view templates" ON public.document_templates
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "TU and Dekan can manage templates" ON public.document_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('tu', 'dekan')
        )
    );

-- RLS Policies for document_submissions
CREATE POLICY "Students can view their own submissions" ON public.document_submissions
    FOR SELECT USING (
        student_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('tu', 'dekan')
        )
    );

CREATE POLICY "Students can create submissions" ON public.document_submissions
    FOR INSERT WITH CHECK (student_id::text = auth.uid()::text);

CREATE POLICY "Students can update their own submissions" ON public.document_submissions
    FOR UPDATE USING (
        student_id::text = auth.uid()::text AND status = 'submitted'
    );

CREATE POLICY "TU can update submissions for review" ON public.document_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text 
            AND role = 'tu'
        )
    );

CREATE POLICY "Dekan can update submissions for final approval" ON public.document_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text 
            AND role = 'dekan'
        )
    );

-- Insert default users
INSERT INTO public.users (id, username, password_hash, role, full_name, email) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '20533324', '$2b$10$K7L/8Y2FXVS9N3.DoMuN8ube4AmhSdWSDORoYPS2BaMtgCHs4YKGS', 'mahasiswa', 'Mahasiswa Test', 'mahasiswa@test.com'),
    ('550e8400-e29b-41d4-a716-446655440002', '205098767', '$2b$10$K7L/8Y2FXVS9N3.DoMuN8ube4AmhSdWSDORoYPS2BaMtgCHs4YKGS', 'tu', 'TU Fakultas Teknik', 'tu@teknik.ac.id'),
    ('550e8400-e29b-41d4-a716-446655440003', '20568965', '$2b$10$K7L/8Y2FXVS9N3.DoMuN8ube4AmhSdWSDORoYPS2BaMtgCHs4YKGS', 'dekan', 'Dekan Fakultas Teknik', 'dekan@teknik.ac.id');

-- Insert sample document templates
INSERT INTO public.document_templates (name, description, file_url) VALUES
    ('Surat Keterangan Mahasiswa Aktif', 'Template surat keterangan untuk mahasiswa aktif', '/templates/surat-keterangan-aktif.pdf'),
    ('Surat Pengantar Magang', 'Template surat pengantar untuk kegiatan magang', '/templates/surat-pengantar-magang.pdf'),
    ('Surat Rekomendasi Beasiswa', 'Template surat rekomendasi untuk pengajuan beasiswa', '/templates/surat-rekomendasi-beasiswa.pdf');

-- Create storage bucket for document files
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

-- Storage policies
CREATE POLICY "Users can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Users can view documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Users can update their documents" ON storage.objects
    FOR UPDATE USING (bucket_id = 'documents');
