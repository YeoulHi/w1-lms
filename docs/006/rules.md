# spec-006 과제 게시 기능 구현 규칙

> 이 문서는 spec-006 작업에서 얻은 교훈을 바탕으로 작성되었습니다.
> 다음 유사한 작업(상태 전환, 권한 검증 등)에 **바로 적용 가능한 규칙**입니다.

---

## 📌 핵심 규칙 (Must Follow)

### Rule 1: 사용자 요청 인증 패턴

**적용 시기**: 사용자 본인의 요청을 처리하는 모든 API (과제 제출, 게시, 수정 등)

#### ✅ 올바른 패턴 (Anon Client + User JWT)

```typescript
// Step 1: Authorization 헤더에서 토큰 추출
const authHeader = c.req.header('Authorization');
const accessToken = authHeader?.replace('Bearer ', '');

if (!accessToken) {
  return respond(c, failure(401, 'UNAUTHORIZED', '인증 토큰이 필요합니다.'));
}

// Step 2: Anon Client 생성 (User JWT 포함)
const supabase = createAnonClient({
  url: config.supabase.url,
  anonKey: config.supabase.anonKey,
  accessToken,
});

// Step 3: 사용자 인증
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  return respond(c, failure(401, 'UNAUTHORIZED', '인증되지 않은 사용자입니다.'));
}

// Step 4: user.id를 서비스에 전달
const result = await someService(supabase, user.id, ...);
```

#### ❌ 잘못된 패턴 (Service Role Client)

```typescript
// 절대 금지: Service Role Client로 사용자 요청 처리
const supabase = c.get('supabase'); // ❌ 이건 Admin 전용!
const { data: { user } } = await supabase.auth.getUser(); // ❌ 항상 null 반환
```

**참고 문서**: `.ruler/03_backend/02_conventions.md` Authentication Pattern

---

### Rule 2: Instructor 권한 검증 패턴

**적용 시기**: Instructor 전용 리소스 접근 (과제 게시, 코스 수정, 제출물 채점 등)

#### 권한 검증 로직

```typescript
// 1. 리소스 조회 시 JOIN으로 instructor_id 함께 가져오기
const { data: assignment } = await supabase
  .from('assignments')
  .select(`
    id,
    status,
    courses!inner (
      instructor_id
    )
  `)
  .eq('id', assignmentId)
  .single();

// 2. instructor_id 확인
if (assignment.courses.instructor_id !== instructorId) {
  return failure(403, 'FORBIDDEN', '권한이 없습니다.');
}
```

#### 403 vs 401 구분

| 상태 코드 | 의미 | 원인 | 반환 시점 |
|-----------|------|------|-----------|
| **401 Unauthorized** | 인증 실패 | JWT 토큰 누락/만료 | `supabase.auth.getUser()` 실패 시 |
| **403 Forbidden** | 권한 부족 | 인증 성공, 리소스 접근 권한 없음 | `instructor_id !== user.id` 시 |

---

### Rule 3: 상태 전환 검증 패턴

**적용 시기**: 엔티티 상태를 변경하는 모든 API (draft → published, submitted → graded 등)

#### 상태 전환 로직

```typescript
// 1. 현재 상태 확인
if (assignment.status !== 'draft') {
  return failure(400, 'INVALID_STATUS', '초안 상태의 과제만 게시할 수 있습니다.');
}

// 2. 상태 업데이트
const { data: updated } = await supabase
  .from('assignments')
  .update({ status: 'published', updated_at: new Date().toISOString() })
  .eq('id', assignmentId)
  .select()
  .single();

// 3. Zod 스키마로 응답 검증
const parsed = publishAssignmentResponseSchema.safeParse(updated);
if (!parsed.success) {
  return failure(500, 'DB_VALIDATION_ERROR', 'DB 응답 검증 실패');
}

return success(parsed.data);
```

#### 상태 전환 체크리스트
- [ ] 현재 상태가 전환 가능한 상태인가?
- [ ] `updated_at` 필드도 함께 업데이트했는가?
- [ ] Zod 스키마로 응답을 검증했는가?

