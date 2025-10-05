# 과제 제출 기능 QA 가이드

## 1. 테스트 데이터 준비

### 1.1 데이터베이스 준비 사항

QA를 진행하기 전에 다음 데이터가 DB에 존재해야 합니다:

```sql
-- 1. 강사 계정 (Instructor)
-- auth.users 테이블에 생성된 계정 필요
-- profiles 테이블에 role='instructor' 레코드 필요

-- 2. 학습자 계정 (Learner)
-- auth.users 테이블에 생성된 계정 필요
-- profiles 테이블에 role='learner' 레코드 필요

-- 3. 코스 (Course)
INSERT INTO courses (id, instructor_id, title, description, status)
VALUES (
  'course-uuid-here',
  'instructor-user-id',
  'QA 테스트 코스',
  '과제 제출 기능 테스트용 코스',
  'published'  -- 반드시 published 상태여야 함
);

-- 4. 수강신청 (Enrollment)
INSERT INTO enrollments (learner_id, course_id, status)
VALUES (
  'learner-user-id',
  'course-uuid-here',
  'active'
);

-- 5. 과제 (Assignment) - 여러 시나리오별로 생성
-- 5-1. 정상 제출 가능한 과제
INSERT INTO assignments (
  id,
  course_id,
  title,
  description,
  due_date,
  weight,
  late_submission_allowed,
  resubmission_allowed,
  status
) VALUES (
  'assignment-normal-uuid',
  'course-uuid-here',
  '정상 제출 테스트 과제',
  '마감 전, 재제출 가능',
  NOW() + INTERVAL '7 days',  -- 마감일 7일 후
  30,
  TRUE,   -- 지각 제출 허용
  TRUE,   -- 재제출 허용
  'published'
);

-- 5-2. 지각 제출 불가 과제 (마감 후)
INSERT INTO assignments (
  id,
  course_id,
  title,
  description,
  due_date,
  weight,
  late_submission_allowed,
  resubmission_allowed,
  status
) VALUES (
  'assignment-late-not-allowed-uuid',
  'course-uuid-here',
  '지각 불가 과제',
  '마감일 지났고 지각 제출 불가',
  NOW() - INTERVAL '1 day',  -- 마감일 1일 전
  20,
  FALSE,  -- 지각 제출 불허
  TRUE,
  'published'
);

-- 5-3. 지각 제출 가능 과제 (마감 후)
INSERT INTO assignments (
  id,
  course_id,
  title,
  description,
  due_date,
  weight,
  late_submission_allowed,
  resubmission_allowed,
  status
) VALUES (
  'assignment-late-allowed-uuid',
  'course-uuid-here',
  '지각 가능 과제',
  '마감일 지났지만 지각 제출 가능',
  NOW() - INTERVAL '1 day',
  25,
  TRUE,   -- 지각 제출 허용
  TRUE,
  'published'
);

-- 5-4. 재제출 불가 과제
INSERT INTO assignments (
  id,
  course_id,
  title,
  description,
  due_date,
  weight,
  late_submission_allowed,
  resubmission_allowed,
  status
) VALUES (
  'assignment-no-resubmit-uuid',
  'course-uuid-here',
  '재제출 불가 과제',
  '한 번만 제출 가능',
  NOW() + INTERVAL '7 days',
  25,
  TRUE,
  FALSE,  -- 재제출 불허
  'published'
);

-- 5-5. Draft 상태 과제 (제출 불가)
INSERT INTO assignments (
  id,
  course_id,
  title,
  description,
  due_date,
  weight,
  late_submission_allowed,
  resubmission_allowed,
  status
) VALUES (
  'assignment-draft-uuid',
  'course-uuid-here',
  'Draft 과제',
  '아직 게시되지 않음',
  NOW() + INTERVAL '7 days',
  0,
  TRUE,
  TRUE,
  'draft'  -- 게시 안 됨
);
```

---

## 2. API 테스트 (Backend)

### 2.1 도구 준비
- **Postman**, **Thunder Client** (VSCode Extension), 또는 **curl** 사용

### 2.2 인증 토큰 획득

```bash
# 1. Supabase Auth로 로그인하여 access_token 획득
# 방법 A: 프론트엔드 로그인 후 브라우저 DevTools > Application > Local Storage에서 확인
# 방법 B: Supabase Dashboard에서 직접 토큰 생성
```

### 2.3 테스트 케이스

