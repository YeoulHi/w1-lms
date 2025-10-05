# spec-006 과제 게시 기능 구현 로그

## 📋 개요
- **작업 기간**: 2025-10-05 ~ 2025-10-06
- **주요 기능**: Draft 상태 과제를 Published로 전환
- **추가 기능**: 과제 관리 네비게이션 UI 구축
- **관련 커밋**:
  - `845df3c` - feat: spec-006 구현 완료 - User QA 미완
  - `a988a9f` - feat: spec-006-001 강사 대시보드 구현
  - `aaf2619` - feat: FE spec-006 Instructor - 과제 목록 페이지 구현
  - `4683238` - docs: spec-006 QA 문서작성

## ✅ 구현 완료 사항

### 1. 백엔드 (Hono API)

#### 라우트: `PATCH /api/assignments/:assignmentId/publish`
- **파일 경로**: `c:\Vibe-Mafia\w1-LMS\src\features\assignments\backend\route.ts`
- **라인 번호**: 18-67

#### 인증 패턴: Anon Client + User Access Token
```typescript
// route.ts:23-50
const authHeader = c.req.header('Authorization');
const accessToken = authHeader?.replace('Bearer ', '');

if (!accessToken) {
  return respond(
    c,
    failure(401, 'UNAUTHORIZED', '인증 토큰이 필요합니다.'),
  );
}

const supabase = createAnonClient({
  url: config.supabase.url,
  anonKey: config.supabase.anonKey,
  accessToken,
});

const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
  logger.error('Auth error:', authError?.message || 'No user found');
  return respond(
    c,
    failure(401, 'UNAUTHORIZED', '인증되지 않은 사용자입니다.'),
  );
}
```

**핵심 포인트**:
- ❌ **잘못된 방법**: Service Role Client (`c.get('supabase')`)로 사용자 요청 처리
- ✅ **올바른 방법**: Anon Client + User JWT로 인증
- Authorization 헤더에서 Bearer 토큰 추출
- `createAnonClient`로 사용자 전용 Supabase 클라이언트 생성
- `supabase.auth.getUser()`로 사용자 인증 확인

#### 서비스 로직
- **파일 경로**: `c:\Vibe-Mafia\w1-LMS\src\features\assignments\backend\service.ts`
- **함수명**: `publishAssignmentService`
- **반환 타입**: `HandlerResult<PublishAssignmentResponse, PublishAssignmentErrorCode>`

**핵심 로직 (4단계)**:

1. **과제 조회 + 권한 검증** (service.ts:31-68)
   ```typescript
   // JOIN을 사용해 courses.instructor_id도 함께 조회
   const { data: assignmentRaw, error: assignmentError } = await supabase
     .from('assignments')
     .select(`
       id,
       course_id,
       title,
       description,
       due_date,
       weight,
       late_submission_allowed,
       resubmission_allowed,
       status,
       created_at,
       updated_at,
       courses!assignments_course_id_fkey(
         instructor_id
       )
     `)
     .eq('id', assignmentId)
     .single();
   ```

2. **Zod 스키마 검증** (service.ts:58-62)
   ```typescript
   const assignmentParse = assignmentWithCourseSchema.safeParse(assignmentRaw);

   if (!assignmentParse.success) {
     return failure(500, 'INTERNAL_ERROR', '과제 정보를 확인할 수 없습니다.');
   }
   ```

3. **권한 확인 + 상태 검증** (service.ts:66-72)
   ```typescript
   // instructor_id 일치 확인 (403 Forbidden)
   if (assignment.courses.instructor_id !== instructorId) {
     return failure(403, 'UNAUTHORIZED', '해당 과제를 게시할 권한이 없습니다.');
   }

   // draft 상태 확인 (409 Conflict)
   if (assignment.status !== ASSIGNMENT_STATUS.DRAFT) {
     return failure(409, 'INVALID_STATUS', '이미 처리된 과제입니다.');
   }
   ```

4. **상태 업데이트** (service.ts:74-112)
   ```typescript
   const now = new Date().toISOString();

   const { data: updatedAssignment, error: updateError } = await supabase
     .from('assignments')
     .update({
       status: ASSIGNMENT_STATUS.PUBLISHED,
       updated_at: now,
     })
     .eq('id', assignmentId)
     .select('id, course_id, title, description, ...')
     .single();

   // 응답 데이터 Zod 검증
   const responseParse = publishAssignmentResponseSchema.safeParse(updatedAssignment);

   return success(responseParse.data);
   ```