---

### Rule 4: React Query Mutation Hook 패턴

**적용 시기**: POST/PATCH/DELETE API를 호출하는 모든 Hook

#### ✅ 올바른 콜백 전달 (Hook Creator)

```typescript
// Hook 정의
export const usePublishAssignment = (onPublished?: () => void) => {
  return useMutation({
    mutationFn: async (assignmentId: string) => { ... },
    onSuccess: () => {
      toast({ title: '과제가 게시되었습니다.' });
      onPublished?.(); // ✅ Hook creator의 콜백 실행
    },
  });
};

// Hook 사용
const { mutate } = usePublishAssignment(() => {
  void refetch(); // ✅ 캐시 갱신
});

mutate(assignmentId); // ✅ 별도 콜백 전달 안 함
```

#### ❌ 잘못된 콜백 전달 (mutate 함수)

```typescript
const { mutate } = usePublishAssignment();

mutate(assignmentId, {
  onSuccess: () => { ... } // ❌ 글로벌 onSuccess 덮어씀 (토스트 안 뜸)
});
```

**참고 문서**: `.ruler/02_frontend/03_styling.md` Mutation Hook Callbacks

---

### Rule 5: UI 피드백 필수 요소

**적용 시기**: 모든 사용자 액션 (버튼 클릭, 폼 제출 등)

#### 필수 구현 요소

1. **로딩 상태**
   ```tsx
   <Button disabled={isPending}>
     {isPending ? '게시 중...' : '게시하기'}
   </Button>
   ```

2. **성공 피드백**
   ```typescript
   onSuccess: () => {
     toast({ title: '과제가 게시되었습니다.' });
   }
   ```

3. **에러 피드백**
   ```typescript
   onError: (error) => {
     toast({
       title: '게시 실패',
       description: extractApiErrorMessage(error),
       variant: 'destructive',
     });
   }
   ```

4. **Toaster 컴포넌트**
   - `app/layout.tsx`에 `<Toaster />` 필수 추가
   - 없으면 토스트가 표시되지 않음

---

## 🐛 디버깅 체크리스트

### 403 Forbidden 발생 시

1. **instructor_id 확인**
   ```sql
   -- 리소스 소유자 확인
   SELECT a.id, c.instructor_id, u.email
   FROM assignments a
   JOIN courses c ON a.course_id = c.id
   JOIN auth.users u ON c.instructor_id = u.id
   WHERE a.id = '{assignment_id}';
   ```

2. **로그인 계정 확인**
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
   ```

3. **해결 방법**
   - 올바른 instructor 계정으로 로그인
   - 또는 현재 계정의 데이터로 새로운 더미 생성

### Toast가 안 보일 때

1. `layout.tsx`에 `<Toaster />` 있는지 확인
2. `onSuccess` 콜백을 `mutate()`가 아닌 **hook creator**에 전달했는지 확인

### async/await 에러 (Client Component)

```tsx
// ❌ 잘못된 패턴
'use client';
export default async function Page() {
  const params = await useParams(); // 에러!
}

