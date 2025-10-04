-- ENUM Types for status management
CREATE TYPE user_role AS ENUM ('learner', 'instructor');
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE assignment_status AS ENUM ('draft', 'published', 'closed');
CREATE TYPE enrollment_status AS ENUM ('active', 'cancelled');
CREATE TYPE submission_status AS ENUM ('submitted', 'resubmission_required', 'graded');

-- Profiles Table: Stores user profile information and role, linked to Supabase auth.
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    name TEXT NOT NULL,
    phone_number VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE profiles IS '사용자의 역할과 기본 프로필 정보를 저장합니다.';

-- Terms Agreements Table: Logs user consent to terms and conditions.
CREATE TABLE term_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    agreed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    terms_version VARCHAR(50) NOT NULL
);
COMMENT ON TABLE term_agreements IS '사용자의 약관 동의 이력을 저장합니다.';

-- Courses Table: Stores course information created by instructors.
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status course_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE courses IS '강사가 생성하는 코스(강의) 정보를 관리합니다.';

-- Enrollments Table: Junction table for learners enrolling in courses.
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status enrollment_status NOT NULL DEFAULT 'active',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(learner_id, course_id)
);
COMMENT ON TABLE enrollments IS '학습자와 코스 간의 수강 관계를 정의합니다.';

-- Assignments Table: Stores assignment details for each course.
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    weight INT NOT NULL DEFAULT 0 CHECK (weight >= 0 AND weight <= 100),
    late_submission_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    resubmission_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    status assignment_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE assignments IS '코스에 속한 과제의 상세 정보와 정책을 관리합니다.';

-- Submissions Table: Stores learner submissions for assignments.
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    learner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    content_text TEXT NOT NULL,
    content_link TEXT,
    status submission_status NOT NULL DEFAULT 'submitted',
    is_late BOOLEAN NOT NULL DEFAULT FALSE,
    score INT CHECK (score >= 0 AND score <= 100),
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(assignment_id, learner_id)
);
COMMENT ON TABLE submissions IS '학습자의 과제 제출물, 채점 결과, 피드백을 관리합니다.';