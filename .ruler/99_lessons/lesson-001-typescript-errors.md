# Lesson: Preventing TypeScript Errors

This is a summary of critical TypeScript rules learned from a previous incident (`6dd822a`) that caused a full site outage. Follow these to prevent build failures.

--- 

### Rule 1: Do Not Modify Hono Context
- **Problem**: `c.set('user', ...)` causes type errors because `user` is not defined in `AppVariables`.
- **Solution**: **Do not use `c.set()` for arbitrary variables.** Instead, perform authentication directly within each route handler and use the resulting `user` object locally. The only permitted `c.set` operations are for `supabase`, `logger`, and `config` during initial setup.

### Rule 2: Specify Generic Type Arguments
- **Problem**: Using `Promise<HandlerResult>` without type arguments is an error.
- **Solution**: `HandlerResult` requires at least two generic arguments: `Promise<HandlerResult<TData, TCode>>`. Always specify them, e.g., `Promise<HandlerResult<any, string>>`.

### Rule 3: Verify Imports
- **Problem**: Importing a non-existent function/type (`Module has no exported member`).
- **Solution**: Before importing, **verify the export exists in the source file**. Check for correct paths (e.g., `@/lib/utils` vs. `@/lib/remote/api-client`) and correct type names when re-exporting from schemas.

### Rule 4: Use Correct API Client Pattern
- **Problem**: `apiClient.assignments.get()` fails because `apiClient` is a plain `axios` instance, not a typed Hono RPC client.
- **Solution**: This project **does not use Hono RPC client**. Use standard `axios` methods: `apiClient.get('/assignments')`, `apiClient.post(...)`, etc.

### Rule 5: Ensure Schema Field Consistency
- **Problem**: Mismatch between DB column names, Zod schema fields, and frontend form field names.
- **Solution**: All names **must match exactly**. `content_text` in the DB must be `content_text` in the Zod schema and `content_text` in the `<FormField>`.

### Rule 6: Debug 403 Forbidden - Instructor Permission Mismatch
- **Problem**: `403 Forbidden` when accessing instructor-only resources (e.g., `/api/assignments/{id}/submissions`).
- **Root Cause**: Logged-in user's ID doesn't match the `instructor_id` of the resource owner.
- **Common Scenario**: Testing with multiple accounts, switching between instructors, or using stale dummy data.

#### 디버깅 방법
```typescript
// 임시 디버그 로그 추가 (권한 검증 로직)
console.log('[DEBUG] Assignment instructor_id:', assignment.courses.instructor_id);
console.log('[DEBUG] Request instructorId:', instructorId);
console.log('[DEBUG] Match:', assignment.courses.instructor_id === instructorId);
```

#### SQL로 instructor_id 확인
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

#### 해결 방법

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

#### 예방 방법
- 테스트 시 단일 instructor 계정 사용
- SQL로 데이터 생성 시 `instructor_id` 명시적 지정
- 디버그 로그로 권한 검증 확인 후 즉시 제거

#### 403 vs 401 비교
| 상태 코드 | 의미 | 원인 | 해결 |
|-----------|------|------|------|
| **401 Unauthorized** | 인증 실패 | JWT 토큰 누락/만료 | Anon Client + Access Token 패턴 |
| **403 Forbidden** | 권한 부족 | 인증 성공, 리소스 접근 권한 없음 | 올바른 소유자로 로그인, 데이터 정합성 확인 |

---

## Pre-Commit Checklist

1.  **Run Type Check**: `npx tsc --noEmit`
2.  **Fix All Errors**: Ensure zero errors before committing.
3.  **Verify Patterns**: Quickly check your code against the 5 rules above.