#### 스키마 정의
- **파일 경로**: `c:\Vibe-Mafia\w1-LMS\src\features\assignments\backend\schema.ts`

```typescript
// schema.ts:3-12
export const assignmentStatusValues = ['draft', 'published', 'closed'] as const;

export const ASSIGNMENT_STATUS = {
  DRAFT: assignmentStatusValues[0],
  PUBLISHED: assignmentStatusValues[1],
  CLOSED: assignmentStatusValues[2],
} as const satisfies Record<string, (typeof assignmentStatusValues)[number]>;

// schema.ts:29-38
export const publishAssignmentResponseSchema = assignmentRowSchema.pick({
  id: true,
  course_id: true,
  status: true,
  updated_at: true,
});
```

### 2. 프론트엔드 (React)

#### React Query Hook: `usePublishAssignment`
- **파일 경로**: `c:\Vibe-Mafia\w1-LMS\src\features\assignments\hooks\usePublishAssignment.ts`

**핵심 패턴**:
```typescript
// usePublishAssignment.ts:34-60
export const usePublishAssignment = (
  assignmentId: string,
  options?: UsePublishAssignmentOptions,
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => publishAssignment(assignmentId),
    onSuccess: (response) => {
      toast({
        title: '게시 완료',
        description: '과제가 게시되었습니다.',
      });
      // 캐시 무효화: 제출물 목록 + 과제 상세
      queryClient.invalidateQueries({ queryKey: ['submissions', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['assignments', assignmentId] });
      // 외부 콜백 실행
      options?.onSuccess?.(response);
    },
    onError: (error: Error) => {
      toast({
        title: '게시 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
```

**중요 사항**:
- `onSuccess` 콜백을 **hook creator에 전달** (mutate()가 아님!)
- 두 개의 쿼리 무효화: 제출물 목록, 과제 상세 정보
- Zod 스키마로 응답 검증 (usePublishAssignment.ts:23)

#### 게시 버튼 컴포넌트: `PublishAssignmentButton`
- **파일 경로**: `c:\Vibe-Mafia\w1-LMS\src\features\assignments\components\PublishAssignmentButton.tsx`

**UI 구성**:
1. **Radix UI AlertDialog** 사용 (shadcn-ui 기반)
2. **버튼 상태**:
   - 평상시: "게시하기"
   - 로딩 중: "게시 중..." + disabled
3. **다이얼로그 내용**:
   - 제목: "과제를 게시할까요?"
   - 설명: "게시 후에는 수강생에게 과제가 공개됩니다. 계속 진행하시겠습니까?"

**핵심 코드**:
```typescript
// PublishAssignmentButton.tsx:25-33
const { mutate: publishAssignment, isPending } = usePublishAssignment(
  assignmentId,
  {
    onSuccess: (response) => {
      setDialogOpen(false);
      onPublished?.(response);
    },
  },
);

// PublishAssignmentButton.tsx:35-42
const handleConfirm = () => {
  publishAssignment();
};

const handleOpenChange = (open: boolean) => {
  if (!isPending) {
    setDialogOpen(open);
  }
};
```

### 3. 네비게이션 개선

#### A. 강사 대시보드: 코스 카드에 "과제 관리" 버튼 추가
- **파일 경로**: `c:\Vibe-Mafia\w1-LMS\src\features\dashboard\components\InstructorDashboard.tsx`
- **라인 번호**: 109-116

```typescript
<div className="flex gap-2">
  <Link href={`/courses/${course.id}`} className="flex-1">
    <Button variant="outline" className="w-full">
      코스 관리
    </Button>
  </Link>
  <Link
    href={`/instructor/courses/${course.id}/assignments`}
    className="flex-1"
  >
    <Button variant="outline" className="w-full">
      과제 관리
    </Button>
  </Link>
</div>
```

**개선 내용**:
- 대시보드에서 바로 과제 목록 페이지로 이동 가능
- "코스 관리" + "과제 관리" 버튼 나란히 배치

#### B. 과제 목록 페이지 신규 생성
- **파일 경로**: `c:\Vibe-Mafia\w1-LMS\src\app\(protected)\instructor\courses\[courseId]\assignments\page.tsx`
- **라우트**: `/instructor/courses/{courseId}/assignments`

**주요 기능**:
1. **Draft/Published 구분 표시**:
   ```typescript
   // page.tsx:37-38
   const draftAssignments = assignments.filter((a) => a.status === 'draft');
   const publishedAssignments = assignments.filter((a) => a.status === 'published');
   ```

