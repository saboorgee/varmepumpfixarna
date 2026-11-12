-- One-time database setup for Medusa on Supabase.
-- Run as the `postgres` user in the Supabase SQL Editor (or psql) BEFORE the
-- first `docker compose run --rm backend migrate`.
--
-- Creates a dedicated login role and schema for Medusa:
--   * all Medusa tables are created in schema "medusa" (never in public/auth/storage),
--   * the role cannot read or modify tables in other schemas it was not granted,
--   * Supabase's Data API roles (anon, authenticated) get no access to the schema.
--
-- Why a role-level search_path: Medusa 2.22's module migrations run their DDL
-- unqualified, so they land in the connection's default schema. Setting the
-- search_path on the role makes every session (direct or via the session
-- pooler) default to "medusa".
--
-- Replace CHANGE_ME with a long random password (URL-encode it in DATABASE_URL).

create role medusa with login password 'CHANGE_ME';

-- Membership lets postgres create the schema on medusa's behalf (required on
-- PostgreSQL 16+) and lets the Supabase dashboard / pg_dump read Medusa's objects.
grant medusa to postgres;

create schema if not exists medusa authorization medusa;

alter role medusa set search_path to medusa;

-- Medusa's link sync issues `CREATE SCHEMA IF NOT EXISTS "medusa"`, which
-- PostgreSQL authorises against the database before checking existence.
-- Without this grant link tables are silently not created. (It also allows
-- trusted extensions such as pg_trgm for the optional search module.)
do $$ begin
  execute format('grant create on database %I to medusa', current_database());
end $$;

-- Keep Medusa out of Supabase's Data API (PostgREST/GraphQL), regardless of
-- the "Exposed schemas" setting.
revoke all on schema medusa from anon, authenticated;
alter default privileges for role medusa in schema medusa revoke all on tables from anon, authenticated;
alter default privileges for role medusa in schema medusa revoke all on sequences from anon, authenticated;
alter default privileges for role medusa in schema medusa revoke all on functions from anon, authenticated;

-- Verify (expected: search_path = medusa, owner = medusa, no anon/authenticated rows):
--   select rolname, rolconfig from pg_roles where rolname = 'medusa';
--   select nspname, pg_get_userbyid(nspowner) from pg_namespace where nspname = 'medusa';
--   select grantee, privilege_type from information_schema.usage_privileges where object_schema = 'medusa';
