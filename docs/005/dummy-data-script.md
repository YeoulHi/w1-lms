---
title: "spec-005 테스트 데이터 생성 스크립트"
purpose: "과제 채점 기능 QA를 위한 격리된 테스트 데이터 생성"
date: "2025-10-06"
---

## 개요

이 문서는 spec-005 과제 채점 및 피드백 기능을 테스트하기 위한 깨끗한 더미 데이터를 생성하는 SQL 스크립트를 제공합니다.

## 사용 목적

- 특정 강사 계정으로 과제 채점 기능 테스트
- 여러 계정 간 데이터 혼재로 인한 403 Forbidden 에러 방지
- 일관된 테스트 환경 구축

## 사전 준비

### 1. 강사 계정 ID 확인

먼저 테스트에 사용할 강사 계정의 ID를 확인합니다:

```sql
-- 강사 계정 확인
SELECT id, email, role
FROM auth.users
WHERE email = 'your-instructor-email@example.com';
-- 결과 예시: d3e4f5g6-h7i8-9j0k-1l2m-3n4o5p6q7r8s
```

### 2. 학생 계정 ID 확인 (선택사항)

기존 학생 계정을 사용하거나, 새로 생성:

```sql
-- 학생 계정 확인
SELECT id, email, role
FROM auth.users
WHERE role = 'learner'
LIMIT 3;
```

## 완전한 테스트 데이터 생성 스크립트

### 단계별 실행 스크립트

```sql
-- ========================================
-- Step 1: 강사 ID 설정 (여기를 수정하세요!)
-- ========================================
-- 본인의 강사 계정 ID로 변경
DO $$
DECLARE
  v_instructor_id UUID := 'd3e4f5g6-h7i8-9j0k-1l2m-3n4o5p6q7r8s'; -- ← 이 부분을 수정!
  v_learner_id_1 UUID := 'learner-uuid-1'; -- ← 학생 1 ID
  v_learner_id_2 UUID := 'learner-uuid-2'; -- ← 학생 2 ID
  v_course_id UUID;
  v_assignment_id UUID;
BEGIN

-- ========================================
-- Step 2: 새로운 강의 생성
-- ========================================
INSERT INTO courses (
  title,
  description,
  instructor_id,
  status,
  created_at,
  updated_at
)
VALUES (
  '프로그래밍 기초',
  '초보자를 위한 프로그래밍 입문 강의입니다. Python을 사용하여 기초부터 차근차근 배웁니다.',
  v_instructor_id,
  'published',
  NOW(),
  NOW()
)
RETURNING id INTO v_course_id;

RAISE NOTICE 'Course created with ID: %', v_course_id;

-- ========================================
-- Step 3: 과제 생성
-- ========================================
INSERT INTO assignments (
  course_id,
  title,
  content_text,
  max_score,
  due_date,
  status,
  allow_late_submission,
  created_at,
  updated_at
)
VALUES (
  v_course_id,
  '1주차 과제: Hello World 프로그램 작성',
  E'첫 번째 Python 프로그램을 작성하세요.\n\n요구사항:\n1. print() 함수를 사용하여 "Hello World"를 출력\n2. 변수를 사용하여 본인의 이름 출력\n3. 주석으로 코드 설명 추가',
  100,
  (NOW() + INTERVAL '7 days')::TIMESTAMP, -- 7일 후 마감
  'published',
  true,
  NOW(),
  NOW()
)
RETURNING id INTO v_assignment_id;

RAISE NOTICE 'Assignment created with ID: %', v_assignment_id;

-- ========================================
-- Step 4: 학생 수강 신청 (Enrollment)
-- ========================================
-- 학생 1 수강 신청
INSERT INTO enrollments (
  course_id,
  learner_id,
  status,
  enrolled_at,
  created_at,
  updated_at
)
VALUES (
  v_course_id,
  v_learner_id_1,
  'approved',
  NOW(),
  NOW(),
  NOW()
);

-- 학생 2 수강 신청
INSERT INTO enrollments (
  course_id,
  learner_id,
  status,
  enrolled_at,
  created_at,
  updated_at
)
VALUES (
  v_course_id,
  v_learner_id_2,
  'approved',
  NOW(),
  NOW(),
  NOW()
);

RAISE NOTICE 'Enrollments created for 2 learners';

-- ========================================
-- Step 5: 과제 제출 (Submissions)
-- ========================================
-- 학생 1 제출 (채점 대기 상태)
INSERT INTO submissions (
  assignment_id,
  learner_id,
  content_text,
  submitted_at,
  status,
  created_at,
  updated_at
)
VALUES (
  v_assignment_id,
  v_learner_id_1,
  E'# 1주차 과제 제출\n\nprint("Hello World")\n\nname = "홍길동"\nprint(f"제 이름은 {name}입니다.")\n\n# 첫 번째 Python 프로그램입니다.',
  NOW() - INTERVAL '1 day', -- 1일 전 제출
  'submitted',
  NOW(),
  NOW()
);

-- 학생 2 제출 (채점 대기 상태)
INSERT INTO submissions (
  assignment_id,
  learner_id,
  content_text,
  submitted_at,
  status,
  created_at,
  updated_at
)
VALUES (
  v_assignment_id,
  v_learner_id_2,
  E'# Hello World 프로그램\n\nprint("Hello World")\n\n# 이름 출력\nmy_name = "김철수"\nprint("안녕하세요, " + my_name + "입니다.")',
  NOW() - INTERVAL '2 hours', -- 2시간 전 제출
  'submitted',
  NOW(),
  NOW()
);

RAISE NOTICE 'Submissions created for 2 learners';

-- ========================================
-- Step 6: 결과 확인용 정보 출력
-- ========================================
RAISE NOTICE '========================================';
RAISE NOTICE 'Test Data Creation Completed!';
RAISE NOTICE '========================================';
RAISE NOTICE 'Instructor ID: %', v_instructor_id;
RAISE NOTICE 'Course ID: %', v_course_id;
RAISE NOTICE 'Assignment ID: %', v_assignment_id;
RAISE NOTICE '';
RAISE NOTICE 'Test URL:';
RAISE NOTICE 'http://localhost:3000/instructor/courses/%/assignments/%', v_course_id, v_assignment_id;

END $$;
```

