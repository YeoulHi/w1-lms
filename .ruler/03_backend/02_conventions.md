# Backend Conventions

## Service Pattern
- **Return Type**: `HandlerResult<Data, ErrorCode, Details>`.
- **Helpers**: Use `success(data)` and `failure(status, code, message)`.
- **Transactions**: Ensure atomicity. Roll back changes on failure.
- **Validation**: Validate DB responses with Zod's `safeParse()`.
- **Defaults**: The service layer, not the client, sets system-generated values (e.g., `owner_id`, `status`).

### State Transition Validation
- **Check Current State**: Before changing an entity's state, verify it's in a valid initial state (e.g., `draft` before `published`).
- **Update Timestamp**: Always update the `updated_at` field along with the status.
- **Verify Response**: Use a Zod schema to validate the shape of the data returned from the database after the update.

```typescript
// 1. 현재 상태 확인
if (assignment.status !== 'draft') {
  return failure(400, 'INVALID_STATUS', '초안 상태의 과제만 게시할 수 있습니다.');
}

// 2. 상태 및 updated_at 업데이트
const { data: updated } = await supabase
  .from('assignments')
  .update({ status: 'published', updated_at: new Date().toISOString() })
  .eq('id', assignmentId)
  .select()
  .single();

// 3. Zod 스키마로 DB 응답 검증
const parsed = publishAssignmentResponseSchema.safeParse(updated);
if (!parsed.success) {
  return failure(500, 'DB_VALIDATION_ERROR', 'DB 응답 검증 실패');
}
```

## Route Pattern
- **Validation**: Use `safeParse()` for request bodies/params.
- **Response**: Use the `respond(c, result)` helper.
- **Authorization**: Enforce role-based access control at the route layer, before the service is called.

### Instructor Authorization
For instructor-only resources, verify the authenticated user's ID matches the `instructor_id` associated with the resource.

```typescript
// 1. 리소스 조회 시 JOIN으로 instructor_id 함께 가져오기
const { data: resource } = await supabase
  .from('assignments')
  .select(`id, courses!inner(instructor_id)`)
  .eq('id', assignmentId)
  .single();

// 2. instructor_id 와 요청자 ID 비교
if (resource.courses.instructor_id !== user.id) {
  return failure(403, 'FORBIDDEN', '권한이 없습니다.');
}
```

| Status Code | Meaning | Cause | When to Return |
|---|---|---|---|
| **401 Unauthorized** | Authentication Failed | Missing/Invalid JWT | `supabase.auth.getUser()` fails |
| **403 Forbidden** | Authorization Failed | User is authenticated but lacks permission for the resource | `resource.owner_id !== user.id` |


## Authentication Pattern

- **User Requests (e.g., course enrollment, submissions)**:
  All user-facing API endpoints must authenticate requests using an **Anon Client** initialized with the user's JWT.

  ```typescript
  // 1. Extract Bearer token from Authorization header
  const authHeader = c.req.header('Authorization');
  const accessToken = authHeader?.replace('Bearer ', '');

  if (!accessToken) {
    return respond(c, failure(401, 'UNAUTHORIZED', '인증 토큰이 필요합니다.'));
  }

  // 2. Create Anon Client with user's JWT
  const supabase = createAnonClient({
    url: config.supabase.url,
    anonKey: config.supabase.anonKey,
    accessToken,
  });

  // 3. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return respond(c, failure(401, 'UNAUTHORIZED', '인증되지 않은 사용자입니다.'));
  }

  // 4. Pass user.id to the service layer
  const result = await someService(supabase, user.id, ...);
  ```

- **Admin Operations (e.g., user signup, system tasks)**:
  1.  Use **Service Role Client** (`c.get('supabase')`).
  2.  This client has full admin access and bypasses RLS.

### Critical Auth Rules
- **NEVER** use the Service Role client (`c.get('supabase')`) to authenticate user requests.
- **ALWAYS** use the Anon Client with a user's access token for user-initiated actions.
- The Service Role client is for **admin operations ONLY**.