---
title: "spec-005 Task-001: 과제 제출 목록 및 채점 페이지 QA 준비 완료"
date: "2025-10-06"
status: "완료"
related_specs: ["spec-005"]
---

## 목표
spec-005 과제 채점 및 피드백 기능의 QA 테스트를 위한 환경 구축 및 초기 문제 해결

## 발생한 문제들

### 1. TypeScript 컴파일 에러 (이미 문서화됨)
- **참조 문서**: `.ruler/99_lessons/lesson-001-typescript-errors.md`
- **해결 방법**: `git reset --hard` 로 깨끗한 상태로 복원
- **근본 원인**: 초기 구현 중 타입 정의 오류

### 2. 403 Forbidden 오류 - instructor_id 불일치
- **참조 문서**: `docs/log/spec-005-002-submissions-403-fix.md`
- **증상**: 강사가 과제 제출 목록 페이지 접근 시 권한 없음 오류
- **근본 원인**:
  - 로그인한 강사 ID: `d3e4f5g6-h7i8-9j0k-1l2m-3n4o5p6q7r8s` (duwlswls22@gmail.com)
  - 과제 소유자 ID: `f6bd37bb-e82e-4bb3-83d9-07eb3b1ebe28` (다른 강사)
  - 여러 계정으로 테스트하며 생성한 더미 데이터의 소유권 불일치

### 3. React Query undefined 데이터 에러
- **증상**: `Cannot read property 'course_id' of undefined`
- **원인**: 데이터 로딩 중 안전하지 않은 접근 (`data.assignment.course_id`)
- **해결**: Optional chaining 및 fallback 값 적용 (`data?.assignment?.course_id || ''`)

## 적용한 솔루션

### 1. Git Reset으로 클린 상태 복원
```bash
git reset --hard HEAD~1
```
- 타입 에러가 있는 커밋 제거
- 안정적인 상태로 복원

### 2. 깨끗한 테스트 데이터 생성
**대상 계정**: `duwlswls22@gmail.com`

```sql
-- 1. 새로운 강의 생성
INSERT INTO courses (title, description, instructor_id, status)
VALUES (
  '프로그래밍 기초',
  '초보자를 위한 프로그래밍 입문 강의',
  'd3e4f5g6-h7i8-9j0k-1l2m-3n4o5p6q7r8s',
  'published'
);

-- 2. 과제 생성
INSERT INTO assignments (
  course_id, title, content_text, max_score,
  due_date, status, allow_late_submission
)
VALUES (...);

-- 3. 학생 수강 신청 및 과제 제출
INSERT INTO enrollments (...);
INSERT INTO submissions (...);
```

### 3. React Query 안전한 데이터 접근
```typescript
// ❌ Before
const courseId = data.assignment.course_id;

// ✅ After
const courseId = data?.assignment?.course_id || '';
```

### 4. 디버그 로그를 통한 문제 확인
```typescript
// 임시 추가하여 원인 파악
console.log('[DEBUG] Assignment instructor_id:', assignment.courses.instructor_id);
console.log('[DEBUG] Request instructorId:', instructorId);

// 문제 해결 후 제거
```

## 현재 상태

### ✅ 완료된 항목
1. 타입스크립트 컴파일 에러 해결
2. 403 Forbidden 권한 오류 해결
3. React Query 데이터 접근 안정화
4. 페이지 로딩 성공 (200 OK)
5. 과제 제출 목록 정상 표시
6. 학생 정보 및 제출 내용 렌더링 확인

### ⏳ 테스트 대기 중
1. **채점 기능**:
   - 점수 입력 폼
   - 피드백 입력
   - 채점 완료 처리
   - 데이터베이스 업데이트 확인

2. **재제출 요청 기능**:
   - 재제출 요청 버튼
   - 재제출 사유 입력
   - 학생에게 알림 전달 (구현 여부 확인)

### 테스트 URL
```
http://localhost:3000/instructor/courses/{course_id}/assignments/{assignment_id}
```

## 학습한 교훈

### 1. 403 vs 401 구분의 중요성
| 에러 | 의미 | 디버깅 방법 |
|------|------|-------------|
| 401 | 인증 실패 | Authorization 헤더, JWT 토큰, Supabase 클라이언트 타입 확인 |
| 403 | 권한 부족 | DB 소유권 확인, instructor_id 불일치 점검 |

### 2. 디버그 로그의 전략적 사용
- **추가 시점**: 권한 검증 로직에서 불일치 의심
- **로그 내용**: 비교되는 ID 값 모두 출력
- **제거 시점**: 문제 확인 즉시 (커밋 전 필수)

### 3. 테스트 데이터 관리 원칙
- 단일 계정으로 일관된 데이터 생성
- 소유권 명확한 더미 데이터 유지
- 여러 계정 테스트 시 데이터 분리

### 4. React Query 안전한 데이터 접근
- 항상 optional chaining 사용 (`?.`)
- Fallback 값 제공으로 런타임 에러 방지
- 로딩 상태에서 `undefined` 고려

### 5. Git을 활용한 빠른 복구
- 타입 에러가 많을 때 `git reset` 고려
- 안정적인 지점으로 돌아가 재작업
- 점진적 구현으로 에러 범위 최소화

## 다음 단계

### 즉시 진행
1. **채점 기능 QA 테스트**:
   - 점수 입력 및 저장
   - 피드백 작성
   - 채점 완료 상태 변경

2. **재제출 요청 QA 테스트**:
   - 버튼 동작 확인
   - 사유 입력 및 제출
   - 학생 과제 상태 변경 확인

### 추가 개선 사항
1. **에러 처리 개선**:
   - 403 에러 시 사용자 친화적 메시지
   - 권한 없음 안내 페이지 리다이렉트

2. **로딩 상태 UX 개선**:
   - Skeleton UI 추가
   - 제출 목록 로딩 인디케이터

3. **테스트 데이터 자동화**:
   - Seed 스크립트 작성
   - 일관된 테스트 환경 구축

## 관련 문서
- `docs/log/spec-005-002-submissions-403-fix.md`: 403 에러 상세 해결 과정
- `.ruler/99_lessons/lesson-001-typescript-errors.md`: Rule 6 추가 (403 디버깅)
- `docs/005/dummy-data-script.md`: 테스트 데이터 생성 스크립트
- `docs/log/spec-004-001-enrollment-401-fix.md`: 401 에러 해결 참조