2. **섹션별 카운트 표시**:
   ```typescript
   <h2 className="text-2xl font-semibold">초안 ({draftAssignments.length})</h2>
   <h2 className="text-2xl font-semibold">게시됨 ({publishedAssignments.length})</h2>
   ```

3. **상태별 Badge 색상**:
   - Draft: 노란색 (`bg-yellow-100 text-yellow-700`)
   - Published: 초록색 (`bg-green-100 text-green-700`)

#### C. 과제 목록 조회 Hook: `useAssignmentsByCourse`
- **파일 경로**: `c:\Vibe-Mafia\w1-LMS\src\features\assignments\hooks\useAssignmentsByCourse.ts`

```typescript
// useAssignmentsByCourse.ts:20-41
export const useAssignmentsByCourse = (courseId: string) => {
  return useQuery<Assignment[]>({
    queryKey: ['assignments', 'course', courseId],
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    staleTime: 60 * 1000, // 1분
    enabled: Boolean(courseId),
  });
};
```

**특징**:
- Supabase 직접 쿼리 (Hono API 미사용)
- 생성일 기준 내림차순 정렬
- 1분 캐시 유지
- courseId가 있을 때만 쿼리 실행

## 🎯 성공 요인

### 기술적 성공 요인

#### 1. 올바른 인증 패턴 사용
**문제 상황**:
- Service Role Client는 **admin 전용** (RLS 무시)
- 사용자 요청에 Service Role Client를 사용하면 권한 검증이 불가능

**해결 방법**:
```typescript
// ❌ 잘못된 방법 (절대 사용 금지)
const supabase = c.get('supabase'); // Service Role Client
const { data: { user } } = await supabase.auth.getUser(); // 401 에러 발생

// ✅ 올바른 방법
const authHeader = c.req.header('Authorization');
const accessToken = authHeader?.replace('Bearer ', '');

const supabase = createAnonClient({
  url: config.supabase.url,
  anonKey: config.supabase.anonKey,
  accessToken, // 사용자의 JWT 토큰
});

const { data: { user } } = await supabase.auth.getUser(); // 정상 작동
```

**참고 코드**: `c:\Vibe-Mafia\w1-LMS\src\features\assignments\backend\route.ts:23-50`

#### 2. 권한 검증 로직
**2단계 검증**:
```typescript
// 1단계: 과제가 속한 코스의 instructor_id 조회
const { data: assignmentRaw } = await supabase
  .from('assignments')
  .select(`
    id,
    status,
    courses!assignments_course_id_fkey(
      instructor_id  // JOIN으로 instructor_id 조회
    )
  `)
  .eq('id', assignmentId)
  .single();

// 2단계: instructor_id 비교
if (assignment.courses.instructor_id !== instructorId) {
  return failure(403, 'UNAUTHORIZED', '해당 과제를 게시할 권한이 없습니다.');
}
```

**핵심 포인트**:
- JOIN을 사용해 관련 테이블 데이터 함께 조회
- instructor_id 불일치 시 **403 Forbidden** 반환
- 401 (인증 실패) vs 403 (권한 부족) 명확히 구분

**참고 코드**: `c:\Vibe-Mafia\w1-LMS\src\features\assignments\backend\service.ts:31-68`

#### 3. 상태 관리 패턴
**React Query 캐시 무효화**:
```typescript
// usePublishAssignment.ts:48-49
queryClient.invalidateQueries({ queryKey: ['submissions', assignmentId] });
queryClient.invalidateQueries({ queryKey: ['assignments', assignmentId] });
```

**효과**:
- 과제 게시 후 제출물 목록 자동 갱신
- 과제 상세 페이지의 Badge 자동 업데이트
- 수동 새로고침 불필요

#### 4. Zod 스키마 검증
**2단계 검증**:
```typescript
// 1단계: DB 응답 검증
const assignmentParse = assignmentWithCourseSchema.safeParse(assignmentRaw);
if (!assignmentParse.success) {
  return failure(500, 'INTERNAL_ERROR', '과제 정보를 확인할 수 없습니다.');
}

// 2단계: API 응답 검증
const responseParse = publishAssignmentResponseSchema.safeParse(updatedAssignment);
if (!responseParse.success) {
  return failure(500, 'INTERNAL_ERROR', '응답 데이터 검증에 실패했습니다.');
}
```

**장점**:
- 런타임 타입 안전성 보장
- DB 스키마 변경 감지 가능
- 예상치 못한 데이터 구조 방어

