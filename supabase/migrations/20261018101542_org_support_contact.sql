-- Item 115 — a support contact per company: an e-mail address and/or a support web page, set by the super admin in
-- Admin → Organization and shown wherever the app tells someone to contact their administrator (first: the page a
-- deactivated account sees, which is shown AFTER sign-out).
--
-- Both are optional (NULL = no contact shown). Reading is already public through "public_read_org_branding"
-- (SELECT TO anon, authenticated USING true, 2026-09-13), which is right for a contact that a signed-out person must
-- see; writing stays with "super_admin_all_org_settings". No policy, function or trigger changes.
--
-- The CHECKs keep a bad value out even if the form is bypassed: the address is a plain e-mail shape, and the web page
-- must be https — the link is rendered on a public page, so a "javascript:" address must never be storable.
ALTER TABLE public.org_settings
  ADD COLUMN support_email TEXT,
  ADD COLUMN support_url TEXT;

ALTER TABLE public.org_settings
  ADD CONSTRAINT org_settings_support_email_format
    CHECK (support_email IS NULL OR support_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  ADD CONSTRAINT org_settings_support_url_https
    CHECK (support_url IS NULL OR support_url ~ '^https://[^[:space:]]+$');