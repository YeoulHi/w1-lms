# 과제 채점 및 피드백 기능 구현 완료

## 구현 개요

spec-005에 명시된 과제 채점 및 재제출 요청 기능을 완전히 구현했습니다.

## 구현된 파일

### Backend

1. **`src/features/submissions/backend/schema.ts`**
   - 채점 요청/응답 Zod 스키마 정의
   - `gradeSubmissionRequestSchema`: 점수(0-100), 피드백(필수) 검증
   - `gradeSubmissionResponseSchema`: 제출물 응답 데이터 검증

2. **`src/features/submissions/backend/service.ts`**
   - `gradeSubmissionService`: 채점 비즈니스 로직
     - 제출물 조회
     - 강사 권한 검증 (해당 코스 소유자만 채점 가능)
     - 이미 채점된 과제 재채점 방지 (409 Conflict)
     - 점수/피드백 저장 및 상태를 'graded'로 변경
   - `requestResubmissionService`: 재제출 요청 로직
     - 제출물 조회
     - 강사 권한 검증
     - 상태를 'resubmission_required'로 변경

3. **`src/features/submissions/backend/route.ts`**
   - `PATCH /submissions/:id`: 채점 엔드포인트
   - `PATCH /submissions/:id/request-resubmission`: 재제출 요청 엔드포인트
   - Anon client + access token 패턴으로 사용자 인증
   - 요청 검증 및 서비스 호출

4. **`src/backend/hono/app.ts`** (수정)
   - `registerSubmissionsRoutes` 라우트 등록

### Frontend

5. **`src/features/submissions/lib/dto.ts`**
   - 백엔드 스키마 타입 재수출

6. **`src/features/submissions/hooks/useGradeSubmission.ts`**
   - 채점 API 호출 `useMutation` 훅
   - 성공 시: 토스트 메시지, 쿼리 무효화, 콜백 실행
   - 실패 시: 에러 토스트 표시

7. **`src/features/submissions/hooks/useRequestResubmission.ts`**
   - 재제출 요청 API 호출 `useMutation` 훅
   - 성공 시: 토스트 메시지, 쿼리 무효화, 콜백 실행
   - 실패 시: 에러 토스트 표시

8. **`src/features/submissions/components/GradeSubmissionForm.tsx`**
   - react-hook-form + zodResolver로 폼 관리
   - 점수 입력 (0-100 범위 검증)
   - 피드백 입력 (필수)
   - 채점 완료 버튼
   - 재제출 요청 버튼
   - 로딩 상태 처리 (isPending)

## 구현된 비즈니스 룰

✅ **채점 권한**: 해당 코스를 소유한 Instructor만 제출물 채점 가능
✅ **점수 범위**: 0-100 사이의 정수만 허용
✅ **피드백 필수**: 채점 시 피드백 텍스트 필수 입력
✅ **상태 관리**:
   - 채점 완료 시 상태 → `graded`
   - 재제출 요청 시 상태 → `resubmission_required`
✅ **단순성 원칙**: 재채점 불가 (이미 채점된 과제는 409 Conflict 반환)

## API 엔드포인트

### 1. 과제 채점
```
PATCH /api/submissions/:id
Authorization: Bearer {access_token}

Request Body:
{
  "score": 85,
  "feedback": "잘했습니다. 다음에는 더 자세한 설명을 추가해보세요."
}

Response (200 OK):
{
  "data": {
    "id": "uuid",
    "assignment_id": "uuid",
    "learner_id": "uuid",
    "submitted_at": "2025-01-01T00:00:00.000Z",
    "content_text": "...",
    "content_link": null,
    "status": "graded",
    "is_late": false,
    "score": 85,
    "feedback": "잘했습니다...",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
}
```

### 2. 재제출 요청
```
PATCH /api/submissions/:id/request-resubmission
Authorization: Bearer {access_token}

Response (200 OK):
{
  "data": {
    ...
    "status": "resubmission_required",
    ...
  }
}
```

## 에러 처리

| 에러 코드 | 상태 | 설명 |
|----------|------|------|
| UNAUTHORIZED | 401 | 인증 토큰이 없거나 유효하지 않음 |
| INVALID_REQUEST_BODY | 400 | 요청 데이터가 스키마와 맞지 않음 (점수 범위, 피드백 필수) |
| SUBMISSION_NOT_FOUND | 404 | 제출물을 찾을 수 없음 |
| UNAUTHORIZED | 403 | 해당 제출물을 채점할 권한이 없음 (다른 코스의 강사) |
| ALREADY_GRADED | 409 | 이미 채점이 완료된 과제 (재채점 불가) |
| INTERNAL_ERROR | 500 | 서버 내부 오류 |

## 검증 완료

✅ TypeScript 타입 체크: `npx tsc --noEmit` 통과
✅ ESLint: `npm run lint` 통과
✅ Production Build: `npm run build` 성공

## 사용 예시

```tsx
import { GradeSubmissionForm } from '@/features/submissions/components/GradeSubmissionForm';

export default function SubmissionDetailPage({ submissionId }: { submissionId: string }) {
  return (
    <div>
      <h1>과제 채점</h1>
      <GradeSubmissionForm
        submissionId={submissionId}
        onSuccess={() => console.log('채점 완료!')}
      />
    </div>
  );
}
```

## QA 체크리스트

### 폼 상태
- [x] 초기 렌더링 시 점수와 피드백 필드가 비어있음
- [x] 채점 완료 및 재제출 요청 버튼이 활성화됨

### 유효성 검사
- [x] 점수 100 초과 시 "점수는 100점 이하여야 합니다." 에러 표시
- [x] 점수 0 미만 시 "점수는 0점 이상이어야 합니다." 에러 표시
- [x] 피드백 비어있을 시 "피드백은 필수입니다." 에러 표시
- [x] 유효성 검사 실패 시 API 호출되지 않음

### 채점 동작
- [x] 유효한 값으로 "채점 완료" 클릭 시 버튼 비활성화 및 로딩 상태 표시
- [x] 성공 시 "채점이 완료되었습니다." 토스트 표시
- [x] 성공 시 폼 초기화 (reset)
- [x] 성공 시 관련 쿼리 무효화 (submissions)

### 재제출 요청
- [x] "재제출 요청" 버튼 클릭 시 버튼 비활성화 및 로딩 상태 표시
- [x] 성공 시 "재제출을 요청했습니다." 토스트 표시
- [x] 성공 시 폼 초기화 및 쿼리 무효화

### 권한 검증
- [x] 다른 코스의 강사가 채점 시도 시 403 Forbidden 응답
- [x] 인증되지 않은 사용자 접근 시 401 Unauthorized 응답

### 상태 전환 검증
- [x] 이미 채점된 과제 재채점 시도 시 409 Conflict 응답

## 다음 단계

이 기능을 실제 페이지에 통합하려면:
1. Instructor 대시보드에서 제출물 목록 조회 페이지 생성
2. 각 제출물에 대해 `GradeSubmissionForm` 컴포넌트 사용
3. 필요시 제출물 조회 API 및 훅 추가 (`useSubmissions`, `useSubmission` 등)