### UI/UX 성공 요인

#### 1. 사용자 확인 다이얼로그
**구현 방법**:
- Radix UI AlertDialog 사용
- 명확한 안내 문구 제공
- 취소/확인 버튼으로 실수 방지

**효과**:
- 의도하지 않은 게시 방지
- 사용자 신뢰도 향상

**참고 코드**: `c:\Vibe-Mafia\w1-LMS\src\features\assignments\components\PublishAssignmentButton.tsx:56-79`

#### 2. 즉각적인 피드백
**3단계 피드백**:
1. **로딩 상태**: 버튼 텍스트 "게시 중..." + disabled
2. **성공 토스트**: "과제가 게시되었습니다."
3. **UI 자동 갱신**: Badge 색상 변경 (노란색 → 초록색)

**사용자 경험**:
- 진행 상태 명확히 인지
- 성공/실패 즉시 확인
- 결과 시각적으로 확인

#### 3. 편의성 개선
**대시보드에서 과제 관리 바로 접근**:
```
대시보드 → "과제 관리" 버튼 클릭 → 과제 목록 페이지
```

**과제 목록 페이지 구분**:
- Draft 과제: 상단 섹션
- Published 과제: 하단 섹션
- 각 섹션에 카운트 표시

**효과**:
- 네비게이션 단축 (2클릭 → 1클릭)
- 과제 상태 한눈에 파악 가능

## 📚 주요 참고 코드

### 1. 인증 패턴 (User Request)
```typescript
// src/features/assignments/backend/route.ts:23-50
const authHeader = c.req.header('Authorization');
const accessToken = authHeader?.replace('Bearer ', '');

if (!accessToken) {
  return respond(
    c,
    failure(401, 'UNAUTHORIZED', '인증 토큰이 필요합니다.'),
  );
}

const supabase = createAnonClient({
  url: config.supabase.url,
  anonKey: config.supabase.anonKey,
  accessToken,
});

const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
  logger.error('Auth error:', authError?.message || 'No user found');
  return respond(
    c,
    failure(401, 'UNAUTHORIZED', '인증되지 않은 사용자입니다.'),
  );
}
```

### 2. 서비스 트랜잭션 패턴
```typescript
// src/features/assignments/backend/service.ts:24-113
export async function publishAssignmentService(
  supabase: SupabaseClient,
  assignmentId: string,
  instructorId: string,
): Promise<HandlerResult<PublishAssignmentResponse, PublishAssignmentErrorCode>> {
  // 1. 과제 조회 + 권한 검증
  const { data: assignmentRaw } = await supabase
    .from('assignments')
    .select('..., courses!assignments_course_id_fkey(instructor_id)')
    .eq('id', assignmentId)
    .single();

  // 2. Zod 검증
  const assignmentParse = assignmentWithCourseSchema.safeParse(assignmentRaw);

  // 3. 권한 확인
  if (assignment.courses.instructor_id !== instructorId) {
    return failure(403, 'UNAUTHORIZED', '해당 과제를 게시할 권한이 없습니다.');
  }

  // 4. 상태 확인
  if (assignment.status !== ASSIGNMENT_STATUS.DRAFT) {
    return failure(409, 'INVALID_STATUS', '이미 처리된 과제입니다.');
  }

  // 5. 상태 업데이트
  const { data: updatedAssignment } = await supabase
    .from('assignments')
    .update({ status: ASSIGNMENT_STATUS.PUBLISHED, updated_at: now })
    .eq('id', assignmentId)
    .select('...')
    .single();

  // 6. 응답 검증
  const responseParse = publishAssignmentResponseSchema.safeParse(updatedAssignment);

  return success(responseParse.data);
}
```

### 3. React Query Mutation Hook
```typescript
// src/features/assignments/hooks/usePublishAssignment.ts:34-60
export const usePublishAssignment = (
  assignmentId: string,
  options?: UsePublishAssignmentOptions,
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => publishAssignment(assignmentId),
    onSuccess: (response) => {
      toast({ title: '게시 완료', description: '과제가 게시되었습니다.' });

      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['submissions', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['assignments', assignmentId] });

      // 외부 콜백 실행 (onSuccess를 hook creator에 전달!)
      options?.onSuccess?.(response);
    },
    onError: (error: Error) => {
      toast({
        title: '게시 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
```

**중요**: `onSuccess` 콜백을 `mutate()`가 아닌 **hook creator**에 전달해야 함!