// ✅ 올바른 패턴
'use client';
export default function Page() {
  const params = useParams(); // params는 이미 객체
}
```

---

## 📋 Pre-Commit 체크리스트

구현 완료 후 **반드시 확인**:

- [ ] **인증 패턴**: Anon Client + User JWT 사용 (Service Role 금지)
- [ ] **권한 검증**: instructor_id 확인 로직 구현
- [ ] **상태 검증**: 현재 상태가 전환 가능한지 확인
- [ ] **Zod 검증**: DB 응답을 Zod 스키마로 검증
- [ ] **콜백 전달**: `onSuccess`는 hook creator에 전달
- [ ] **UI 피드백**: 로딩/성공/에러 상태 모두 구현
- [ ] **Toaster 추가**: `layout.tsx`에 `<Toaster />` 확인
- [ ] **TypeScript**: `npx tsc --noEmit` 에러 없음
- [ ] **테스트**: 올바른 계정으로 기능 동작 확인

---

## 🔗 관련 규칙 문서

- [`.ruler/03_backend/02_conventions.md`](../../.ruler/03_backend/02_conventions.md) - 백엔드 컨벤션
- [`.ruler/99_lessons/lesson-001-typescript-errors.md`](../../.ruler/99_lessons/lesson-001-typescript-errors.md) - TypeScript 규칙
- [`docs/006/implementation-log.md`](./implementation-log.md) - spec-006 구현 로그

---

## 📝 다음 작업 시 적용 가이드

### 유사 작업 예시 (이 규칙 적용 대상)

1. **과제 마감 (published → closed)**
   - Rule 1: Anon Client 인증
   - Rule 2: Instructor 권한 검증
   - Rule 3: 상태 전환 검증

2. **제출물 재제출 요청 (graded → resubmission_required)**
   - Rule 1: Anon Client 인증
   - Rule 2: Instructor 권한 검증
   - Rule 3: 상태 전환 검증
   - Rule 4: React Query Hook
   - Rule 5: UI 피드백

3. **코스 게시 (draft → published)**
   - 모든 Rule 적용 동일

### 적용 순서

1. **백엔드 구현** (Rule 1, 2, 3)
   - 인증 → 권한 검증 → 상태 전환 → Zod 검증

2. **프론트엔드 구현** (Rule 4, 5)
   - React Query Hook → UI 피드백 → Toaster 확인

3. **테스트 및 검증** (디버깅 체크리스트)
   - TypeScript 에러 확인 → 기능 테스트 → Pre-Commit 체크

---

## 💡 완전한 구현 템플릿

### Backend Route Template

```typescript
// src/features/{feature}/backend/route.ts

import { Hono } from 'hono';
import { createAnonClient } from '@/lib/supabase/anon-client';
import { respond, failure } from '@/backend/hono/response';
import { yourService } from './service';

const app = new Hono();