#### TC-001: 정상 제출 (최초)
**요청**
```http
POST /api/assignments/assignment-normal-uuid/submissions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "과제를 완료했습니다. 구현 내용은 다음과 같습니다...",
  "link": "https://github.com/user/repo"
}
```

**기대 결과**
- Status: `201 Created`
- Response Body:
```json
{
  "id": "submission-uuid",
  "assignment_id": "assignment-normal-uuid",
  "learner_id": "learner-user-id",
  "content_text": "과제를 완료했습니다...",
  "content_link": "https://github.com/user/repo",
  "status": "submitted",
  "is_late": false,
  "score": null,
  "feedback": null,
  "submitted_at": "2025-10-06T...",
  "created_at": "2025-10-06T...",
  "updated_at": "2025-10-06T..."
}
```

---

#### TC-002: 재제출 (정상)
**전제조건**: TC-001 완료 후

**요청**
```http
POST /api/assignments/assignment-normal-uuid/submissions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "수정된 내용입니다.",
  "link": "https://github.com/user/repo/v2"
}
```

**기대 결과**
- Status: `201 Created`
- `is_late`: `false` (마감 전이므로)
- 기존 제출물이 덮어씌워짐 (upsert)

---

#### TC-003: 지각 제출 허용
**요청**
```http
POST /api/assignments/assignment-late-allowed-uuid/submissions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "지각 제출합니다.",
  "link": ""
}
```

**기대 결과**
- Status: `201 Created`
- `is_late`: `true`

---

#### TC-004: 지각 제출 불허 (마감 후)
**요청**
```http
POST /api/assignments/assignment-late-not-allowed-uuid/submissions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "마감 후 제출 시도",
  "link": ""
}
```

**기대 결과**
- Status: `403 Forbidden`
- Error Response:
```json
{
  "error": {
    "code": "DEADLINE_PASSED",
    "message": "마감된 과제입니다."
  }
}
```

---

#### TC-005: 재제출 불가 정책 위반
**전제조건**: `assignment-no-resubmit-uuid`에 이미 제출 완료

**요청**
```http
POST /api/assignments/assignment-no-resubmit-uuid/submissions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "재제출 시도",
  "link": ""
}
```

**기대 결과**
- Status: `403 Forbidden`
- Error:
```json
{
  "error": {
    "code": "RESUBMISSION_NOT_ALLOWED",
    "message": "재제출이 허용되지 않는 과제입니다."
  }
}
```

---

#### TC-006: 채점 완료 후 재제출 차단
**전제조건**: 제출물이 `graded` 상태

```sql
-- submissions 테이블에서 상태를 graded로 변경
UPDATE submissions
SET status = 'graded', score = 85, feedback = '잘 했습니다.'
WHERE assignment_id = 'assignment-normal-uuid'
  AND learner_id = 'learner-user-id';
```

**요청**
```http
POST /api/assignments/assignment-normal-uuid/submissions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "채점 후 재제출 시도",
  "link": ""
}
```

**기대 결과**
- Status: `403 Forbidden`
- Error:
```json
{
  "error": {
    "code": "ALREADY_GRADED",
    "message": "이미 채점이 완료된 과제입니다."
  }
}
```

---

#### TC-007: 강사 재제출 요청 후 제출 허용
**전제조건**: 재제출 불가 과제이지만, 강사가 `resubmission_required` 상태로 변경

```sql
UPDATE submissions
SET status = 'resubmission_required',
    feedback = '다시 제출해주세요. 추가 설명이 필요합니다.'
WHERE assignment_id = 'assignment-no-resubmit-uuid'
  AND learner_id = 'learner-user-id';
```

**요청**
```http
POST /api/assignments/assignment-no-resubmit-uuid/submissions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "강사 요청에 따른 재제출",
  "link": ""
}
```

**기대 결과**
- Status: `201 Created`
- 제출 성공 (예외적으로 허용)

---

#### TC-008: 미등록 학습자 제출 차단
**전제조건**: 학습자가 해당 코스에 수강신청하지 않음

**요청**
```http
POST /api/assignments/assignment-normal-uuid/submissions
Authorization: Bearer {다른-학습자-토큰}
Content-Type: application/json

{
  "content": "미수강 학습자 제출 시도",
  "link": ""
}
```

**기대 결과**
- Status: `403 Forbidden`
- Error:
```json
{
  "error": {
    "code": "NOT_ENROLLED",
    "message": "수강하지 않은 강의의 과제입니다."
  }
}
```

