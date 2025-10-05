---
title: "spec-003-002: Toast 메시지 미표시 이슈 해결"
date: "2025-10-05"
issue: "강의 생성 성공 시 Toast 메시지가 표시되지 않음"
root_cause: "렌더링 트리에 <Toaster /> 컴포넌트가 마운트되지 않음"
---

## 상세 내용

### 증상
- Q4 테스트에서 "강의가 성공적으로 생성되었습니다." 토스트 메시지가 표시되지 않음
- 입력 필드 초기화는 정상 작동
- API 호출은 200 OK 성공 응답

### 디버깅 과정

#### 첫 번째 시도: `onSuccess` 콜백 덮어쓰기
- **문제**: `CreateCourseForm.tsx`에서 `mutate(data, { onSuccess })` 로컬 콜백이 hook의 `onSuccess`를 덮어쓰는 문제 발견.
- **해결**: hook에 콜백 파라미터 추가 `useCreateCourse(onSuccessCallback?: () => void)`.
- **관련 파일**:
    - `src/features/courses/hooks/useCreateCourse.ts:18-38`
    - `src/features/courses/components/CreateCourseForm.tsx:19-32`

#### 두 번째 시도: 변수 호이스팅 오류
- **문제**: `useCreateCourse(() => form.reset())`가 `form` 선언보다 먼저 호출됨.
- **해결**: 선언 순서 변경 (`form` → hook → `onSubmit`).

#### 근본 원인 발견: `<Toaster />` 컴포넌트 누락
- **원인**: `shadcn-ui`의 toast는 `useToast()` hook과 `<Toaster />` 컴포넌트 두 가지 모두 필요. `useToast()`는 상태 관리만 하고, 실제 UI 렌더링은 `<Toaster />`가 담당.
- **해결**: `src/app/layout.tsx`에 `<Toaster />` 추가.

### 최종 해결책
```tsx:src/app/layout.tsx
// src/app/layout.tsx
import { Toaster } from "@/components/ui/toaster";

export default async function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <CurrentUserProvider initialState={currentUser}>
            {children}
          </CurrentUserProvider>
          <Toaster /> {/* ← 추가 */}
        </Providers>
      </body>
    </html>
  );
}
```

### 영향받은 파일
- `src/app/layout.tsx` (Toaster 컴포넌트 추가)
- `src/features/courses/hooks/useCreateCourse.ts` (콜백 파라미터 추가)
- `src/features/courses/components/CreateCourseForm.tsx` (변수 선언 순서 수정)

### 검증 결과
- ✅ Q2: 빈 제목 검증 정상 작동
- ✅ Q3: 로딩 상태 정상 표시
- ✅ Q4: 성공 토스트 메시지 정상 표시
- ✅ 입력 필드 초기화 정상 작동