## ⚠️ 주의사항 (Lessons Learned)

### 1. 403 Forbidden 디버깅
**증상**:
- 로그인한 instructor가 과제 게시 시도 시 403 에러 발생
- 백엔드 권한 검증 로직은 정상 작동

**원인**:
- 테스트 중 다른 instructor 계정으로 생성한 과제 데이터 접근
- DB의 `courses.instructor_id`와 요청자의 `user.id` 불일치

**디버깅 방법**:
```typescript
// 임시 디버그 로그 추가 (권한 검증 로직)
console.log('[DEBUG] Assignment instructor_id:', assignment.courses.instructor_id);
console.log('[DEBUG] Request instructorId:', instructorId);
console.log('[DEBUG] Match:', assignment.courses.instructor_id === instructorId);
```

**SQL로 instructor_id 확인**:
```sql
-- 과제 소유자 확인
SELECT
  a.id as assignment_id,
  c.instructor_id,
  u.email as instructor_email
FROM assignments a
JOIN courses c ON a.course_id = c.id
JOIN auth.users u ON c.instructor_id = u.id
WHERE a.id = '{assignment_id}';

-- 현재 로그인한 사용자 확인
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

**해결 방법**:

**방법 1: 올바른 instructor 계정으로 로그인**
```sql
-- 과제 소유자 이메일 확인 후 해당 계정으로 로그인
SELECT email FROM auth.users WHERE id = '{instructor_id_from_course}';
```

**방법 2: 새로운 더미 데이터 생성 (권장)**
- 현재 로그인한 instructor의 course와 assignment 생성
- 깨끗한 데이터로 테스트 진행
- 소유권 불일치 방지

**방법 3: 브라우저 세션 초기화**
- 완전 로그아웃 후 재로그인
- 브라우저 캐시 삭제
- 올바른 instructor 계정으로 새 세션 시작

**예방 방법**:
- 테스트 시 단일 instructor 계정 사용
- SQL로 데이터 생성 시 `instructor_id` 명시적 지정
- 디버그 로그로 권한 검증 확인 후 즉시 제거

**403 vs 401 비교**:
| 상태 코드 | 의미 | 원인 | 해결 |
|-----------|------|------|------|
| **401 Unauthorized** | 인증 실패 | JWT 토큰 누락/만료 | Anon Client + Access Token 패턴 |
| **403 Forbidden** | 권한 부족 | 인증 성공, 리소스 접근 권한 없음 | 올바른 소유자로 로그인, 데이터 정합성 확인 |

### 2. async/await in Client Components
**오류**:
```typescript
// ❌ 잘못된 코드
export default async function InstructorAssignmentsPage() {
  const params = await useParams(); // 오류 발생
  // ...
}
```

**원인**:
- `'use client'` 컴포넌트에서 async 함수 사용 불가
- `useParams()`는 Promise가 아님 (Next.js 13+에서 변경)

**해결**:
```typescript
// ✅ 올바른 코드
'use client';

export default function InstructorAssignmentsPage() {
  const params = useParams(); // 직접 호출
  const courseId = params.courseId as string;
  // ...
}
```

**참고**: `c:\Vibe-Mafia\w1-LMS\src\app\(protected)\instructor\courses\[courseId]\assignments\page.tsx:3-12`

### 3. Toaster 누락
**증상**:
- `useToast()` 호출 시 Toast가 화면에 표시되지 않음
- 콘솔 에러 없음

**원인**:
- `<Toaster />` 컴포넌트가 root layout에 추가되지 않음
- shadcn-ui Toast는 Toaster 컴포넌트 필수

**해결**:
```typescript
// app/layout.tsx
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster /> {/* 필수! */}
      </body>
    </html>
  );
}
```

**참고**: `.ruler/02_frontend/03_styling.md`의 "Shadcn UI Rules" 섹션

### 4. onSuccess 콜백 전달 위치
**잘못된 방법**:
```typescript
// ❌ mutate()에 직접 전달 (전역 onSuccess 무시됨!)
const { mutate } = usePublishAssignment(assignmentId);
mutate(undefined, {
  onSuccess: () => form.reset(), // 전역 onSuccess가 실행 안 됨
});
```

**올바른 방법**:
```typescript
// ✅ hook creator에 전달
const { mutate } = usePublishAssignment(assignmentId, {
  onSuccess: () => form.reset(), // 전역 onSuccess도 함께 실행됨
});
mutate();
```

**이유**:
- `mutate()`에 직접 전달하면 전역 `onSuccess` (toast, 캐시 무효화) 무시됨
- hook creator에 전달하면 전역 + 로컬 콜백 모두 실행

**참고**: `.ruler/02_frontend/03_styling.md`의 "Mutation Hook Callbacks" 섹션

### 5. Service Role vs Anon Client
**핵심 규칙**:
```typescript
// ❌ 절대 사용 금지 (User Request에서)
const supabase = c.get('supabase'); // Service Role Client
const { data: { user } } = await supabase.auth.getUser(); // 401 에러