---

#### TC-009: 게시되지 않은 과제 제출 차단
**요청**
```http
POST /api/assignments/assignment-draft-uuid/submissions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "Draft 과제 제출 시도",
  "link": ""
}
```

**기대 결과**
- Status: `403 Forbidden`
- Error:
```json
{
  "error": {
    "code": "ASSIGNMENT_NOT_PUBLISHED",
    "message": "게시되지 않은 과제입니다."
  }
}
```

---

#### TC-010: 필수 입력 검증 (content 누락)
**요청**
```http
POST /api/assignments/assignment-normal-uuid/submissions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "",
  "link": "https://github.com/user/repo"
}
```

**기대 결과**
- Status: `400 Bad Request`
- Error:
```json
{
  "error": {
    "code": "INVALID_REQUEST_BODY",
    "message": "제출 데이터가 유효하지 않습니다.",
    "details": {
      "content": {
        "_errors": ["내용은 필수입니다."]
      }
    }
  }
}
```

---

#### TC-011: URL 형식 검증
**요청**
```http
POST /api/assignments/assignment-normal-uuid/submissions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "정상 내용",
  "link": "invalid-url"
}
```

**기대 결과**
- Status: `400 Bad Request`
- Error:
```json
{
  "error": {
    "code": "INVALID_REQUEST_BODY",
    "message": "제출 데이터가 유효하지 않습니다.",
    "details": {
      "link": {
        "_errors": ["유효한 URL을 입력해주세요."]
      }
    }
  }
}
```

---

#### TC-012: 인증되지 않은 요청
**요청**
```http
POST /api/assignments/assignment-normal-uuid/submissions
Content-Type: application/json

{
  "content": "인증 없이 제출 시도",
  "link": ""
}
```

**기대 결과**
- Status: `401 Unauthorized`
- Error:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "인증되지 않은 사용자입니다."
  }
}
```

---

## 3. Frontend 테스트 (UI)

### 3.1 테스트 페이지 생성

먼저 테스트용 페이지를 생성하여 `SubmissionForm` 컴포넌트를 확인합니다.

**파일 생성**: `src/app/test/assignments/[assignmentId]/page.tsx`

```tsx
'use client';

import { SubmissionForm } from '@/features/assignments/components/SubmissionForm';
import { use } from 'react';

interface PageProps {
  params: Promise<{ assignmentId: string }>;
}

export default function TestSubmissionPage({ params }: PageProps) {
  const { assignmentId } = use(params);

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="mb-6 text-2xl font-bold">과제 제출 테스트</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Assignment ID: {assignmentId}
      </p>
      <SubmissionForm assignmentId={assignmentId} />
    </div>
  );
}
```

### 3.2 접속 URL
```
http://localhost:3000/test/assignments/assignment-normal-uuid
```

### 3.3 UI 테스트 케이스

#### UI-001: 초기 렌더링 상태 확인
**절차**
1. 테스트 페이지 접속
2. 폼 렌더링 확인

**기대 결과**
- ✅ "제출 내용" 텍스트 영역이 비어있음
- ✅ "참고 링크 (선택)" 입력 필드가 비어있음
- ✅ "제출하기" 버튼이 활성화 상태

---

#### UI-002: 필수 입력 검증 (content 누락)
**절차**
1. "제출 내용"을 비워둠
2. "제출하기" 버튼 클릭

**기대 결과**
- ✅ 텍스트 영역 아래에 "내용은 필수입니다." 오류 메시지 표시
- ✅ API 호출되지 않음 (Network 탭 확인)

---

#### UI-003: 유효한 제출
**절차**
1. "제출 내용"에 텍스트 입력: "QA 테스트 제출입니다."
2. "참고 링크"에 URL 입력: "https://github.com/test"
3. "제출하기" 버튼 클릭

**기대 결과**
- ✅ 버튼이 "제출 중..."으로 변경되고 비활성화됨
- ✅ 로딩 중 폼 필드가 비활성화됨
- ✅ 성공 시 토스트 메시지 표시: "제출 완료 - 과제가 성공적으로 제출되었습니다."
- ✅ 폼이 초기화됨 (입력 필드 비워짐)

---

#### UI-004: URL 형식 검증
**절차**
1. "제출 내용"에 텍스트 입력
2. "참고 링크"에 잘못된 URL 입력: "not-a-url"
3. "제출하기" 버튼 클릭

**기대 결과**
- ✅ 링크 입력 필드 아래에 "유효한 URL을 입력해주세요." 오류 메시지 표시
- ✅ API 호출되지 않음

---

#### UI-005: API 오류 처리 (마감된 과제)
**절차**
1. URL을 지각 불허 과제로 변경: `/test/assignments/assignment-late-not-allowed-uuid`
2. "제출 내용" 입력
3. "제출하기" 버튼 클릭

**기대 결과**
- ✅ 토스트 메시지 표시: "제출 실패 - 마감된 과제입니다." (빨간색)
- ✅ 버튼이 다시 활성화됨
- ✅ 입력 필드는 초기화되지 않음 (사용자가 수정 가능)

---

#### UI-006: 재제출 시나리오
**절차**
1. 정상 과제에 첫 제출 완료
2. 폼 초기화 확인
3. 다시 "제출 내용" 입력
4. "제출하기" 버튼 클릭

**기대 결과**
- ✅ 재제출 성공 토스트 표시
- ✅ 폼 다시 초기화

---

#### UI-007: 로딩 상태 중 중복 제출 방지
**절차**
1. "제출 내용" 입력
2. "제출하기" 버튼 클릭
3. 로딩 중일 때 버튼 다시 클릭 시도

**기대 결과**
- ✅ 버튼이 비활성화되어 클릭되지 않음
- ✅ 중복 API 호출 없음

---

## 4. 데이터베이스 검증

### 4.1 제출 후 DB 확인

```sql
-- 제출물 조회
SELECT
  s.id,
  s.assignment_id,
  s.learner_id,
  s.content_text,
  s.content_link,
  s.status,
  s.is_late,
  s.score,
  s.feedback,
  s.submitted_at,
  s.created_at,
  s.updated_at,
  a.title as assignment_title,
  a.due_date
