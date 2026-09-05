-- Item 90 — repair duplicate sort_order values.
--
-- Modules were created with `modules.length + 1`, which collides as soon as any
-- module is deleted: 1,2,3 -> delete one -> two rows holding 2 and 3 -> add ->
-- length + 1 = 3, duplicating the existing 3.
--
-- Duplicates make Move Up / Move Down a no-op, because swapping two equal values
-- writes the same number twice. They also leave the LEARNER-facing module order
-- unstable: Postgres does not guarantee the order of tied rows.
--
-- Renumber every course densely from 1.

WITH ranked AS (
  SELECT id,
         (row_number() OVER (PARTITION BY course_id ORDER BY sort_order, created_at))::int AS rn
  FROM public.modules
)
UPDATE public.modules m
SET sort_order = ranked.rn
FROM ranked
WHERE ranked.id = m.id
  AND m.sort_order IS DISTINCT FROM ranked.rn;