// ✅ User Request에서 필수
const supabase = createAnonClient({ url, anonKey, accessToken });
const { data: { user } } = await supabase.auth.getUser(); // 정상 작동
```

**Service Role Client 사용 시기**:
- 사용자 회원가입 (admin 작업)
- 시스템 작업 (RLS 무시 필요)
- **절대 User Request에 사용 금지!**

**Anon Client 사용 시기**:
- 모든 사용자 요청 (과제 게시, 제출, 채점 등)
- Authorization 헤더의 JWT 토큰과 함께 사용
- RLS 정책 적용됨

**참고**: `.ruler/03_backend/02_conventions.md`의 "Authentication Pattern" 섹션

## 🔗 관련 문서
- [spec-006 스펙 문서](c:\Vibe-Mafia\w1-LMS\docs\006\spec.md)
- [구현 계획](c:\Vibe-Mafia\w1-LMS\docs\006\plan.md)
- [QA 문서](c:\Vibe-Mafia\w1-LMS\docs\006\QA-spec-006.md)
- [AGENTS.md - Backend Authentication](c:\Vibe-Mafia\w1-LMS\.ruler\03_backend\02_conventions.md)
- [Lesson-001 TypeScript Errors](c:\Vibe-Mafia\w1-LMS\.ruler\99_lessons\lesson-001-typescript-errors.md)

## 📝 다음 작업 시 체크리스트
- [ ] Anon Client + User JWT 인증 패턴 확인
- [ ] instructor_id 권한 검증 로직 구현
- [ ] onSuccess 콜백은 hook creator에 전달
- [ ] Toaster 컴포넌트 추가 확인 (`app/layout.tsx`)
- [ ] 'use client'에서 async/await 사용 금지
- [ ] 403 에러 시 instructor_id 불일치 확인
- [ ] Zod 스키마로 DB 응답 검증
- [ ] React Query 캐시 무효화 (관련 쿼리 모두)
- [ ] Draft → Published 상태 전환만 허용 (409 Conflict)
- [ ] 권한 없는 접근 시 403 Forbidden 반환

## 💡 구현 패턴 요약

### Backend Flow
```
1. Authorization 헤더에서 Bearer 토큰 추출
2. createAnonClient로 사용자 전용 Supabase 클라이언트 생성
3. supabase.auth.getUser()로 사용자 인증 확인
4. Service 레이어 호출 (assignmentId, userId 전달)
5. Service: JOIN으로 instructor_id 조회
6. Service: instructor_id 권한 검증 (403)
7. Service: 상태 검증 (draft만 허용, 409)
8. Service: 상태 업데이트 (draft → published)
9. Service: Zod 스키마 검증
10. respond() 헬퍼로 응답 반환
```

### Frontend Flow
```
1. PublishAssignmentButton 렌더링
2. 사용자가 "게시하기" 버튼 클릭
3. AlertDialog 열림 (확인 요청)
4. 사용자가 "확인" 클릭
5. usePublishAssignment hook의 mutate() 호출
6. API 요청: PATCH /api/assignments/{id}/publish
7. onSuccess: Toast 표시 + 캐시 무효화 + 외부 콜백
8. onError: 에러 Toast 표시
9. UI 자동 갱신 (Badge 색상 변경)
```

### Key Files
- **Backend Route**: `src/features/assignments/backend/route.ts`
- **Backend Service**: `src/features/assignments/backend/service.ts`
- **Backend Schema**: `src/features/assignments/backend/schema.ts`
- **Frontend Hook**: `src/features/assignments/hooks/usePublishAssignment.ts`
- **Frontend Component**: `src/features/assignments/components/PublishAssignmentButton.tsx`
- **Dashboard**: `src/features/dashboard/components/InstructorDashboard.tsx`
- **Assignments Page**: `src/app/(protected)/instructor/courses/[courseId]/assignments/page.tsx`
- **Assignments List Hook**: `src/features/assignments/hooks/useAssignmentsByCourse.ts`
