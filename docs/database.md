# 데이터베이스 설계

이 문서는 Vibe-Mafia w1-LMS 프로젝트의 데이터베이스 스키마와 데이터 흐름을 정의합니다.
모든 설계는 `prd.md`, `userflow.md`, `goal.md` 문서를 기반으로 하며, "최소 기능 구현"과 "가장 낮은 복잡도" 원칙을 따릅니다.

## 1. 데이터 플로우

### 1.1. 온보딩
신규 유저 가입 시 Supabase `auth.users`에 계정이 생성되고, 이와 연결된 `profiles` 레코드가 역할(`learner` 또는 `instructor`)을 포함하여 생성됩니다. 약관 동의 이력은 `term_agreements` 테이블에 별도로 기록됩니다.

### 1.2. 코스 생성 및 게시
`instructor`가 `courses` 테이블에 `draft` 상태의 코스를 생성합니다. 코스 내용이 완성되면 상태를 `published`로 변경하여 `learner`들에게 노출시킵니다.

### 1.3. 수강 신청
`learner`가 `published` 상태의 코스에 수강 신청하면, `learner`와 `course`를 연결하는 `enrollments` 레코드가 생성됩니다.

### 1.4. 과제 생성 및 게시
`instructor`가 특정 코스에 속한 `assignments` 레코드를 `draft` 상태로 생성합니다. 과제가 준비되면 상태를 `published`로 변경하여 수강 중인 `learner`들에게 공개합니다.

### 1.5. 과제 제출
`learner`가 과제를 제출하면, `assignment`와 `learner`를 연결하는 `submissions` 레코드가 생성됩니다. 이때 마감일(`due_date`)과 비교하여 `is_late` 플래그가 설정됩니다.

### 1.6. 채점 및 피드백
`instructor`가 `submissions` 레코드를 조회하여 `score`(점수)와 `feedback`(피드백)을 업데이트하고, 상태를 `graded` 또는 `resubmission_required`로 변경합니다. 이 변경 사항은 `learner`에게 즉시 반영됩니다.

---

## 2. 테이블 명세 (PostgreSQL)

### 2.1. ENUM Types
상태 값을 관리하고 데이터 무결성을 보장하기 위해 아래와 같은 ENUM 타입을 먼저 정의합니다.

```sql
CREATE TYPE user_role AS ENUM ('''learner''', '''instructor''');
CREATE TYPE course_status AS ENUM ('''draft''', '''published''', '''archived''');
CREATE TYPE assignment_status AS ENUM ('''draft''', '''published''', '''closed''');
CREATE TYPE enrollment_status AS ENUM ('''active''', '''cancelled''');
CREATE TYPE submission_status AS ENUM ('''submitted''', '''resubmission_required''', '''graded''');
```

### 2.2. `profiles`
사용자의 역할과 기본 프로필 정보를 저장합니다. Supabase `auth.users` 테이블과 1:1 관계를 가집니다.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PRIMARY KEY, FK to `auth.users.id` | 사용자 ID |
| role | user_role | NOT NULL | 사용자 역할 ('learner' or 'instructor') |
| name | TEXT | NOT NULL | 이름 |
| phone_number | VARCHAR(20) | | 휴대폰 번호 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 수정 시각 |

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    name TEXT NOT NULL,
    phone_number VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.3. `term_agreements`
사용자의 약관 동의 이력을 저장합니다.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 고유 ID |
| user_id | UUID | NOT NULL, FK to `profiles.id` | 사용자 ID |
| agreed_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 동의 시각 |
| terms_version | VARCHAR(50) | NOT NULL | 동의한 약관 버전 |

```sql
CREATE TABLE term_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    agreed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    terms_version VARCHAR(50) NOT NULL
);
```

### 2.4. `courses`
강사가 생성하는 코스(강의) 정보를 관리합니다.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 코스 ID |
| instructor_id | UUID | NOT NULL, FK to `profiles.id` | 강사 ID |
| title | TEXT | NOT NULL | 코스 제목 |
| description | TEXT | | 코스 설명 |
| status | course_status | NOT NULL, DEFAULT 'draft' | 코스 상태 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 수정 시각 |

```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status course_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.5. `enrollments`
학습자와 코스 간의 수강 관계를 정의합니다.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 수강신청 ID |
| learner_id | UUID | NOT NULL, FK to `profiles.id` | 학습자 ID |
| course_id | UUID | NOT NULL, FK to `courses.id` | 코스 ID |
| status | enrollment_status | NOT NULL, DEFAULT 'active' | 수강 상태 |
| enrolled_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 수강신청 시각 |

```sql
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status enrollment_status NOT NULL DEFAULT 'active',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(learner_id, course_id)
);
```

### 2.6. `assignments`
코스에 속한 과제의 상세 정보와 정책을 관리합니다.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 과제 ID |
| course_id | UUID | NOT NULL, FK to `courses.id` | 코스 ID |
| title | TEXT | NOT NULL | 과제 제목 |
| description | TEXT | | 과제 설명 |
| due_date | TIMESTAMPTZ | | 마감일 |
| weight | INT | NOT NULL, DEFAULT 0, CHECK (0-100) | 성적 비중 |
| late_submission_allowed | BOOLEAN | NOT NULL, DEFAULT FALSE | 지각 제출 허용 여부 |
| resubmission_allowed | BOOLEAN | NOT NULL, DEFAULT FALSE | 재제출 허용 여부 |
| status | assignment_status | NOT NULL, DEFAULT 'draft' | 과제 상태 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 수정 시각 |

```sql
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
```

### 2.7. `submissions`
학습자의 과제 제출물, 채점 결과, 피드백을 관리합니다.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 제출물 ID |
| assignment_id | UUID | NOT NULL, FK to `assignments.id` | 과제 ID |
| learner_id | UUID | NOT NULL, FK to `profiles.id` | 학습자 ID |
| submitted_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 제출 시각 |
| content_text | TEXT | NOT NULL | 텍스트 제출물 |
| content_link | TEXT | | 링크 제출물 |
| status | submission_status | NOT NULL, DEFAULT 'submitted' | 제출물 상태 |
| is_late | BOOLEAN | NOT NULL, DEFAULT FALSE | 지각 제출 여부 |
| score | INT | CHECK (0-100) | 점수 |
| feedback | TEXT | | 피드백 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 수정 시각 |

```sql
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
```
