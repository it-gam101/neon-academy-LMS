-- =============================================================================
-- PHASE 1 UPDATES: Bootstrap Rule, Org Settings, Demo Course Seed
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ORG SETTINGS TABLE (single row)
-- -----------------------------------------------------------------------------

CREATE TABLE public.org_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name TEXT NOT NULL DEFAULT 'Neon Academy',
  logo_url TEXT,
  default_locale TEXT NOT NULL DEFAULT 'en' CHECK (default_locale IN ('en', 'he')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure only one row
CREATE UNIQUE INDEX idx_org_settings_singleton ON public.org_settings ((true));

ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;

-- Only super_admin can read/modify org settings
CREATE POLICY "super_admin_all_org_settings"
  ON public.org_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Insert default row
INSERT INTO public.org_settings (org_name) VALUES ('Neon Academy');

-- -----------------------------------------------------------------------------
-- UPDATE PROFILE CREATION TRIGGER: Bootstrap Rule
-- First user becomes super_admin, rest default to employee
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_super_admin BOOLEAN;
  new_role TEXT;
BEGIN
  -- Check if any super_admin exists
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE role = 'super_admin'
  ) INTO has_super_admin;
  
  -- First user becomes super_admin, otherwise employee
  IF NOT has_super_admin THEN
    new_role := 'super_admin';
  ELSE
    new_role := 'employee';
  END IF;
  
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    new_role
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- SEED DEMO COURSE
-- Creates a welcome course with lessons and a quiz
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  v_category_id UUID;
  v_instructor_id UUID;
  v_course_id UUID;
  v_module1_id UUID;
  v_module2_id UUID;
  v_module3_id UUID;
  v_quiz_id UUID;