## 사용 방법

### 1. 변수 설정 수정

스크립트 상단의 변수를 본인의 계정 정보로 수정:

```sql
v_instructor_id UUID := 'your-instructor-uuid-here';
v_learner_id_1 UUID := 'your-learner-1-uuid-here';
v_learner_id_2 UUID := 'your-learner-2-uuid-here';
```

### 2. Supabase SQL Editor에서 실행

1. Supabase 대시보드 접속
2. SQL Editor 탭 열기
3. 위 스크립트 전체 복사 & 붙여넙기
4. Run 버튼 클릭

### 3. 출력된 URL로 테스트

스크립트 실행 후 NOTICE 메시지에서 다음 정보 확인:

```
Test URL:
http://localhost:3000/instructor/courses/{course_id}/assignments/{assignment_id}
```

이 URL로 브라우저에서 접속하여 채점 페이지 테스트

## 생성되는 데이터 구조

### 1. Course (강의)
- **Title**: "프로그래밍 기초"
- **Description**: 초보자 대상 Python 강의
- **Status**: published
- **Instructor**: 지정한 강사 계정

### 2. Assignment (과제)
- **Title**: "1주차 과제: Hello World 프로그램 작성"
- **Content**: Python 기초 요구사항
- **Max Score**: 100점
- **Due Date**: 생성일로부터 7일 후
- **Allow Late Submission**: true
- **Status**: published

### 3. Enrollments (수강 신청)
- 2명의 학생 수강 신청
- Status: approved

### 4. Submissions (과제 제출)
- 학생 1: 1일 전 제출 (채점 대기)
- 학생 2: 2시간 전 제출 (채점 대기)
- 각각 다른 코드 내용

## 테스트 시나리오

### 시나리오 1: 채점 완료
1. 제출 목록 페이지 접속
2. 학생 1의 제출물 선택
3. 점수 입력 (예: 95점)
4. 피드백 입력 (예: "잘했습니다. 주석이 명확합니다.")
5. "채점 완료" 버튼 클릭
6. DB 확인: `submissions` 테이블의 `score`, `feedback`, `status` 업데이트 확인

### 시나리오 2: 재제출 요청
1. 학생 2의 제출물 선택
2. "재제출 요청" 버튼 클릭
3. 재제출 사유 입력 (예: "문자열 결합 방식을 f-string으로 변경해주세요.")
4. 요청 제출
5. DB 확인: `submissions` 테이블의 `status` 변경 확인 (예: `resubmission_requested`)

## 데이터 정리 (Clean Up)

테스트 후 생성한 데이터를 삭제하려면:

```sql
-- ========================================
-- 생성한 테스트 데이터 삭제
-- ========================================
-- 주의: course_id를 실제 생성된 ID로 변경하세요!
DO $$
DECLARE
  v_course_id UUID := 'your-course-id-here';
BEGIN
  -- Submissions 삭제
  DELETE FROM submissions
  WHERE assignment_id IN (
    SELECT id FROM assignments WHERE course_id = v_course_id
  );

  -- Enrollments 삭제
  DELETE FROM enrollments WHERE course_id = v_course_id;

  -- Assignments 삭제
  DELETE FROM assignments WHERE course_id = v_course_id;

  -- Course 삭제
  DELETE FROM courses WHERE id = v_course_id;

  RAISE NOTICE 'Test data cleaned up successfully';
END $$;
```

## 트러블슈팅

### 문제: "instructor_id does not exist"
- **원인**: 잘못된 UUID 또는 존재하지 않는 강사 ID
- **해결**: `SELECT id FROM auth.users WHERE email = '...'` 로 올바른 ID 확인

### 문제: 403 Forbidden 오류
- **원인**: 로그인한 계정과 스크립트의 `v_instructor_id`가 다름
- **해결**:
  1. 스크립트의 UUID를 현재 로그인 계정 ID로 변경
  2. 또는 스크립트에 지정한 instructor 계정으로 재로그인

### 문제: 제출 목록이 비어있음
- **원인**: Learner ID가 잘못되었거나 submissions 생성 실패
- **해결**:
  ```sql
  -- 제출 목록 확인
  SELECT * FROM submissions
  WHERE assignment_id = 'your-assignment-id';
  ```

## 관련 문서
- `docs/log/spec-005-002-submissions-403-fix.md`: 403 에러 해결 과정
- `docs/005/task-001-result.md`: QA 준비 완료 보고
- `docs/database.md`: 데이터베이스 스키마 정의
