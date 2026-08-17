-- Caleb's Library — Supabase schema
-- submissions: moderation queue for community uploads
-- metrics: real reads/downloads/upvotes per paper (Drive files + approved uploads)
-- admin_config: shared moderation passphrase (rotates each semester)

-- submissions -----------------------------------------------------------
create table if not exists public.submissions (
  id bigint primary key generated always as identity,
  title text not null,
  subject text not null,              -- subject slug id (matches Paper.subject)
  subject_name text not null,
  type text not null,
  course text not null default '',
  course_name text not null default '',
  description text not null default '',
  contributor_name text not null,
  contributor_email text not null,
  license text not null default 'cc-by-nc',
  file_name text not null,
  file_size bigint not null default 0,
  mime_type text not null default '',
  storage_path text not null,         -- uploads/<uuid>-<name> in Storage (staging)
  drive_file_id text,                 -- Google Drive file ID after manual transfer
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewer_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (storage_path)
);

create index if not exists submissions_status_idx on public.submissions (status);
create index if not exists submissions_created_idx on public.submissions (created_at desc);

alter table public.submissions enable row level security;

-- anyone may submit a new item
create policy "anon insert submissions" on public.submissions
  for insert to anon with check (true);

-- only approved items are readable publicly (library listing)
create policy "anon select approved submissions" on public.submissions
  for select to anon using (status = 'approved');

-- metrics ---------------------------------------------------------------
create table if not exists public.metrics (
  paper_id text primary key,          -- Drive file id, or sub-<id> for uploads
  reads bigint not null default 0,
  downloads bigint not null default 0,
  upvotes bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.metrics enable row level security;

create policy "anon select metrics" on public.metrics
  for select to anon using (true);

-- admin config ----------------------------------------------------------
create table if not exists public.admin_config (
  key text primary key,
  value text not null
);

alter table public.admin_config enable row level security;
-- no anon policies: only security definer functions may read it

-- Default moderation passphrase. Change it:
--   update public.admin_config set value = 'new-passphrase' where key = 'passphrase';
insert into public.admin_config (key, value)
values ('passphrase', 'calebs-library-2026')
on conflict (key) do nothing;

-- RPCs -------------------------------------------------------------------

-- Increment a metric. Base values seed the row on first write so Drive
-- papers keep their derived baseline and every bump after that is real.
create or replace function public.bump_metric(
  p_paper_id text,
  p_kind text,
  p_base_reads bigint default 0,
  p_base_downloads bigint default 0,
  p_base_upvotes bigint default 0
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_kind not in ('reads', 'downloads', 'upvotes') then
    raise exception 'invalid metric kind';
  end if;
  insert into public.metrics (paper_id, reads, downloads, upvotes)
  values (p_paper_id, p_base_reads, p_base_downloads, p_base_upvotes)
  on conflict (paper_id) do nothing;
  update public.metrics set
    reads = reads + case when p_kind = 'reads' then 1 else 0 end,
    downloads = downloads + case when p_kind = 'downloads' then 1 else 0 end,
    upvotes = upvotes + case when p_kind = 'upvotes' then 1 else 0 end,
    updated_at = now()
  where paper_id = p_paper_id;
end;
$$;

-- Passphrase check for the moderation gate.
create or replace function public.admin_ok(p_passphrase text) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v text;
begin
  select value into v from public.admin_config where key = 'passphrase';
  return v is not null and p_passphrase = v;
end;
$$;

-- Full queue for moderators (all statuses). Passphrase-gated.
create or replace function public.get_submissions(p_passphrase text)
returns table (
  id bigint, title text, subject text, subject_name text, type text,
  course text, course_name text, description text,
  contributor_name text, contributor_email text, license text,
  file_name text, file_size bigint, mime_type text, storage_path text,
  drive_file_id text,
  status text, reviewer_note text, created_at timestamptz, reviewed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.admin_ok(p_passphrase) then
    raise exception 'invalid passphrase';
  end if;
  return query
    select s.id, s.title, s.subject, s.subject_name, s.type, s.course, s.course_name,
           s.description, s.contributor_name, s.contributor_email, s.license,
           s.file_name, s.file_size, s.mime_type, s.storage_path,
           s.drive_file_id,
           s.status, s.reviewer_note, s.created_at, s.reviewed_at
    from public.submissions s
    order by s.created_at desc;
end;
$$;

-- Approve / reject a submission. Passphrase-gated.
create or replace function public.review_submission(
  p_id bigint,
  p_status text,
  p_passphrase text,
  p_note text default null,
  p_drive_file_id text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.admin_ok(p_passphrase) then
    raise exception 'invalid passphrase';
  end if;
  if p_status not in ('approved', 'rejected') then
    raise exception 'invalid status';
  end if;
  update public.submissions set
    status = p_status,
    reviewer_note = coalesce(p_note, reviewer_note),
    drive_file_id = case when p_status = 'approved' then coalesce(p_drive_file_id, drive_file_id) else drive_file_id end,
    reviewed_at = now()
  where id = p_id;
end;
$$;

-- grants (Data API exposure) -------------------------------------------
grant usage on schema public to anon;
grant select, insert on public.submissions to anon;
grant select on public.metrics to anon;
grant usage on sequence public.submissions_id_seq to anon;
grant execute on function public.bump_metric(text, text, bigint, bigint, bigint) to anon;
grant execute on function public.admin_ok(text) to anon;
grant execute on function public.get_submissions(text) to anon;
grant execute on function public.review_submission(bigint, text, text, text, text) to anon;

-- storage ---------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uploads',
  'uploads',
  true,
  26214400, -- 25 MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain'
  ]
)
on conflict (id) do nothing;

-- anon may upload new files into the uploads bucket (client-side)
create policy "anon upload uploads" on storage.objects
  for insert to anon with check (bucket_id = 'uploads');

-- anon may read files for preview/download
create policy "anon read uploads" on storage.objects
  for select to anon using (bucket_id = 'uploads');