FROM submissions s
JOIN assignments a ON s.assignment_id = a.id
WHERE s.learner_id = 'learner-user-id'
ORDER BY s.submitted_at DESC;
```

**확인 사항**
- ✅ `status` = 'submitted'
- ✅ `is_late` 값이 마감일 기준으로 올바르게 설정됨
- ✅ `content_text`, `content_link`가 입력값과 일치
- ✅ `submitted_at`이 현재 시각으로 업데이트됨
- ✅ 재제출 시 `updated_at`이 변경됨

---

## 5. 체크리스트

### Backend API
- [ ] TC-001: 정상 제출 성공
- [ ] TC-002: 재제출 성공
- [ ] TC-003: 지각 제출 허용
- [ ] TC-004: 지각 제출 불허
- [ ] TC-005: 재제출 불가 정책
- [ ] TC-006: 채점 완료 후 재제출 차단
- [ ] TC-007: 강사 재제출 요청 후 허용
- [ ] TC-008: 미등록 학습자 차단
- [ ] TC-009: Draft 과제 차단
- [ ] TC-010: 필수 입력 검증
- [ ] TC-011: URL 형식 검증
- [ ] TC-012: 인증 검증

### Frontend UI
- [ ] UI-001: 초기 렌더링 상태
- [ ] UI-002: 필수 입력 검증
- [ ] UI-003: 유효한 제출
- [ ] UI-004: URL 형식 검증
- [ ] UI-005: API 오류 처리
- [ ] UI-006: 재제출 시나리오
- [ ] UI-007: 로딩 상태 중복 방지

### Database
- [ ] 제출물이 올바르게 저장됨
- [ ] `is_late` 플래그가 정확함
- [ ] 재제출 시 upsert가 정상 작동함
- [ ] `submitted_at`, `updated_at`이 올바르게 갱신됨

---

## 6. 알려진 제한 사항

1. **파일 업로드 미지원**: 현재는 텍스트와 링크만 제출 가능
2. **제출 이력 미관리**: 재제출 시 이전 버전은 보관되지 않음 (덮어쓰기)
3. **과제 페이지 미연결**: `SubmissionForm` 컴포넌트를 실제 과제 페이지에 통합 필요

---

## 7. 다음 단계

QA 완료 후 다음 작업이 필요합니다:

1. 과제 상세 페이지 구현
2. 과제 목록 페이지 구현
3. 제출 상태에 따른 UI 분기 처리
   - 미제출 → SubmissionForm 표시
   - 제출 완료 → 제출 내용 표시 + 재제출 버튼 (정책에 따라)
   - 채점 완료 → 점수 및 피드백 표시
4. 강사용 채점 기능 구현