app.patch('/:id/action', async (c) => {
  const config = c.get('config');
  const logger = c.get('logger');

  // 1. 인증 (Anon Client + User JWT)
  const authHeader = c.req.header('Authorization');
  const accessToken = authHeader?.replace('Bearer ', '');

  if (!accessToken) {
    return respond(c, failure(401, 'UNAUTHORIZED', '인증 토큰이 필요합니다.'));
  }

  const supabase = createAnonClient({
    url: config.supabase.url,
    anonKey: config.supabase.anonKey,
    accessToken,
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.error('Auth error:', authError?.message || 'No user found');
    return respond(c, failure(401, 'UNAUTHORIZED', '인증되지 않은 사용자입니다.'));
  }

  // 2. 요청 파라미터 추출
  const { id } = c.req.param();

  // 3. 서비스 호출
  const result = await yourService(supabase, id, user.id);

  // 4. 응답 반환
  return respond(c, result);
});

export default app;
```

### Backend Service Template

```typescript
// src/features/{feature}/backend/service.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { HandlerResult, success, failure } from '@/backend/hono/response';
import { yourResponseSchema } from './schema';

type YourResponse = z.infer<typeof yourResponseSchema>;
type YourErrorCode = 'UNAUTHORIZED' | 'INVALID_STATUS' | 'NOT_FOUND' | 'INTERNAL_ERROR';

export async function yourService(
  supabase: SupabaseClient,
  resourceId: string,
  userId: string,
): Promise<HandlerResult<YourResponse, YourErrorCode>> {
  // 1. 리소스 조회 + JOIN으로 소유자 정보 함께 가져오기
  const { data: resource, error: fetchError } = await supabase
    .from('your_table')
    .select(`
      id,
      status,
      parent_table!your_table_parent_id_fkey (
        owner_id
      )
    `)
    .eq('id', resourceId)
    .single();

  if (fetchError || !resource) {
    return failure(404, 'NOT_FOUND', '리소스를 찾을 수 없습니다.');
  }

  // 2. Zod 스키마 검증
  const parsed = resourceWithParentSchema.safeParse(resource);
  if (!parsed.success) {
    return failure(500, 'INTERNAL_ERROR', 'DB 응답 검증 실패');
  }

  // 3. 권한 검증
  if (parsed.data.parent_table.owner_id !== userId) {
    return failure(403, 'UNAUTHORIZED', '권한이 없습니다.');
  }

  // 4. 상태 검증
  if (parsed.data.status !== 'draft') {
    return failure(409, 'INVALID_STATUS', '상태 전환이 불가능합니다.');
  }

  // 5. 상태 업데이트
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from('your_table')
    .update({
      status: 'published',
      updated_at: now,
    })
    .eq('id', resourceId)
    .select()
    .single();

  if (updateError || !updated) {
    return failure(500, 'INTERNAL_ERROR', '업데이트에 실패했습니다.');
  }

  // 6. 응답 검증
  const responseParsed = yourResponseSchema.safeParse(updated);
  if (!responseParsed.success) {
    return failure(500, 'INTERNAL_ERROR', '응답 검증 실패');
  }

  return success(responseParsed.data);
}
```

### Frontend Hook Template

```typescript
// src/features/{feature}/hooks/useYourAction.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/remote/api-client';
import { yourResponseSchema } from '../lib/dto';

interface UseYourActionOptions {
  onSuccess?: (response: YourResponse) => void;
}

export const useYourAction = (
  resourceId: string,
  options?: UseYourActionOptions,
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch(`/your-endpoint/${resourceId}`);
      const parsed = yourResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new Error('응답 검증 실패');
      }

      return parsed.data;
    },
    onSuccess: (response) => {
      // 1. 토스트 표시
      toast({
        title: '성공',
        description: '작업이 완료되었습니다.',
      });

      // 2. 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['resources', resourceId] });

      // 3. 외부 콜백 실행
      options?.onSuccess?.(response);
    },
    onError: (error: Error) => {
      toast({
        title: '실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
```

### Frontend Component Template

```tsx
// src/features/{feature}/components/YourActionButton.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useYourAction } from '../hooks/useYourAction';

interface YourActionButtonProps {
  resourceId: string;
  onSuccess?: () => void;
}

export function YourActionButton({ resourceId, onSuccess }: YourActionButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { mutate, isPending } = useYourAction(resourceId, {
    onSuccess: () => {
      setDialogOpen(false);
      onSuccess?.();
    },
  });

  const handleConfirm = () => {
    mutate();
  };

  const handleOpenChange = (open: boolean) => {
    if (!isPending) {
      setDialogOpen(open);
    }
  };

  return (
    <AlertDialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button disabled={isPending}>
          {isPending ? '처리 중...' : '실행하기'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>작업을 진행할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            이 작업을 수행하시겠습니까?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            확인
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

## 🚀 빠른 시작 가이드

새로운 상태 전환 기능을 구현할 때 **5단계 체크리스트**:

### 1단계: 백엔드 인증 (5분)
- [ ] `Authorization` 헤더에서 Bearer 토큰 추출
- [ ] `createAnonClient`로 Anon Client 생성
- [ ] `supabase.auth.getUser()`로 사용자 인증

### 2단계: 백엔드 권한 검증 (10분)
- [ ] JOIN으로 소유자 정보 조회
- [ ] `owner_id !== user.id` 확인
- [ ] 403 Forbidden 반환

### 3단계: 백엔드 상태 전환 (10분)
- [ ] 현재 상태 확인
- [ ] `updated_at` 포함 업데이트
- [ ] Zod 스키마 검증

### 4단계: 프론트엔드 Hook (10분)
- [ ] `useMutation` 정의
- [ ] `onSuccess`에 toast + 캐시 무효화
- [ ] `onError`에 에러 toast

### 5단계: 프론트엔드 UI (15분)
- [ ] AlertDialog로 확인 다이얼로그
- [ ] 로딩 상태 표시
- [ ] `layout.tsx`에 `<Toaster />` 확인

**총 소요 시간**: 약 50분