BEGIN
  -- Get Onboarding category
  SELECT id INTO v_category_id FROM public.course_categories WHERE name_en = 'Onboarding' LIMIT 1;
  
  -- Try to find an instructor, otherwise use first super_admin
  SELECT id INTO v_instructor_id FROM public.profiles WHERE role = 'instructor' LIMIT 1;
  IF v_instructor_id IS NULL THEN
    SELECT id INTO v_instructor_id FROM public.profiles WHERE role = 'super_admin' LIMIT 1;
  END IF;
  
  -- Only seed if we have a creator and the course doesn't exist
  IF v_instructor_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.courses WHERE title_en = 'Welcome to Neon Academy'
  ) THEN
    -- Create the course
    INSERT INTO public.courses (
      title_en, title_he,
      description_en, description_he,
      course_type, status, category_id, created_by,
      estimated_minutes, is_mandatory, due_days
    ) VALUES (
      'Welcome to Neon Academy',
      'ברוכים הבאים לניאון אקדמי',
      'Get started with Neon Academy! Learn how to navigate the platform, track your progress, and complete courses.',
      'התחילו עם ניאון אקדמי! למדו כיצד לנווט בפלטפורמה, לעקוב אחר ההתקדמות שלכם ולהשלים קורסים.',
      'native', 'published', v_category_id, v_instructor_id,
      15, true, 7
    ) RETURNING id INTO v_course_id;
    
    -- Module 1: Introduction lesson
    INSERT INTO public.modules (
      course_id, title_en, title_he, sort_order, module_type, content_json
    ) VALUES (
      v_course_id,
      'Getting Started',
      'תחילת העבודה',
      1,
      'lesson',
      '{
        "blocks": [
          {
            "type": "heading",
            "content": {"en": "Welcome to Neon Academy!", "he": "ברוכים הבאים לניאון אקדמי!"}
          },
          {
            "type": "text",
            "content": {
              "en": "Neon Academy is your organization''s learning management system. Here you''ll find courses designed to help you grow professionally and stay compliant with company policies.",
              "he": "ניאון אקדמי היא מערכת ניהול הלמידה של הארגון שלכם. כאן תמצאו קורסים שנועדו לעזור לכם להתפתח מקצועית ולעמוד במדיניות החברה."
            }
          },
          {
            "type": "heading",
            "content": {"en": "How to Navigate", "he": "כיצד לנווט"}
          },
          {
            "type": "text",
            "content": {
              "en": "Use the navigation menu at the top to access different sections:\n• **Catalogue** - Browse all available courses\n• **My Learning** - Track your enrolled courses and progress",
              "he": "השתמשו בתפריט הניווט בחלק העליון כדי לגשת לחלקים שונים:\n• **קטלוג** - עיינו בכל הקורסים הזמינים\n• **הלמידה שלי** - עקבו אחר הקורסים וההתקדמות שלכם"
            }
          }
        ]
      }'::jsonb
    ) RETURNING id INTO v_module1_id;
    
    -- Module 2: Progress tracking lesson
    INSERT INTO public.modules (
      course_id, title_en, title_he, sort_order, module_type, content_json
    ) VALUES (
      v_course_id,
      'Tracking Your Progress',
      'מעקב אחר ההתקדמות',
      2,
      'lesson',
      '{
        "blocks": [
          {
            "type": "heading",
            "content": {"en": "Understanding Your Progress", "he": "הבנת ההתקדמות שלכם"}
          },
          {
            "type": "text",
            "content": {
              "en": "Each course consists of modules - lessons and quizzes. As you complete each module, your progress is automatically tracked.",
              "he": "כל קורס מורכב ממודולים - שיעורים ומבחנים. ככל שתשלימו כל מודול, ההתקדמות שלכם נרשמת אוטומטית."
            }
          },
          {
            "type": "text",
            "content": {
              "en": "**Progress States:**\n• Not Started - You haven''t begun this module\n• In Progress - You''ve started but not completed\n• Completed - You''ve finished the module",
              "he": "**מצבי התקדמות:**\n• לא התחיל - עדיין לא התחלתם את המודול\n• בתהליך - התחלתם אבל לא סיימתם\n• הושלם - סיימתם את המודול"
            }
          },
          {
            "type": "heading",
            "content": {"en": "Due Dates", "he": "תאריכי יעד"}
          },
          {
            "type": "text",
            "content": {
              "en": "Some courses have due dates. Make sure to complete mandatory courses before their deadlines to stay compliant!",
              "he": "לחלק מהקורסים יש תאריכי יעד. הקפידו להשלים קורסי חובה לפני המועד האחרון כדי לעמוד בדרישות!"
            }
          }
        ]
      }'::jsonb
    ) RETURNING id INTO v_module2_id;
    
    -- Module 3: Quiz
    INSERT INTO public.modules (
      course_id, title_en, title_he, sort_order, module_type
    ) VALUES (
      v_course_id,
      'Knowledge Check',
      'בדיקת ידע',
      3,
      'quiz'
    ) RETURNING id INTO v_module3_id;
    
    -- Create the quiz
    INSERT INTO public.quizzes (
      module_id, pass_score, attempts_allowed, time_limit_minutes, shuffle_questions
    ) VALUES (
      v_module3_id, 70, 3, 5, false
    ) RETURNING id INTO v_quiz_id;
    
    -- Quiz questions
    INSERT INTO public.quiz_questions (quiz_id, question_type, question_en, question_he, options, correct, points, sort_order) VALUES
    (
      v_quiz_id,
      'single',
      'Where can you find all available courses?',
      'היכן ניתן למצוא את כל הקורסים הזמינים?',
      '[
        {"en": "My Learning", "he": "הלמידה שלי"},
        {"en": "Catalogue", "he": "קטלוג"},
        {"en": "Settings", "he": "הגדרות"},
        {"en": "Profile", "he": "פרופיל"}
      ]'::jsonb,
      '1'::jsonb,
      1,
      1
    ),
    (
      v_quiz_id,
      'true_false',
      'All courses in Neon Academy have due dates.',
      'לכל הקורסים בניאון אקדמי יש תאריכי יעד.',
      '[
        {"en": "True", "he": "נכון"},
        {"en": "False", "he": "לא נכון"}
      ]'::jsonb,
      '1'::jsonb,
      1,
      2
    ),
    (
      v_quiz_id,
      'multi',
      'Which of the following are valid progress states? (Select all that apply)',
      'אילו מהבאים הם מצבי התקדמות תקינים? (בחרו את כל המתאימים)',
      '[
        {"en": "Not Started", "he": "לא התחיל"},
        {"en": "In Progress", "he": "בתהליך"},
        {"en": "Completed", "he": "הושלם"},
        {"en": "Expired", "he": "פג תוקף"}
      ]'::jsonb,
      '[0, 1, 2]'::jsonb,
      2,
      3
    );
  END IF;
END $$;