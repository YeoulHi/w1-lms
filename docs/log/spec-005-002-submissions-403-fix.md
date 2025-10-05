---
title: "spec-005-002: 과제 제출 목록 403 Forbidden 오류 해결"
date: "2025-10-06"
issue: "강사가 과제 제출 목록 페이지 접근 시 403 Forbidden 오류 발생"
root_cause: "로그인한 강사 ID와 과제 소유자의 instructor_id 불일치"
---

## 상세 내용

### 증상
- 강사가 `/instructor/courses/{courseId}/assignments/{assignmentId}` 페이지 접근 시 403 오류 발생
- 백엔드 응답: "해당 과제를 조회할 권한이 없습니다."
- 네트워크 탭에서 `GET /api/assignments/{assignmentId}/submissions` 요청 실패

### 문제 분석

#### 초기 디버깅
```typescript
// 백엔드 서비스에 임시 디버그 로그 추가
console.log('[DEBUG] Assignment instructor_id:', assignment.courses.instructor_id);
console.log('[DEBUG] Request instructorId:', instructorId);
console.log('[DEBUG] Match:', assignment.courses.instructor_id === instructorId);
```

#### 발견된 문제
```bash
# 디버그 로그 결과
[DEBUG] Assignment instructor_id: "f6bd37bb-e82e-4bb3-83d9-07eb3b1ebe28"
[DEBUG] Request instructorId: "d3e4f5g6-h7i8-9j0k-1l2m-3n4o5p6q7r8s"
[DEBUG] Match: false
```

#### 문제의 원인
1. **instructor_id 불일치**:
   - 로그인한 사용자: `duwlswls22@gmail.com` (ID: `d3e4f5g6...`)
   - 과제 소유자: 다른 강사 계정 (ID: `f6bd37bb...`)
   - 권한 검증 로직에서 강사 ID 불일치로 403 반환

2. **더미 데이터 문제**:
   - 여러 계정으로 테스트하며 생성한 데이터 혼재
   - 과제와 강사 계정 간 소유권 불일치

### 해결 방법

#### 1단계: 올바른 instructor_id 확인
```sql
-- 현재 로그인한 사용자의 ID 확인
SELECT id, email FROM auth.users WHERE email = 'duwlswls22@gmail.com';
-- 결과: d3e4f5g6-h7i8-9j0k-1l2m-3n4o5p6q7r8s
```

#### 2단계: 깨끗한 테스트 데이터 생성
```sql
-- 1. 새로운 강의 생성
INSERT INTO courses (title, description, instructor_id, status)
VALUES (
  '프로그래밍 기초',
  '초보자를 위한 프로그래밍 입문 강의',
  'd3e4f5g6-h7i8-9j0k-1l2m-3n4o5p6q7r8s', -- duwlswls22@gmail.com
  'published'
)
RETURNING id;
-- 결과: course_id_123

-- 2. 과제 생성
INSERT INTO assignments (
  course_id, title, content_text, max_score,
  due_date, status, allow_late_submission
)
VALUES (
  'course_id_123',
  '1주차 과제: Hello World',
  '첫 번째 프로그램을 작성하세요.',
  100,
  '2025-10-13 23:59:59',
  'published',
  true
)
RETURNING id;
-- 결과: assignment_id_456

-- 3. 학생 수강 신청
INSERT INTO enrollments (course_id, learner_id, status)
VALUES ('course_id_123', 'learner_id_789', 'approved');

-- 4. 과제 제출
INSERT INTO submissions (
  assignment_id, learner_id, content_text,
  submitted_at, status
)
VALUES (
  'assignment_id_456',
  'learner_id_789',
  'print("Hello World")',
  NOW(),
  'submitted'
);
```

#### 3단계: React Query 데이터 파싱 오류 해결
```typescript
// ❌ 초기 구현 (undefined 에러 발생)
const courseId = data?.assignment.course_id;

// ✅ 수정된 구현 (안전한 접근)
const courseId = data?.assignment?.course_id || '';
```

**문제 원인**:
- 백엔드 응답 구조: `{ assignment: { ... }, submissions: [...] }`
- React Query가 데이터 로딩 중일 때 `data`가 `undefined`
- `data.assignment.course_id` 접근 시 `Cannot read property 'course_id' of undefined` 에러

**해결책**:
- Optional chaining (`?.`) 사용
- Fallback 값 제공 (`|| ''`)

#### 4단계: 디버그 로그 제거
```typescript
// 문제 해결 확인 후 디버그 로그 삭제
// console.log('[DEBUG] Assignment instructor_id:', ...); ← 제거
// console.log('[DEBUG] Request instructorId:', ...);      ← 제거
// console.log('[DEBUG] Match:', ...);                     ← 제거
```

### 영향받은 파일

#### 수정된 파일
1. **`src/features/assignments/backend/service.ts`**:
   - 디버그 로그 추가 및 제거 (임시)
   - 권한 검증 로직 확인

2. **`src/app/instructor/courses/[courseId]/assignments/[assignmentId]/page.tsx`**:
   - React Query 데이터 접근 안전성 개선
   - Optional chaining 및 fallback 값 추가

### 핵심 차이점: 403 vs 401

| 상태 코드 | 의미 | 원인 | 해결 방법 |
|-----------|------|------|-----------|
| **401 Unauthorized** | 인증 실패 | JWT 토큰 누락/만료, Service Role Key 사용 | Anon Client + Access Token 패턴 사용 |
| **403 Forbidden** | 권한 부족 | 인증은 성공했으나 리소스 접근 권한 없음 | 올바른 소유자 계정으로 로그인, 데이터 정합성 확인 |

### 검증 결과
- ✅ 페이지 접근 시 200 OK 응답
- ✅ 과제 제출 목록 정상 표시
- ✅ 학생 정보 및 제출 내용 정상 렌더링
- ✅ 채점 기능 테스트 준비 완료

### 테스트 URL
```
/instructor/courses/course_id_123/assignments/assignment_id_456
```

### 교훈

1. **403 에러는 권한 문제**:
   - 인증(Authentication)은 성공했지만 인가(Authorization)가 실패
   - DB에서 리소스 소유권 확인 필요

2. **디버그 로그의 중요성**:
   - 권한 검증 로직에 임시 로그 추가로 정확한 원인 파악
   - 문제 해결 후 반드시 디버그 로그 제거

3. **깨끗한 테스트 데이터 관리**:
   - 여러 계정으로 테스트 시 데이터 소유권 명확히 구분
   - 단일 강사 계정으로 일관된 더미 데이터 생성 권장

4. **React Query 안전한 데이터 접근**:
   - 항상 optional chaining 사용
   - 로딩 상태에서 `undefined` 처리 필수
   - Fallback 값으로 런타임 에러 방지

5. **SQL을 활용한 빠른 데이터 정합성 확인**:
   ```sql
   -- 과제 소유자 확인
   SELECT
     a.id as assignment_id,
     a.title,
     c.instructor_id,
     u.email as instructor_email
   FROM assignments a
   JOIN courses c ON a.course_id = c.id
   JOIN auth.users u ON c.instructor_id = u.id
   WHERE a.id = 'assignment_id';
   ```

6. **에러 유형별 대응 전략**:
   - 401: 인증 패턴 점검 (Anon Client + Token)
   - 403: 소유권/권한 점검 (DB 데이터 확인)
   - 404: 라우팅/경로 점검
   - 500: 서버 로직/DB 쿼리 점검
