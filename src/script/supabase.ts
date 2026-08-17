// Caleb's Library — Supabase client (client-safe: anon key only).
// Secret keys never belong in this bundle.

import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase: SupabaseClient = createClient(url, anonKey)

export const UPLOADS_BUCKET = 'uploads'

// Public storage URL for a file in the uploads bucket
export function storageUrl(path: string): string {
  return `${url}/storage/v1/object/public/${UPLOADS_BUCKET}/${path}`
}

export interface Submission {
  id: number
  title: string
  subject: string
  subject_name: string
  type: string
  course: string
  course_name: string
  description: string
  contributor_name: string
  contributor_email: string
  license: string
  file_name: string
  file_size: number
  mime_type: string
  storage_path: string
  drive_file_id: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewer_note: string | null
  created_at: string
  reviewed_at: string | null
}

// RPC wrappers (typed) — mirror the Postgres functions in supabase/schema.sql
export async function bumpMetric(
  paperId: string,
  kind: 'reads' | 'downloads' | 'upvotes',
  bases: { reads: number; downloads: number; upvotes: number },
): Promise<void> {
  await supabase.rpc('bump_metric', {
    p_paper_id: paperId,
    p_kind: kind,
    p_base_reads: bases.reads,
    p_base_downloads: bases.downloads,
    p_base_upvotes: bases.upvotes,
  })
}

export async function adminOk(passphrase: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('admin_ok', { p_passphrase: passphrase })
  if (error) return false
  return data === true
}

export async function getSubmissions(passphrase: string): Promise<Submission[]> {
  const { data, error } = await supabase.rpc('get_submissions', { p_passphrase: passphrase })
  if (error) throw error
  return (data || []) as Submission[]
}

export async function reviewSubmission(
  id: number,
  status: 'approved' | 'rejected',
  passphrase: string,
  note?: string,
  driveFileId?: string,
): Promise<void> {
  const { error } = await supabase.rpc('review_submission', {
    p_id: id,
    p_status: status,
    p_passphrase: passphrase,
    p_note: note ?? null,
    p_drive_file_id: driveFileId ?? null,
  })
  if (error) throw error
}

// Approved submissions are publicly readable — fetch for library merge
export async function fetchApproved(): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []) as Submission[]
}

export async function insertSubmission(row: {
  title: string
  subject: string
  subject_name: string
  type: string
  course: string
  course_name: string
  description: string
  contributor_name: string
  contributor_email: string
  license: string
  file_name: string
  file_size: number
  mime_type: string
  storage_path: string
}): Promise<void> {
  const { error } = await supabase.from('submissions').insert({ ...row, status: 'pending' })
  if (error) throw error
}
