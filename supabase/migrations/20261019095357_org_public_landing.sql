-- Template work B2 — per company: does a signed-out visitor at / see the public landing page (the Neon Academy
-- showcase, with the public Sandbox demo) or go straight to the company's own sign-in page? OFF by default, so a copy
-- of the Academy opens on sign-in. The super admin switches it in Admin → Organization.
--
-- Deliberately NO UPDATE here: the org_settings row is seeded by a migration (20260709013638), so a copy whose
-- database is built by replaying migrations would inherit it. Our own site is switched ON in Admin before publishing.
--
-- Reading is already public through "public_read_org_branding" (SELECT TO anon, authenticated USING true), which a
-- signed-out visitor needs; writing stays with "super_admin_all_org_settings". No policy, function or trigger changes.
ALTER TABLE public.org_settings
  ADD COLUMN public_landing BOOLEAN NOT NULL DEFAULT false;