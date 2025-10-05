---
title: "spec-004-001: 수강신청 401 Unauthorized 오류 해결"
date: "2025-10-06"
issue: "수강신청 버튼 클릭 시 401 Unauthorized 오류 발생"
root_cause: "Service Role Key 클라이언트에서 사용자 JWT 토큰을 활용하지 못함"
---

## 상세 내용

### 증상
- 수강신청 버튼 클릭 시 `POST /api/enrollments` 요청이 401 Unauthorized 오류로 실패
- Authorization 헤더는 프론트엔드에서 정상적으로 전송됨
- 백엔드에서 인증 실패 메시지: "인증되지 않은 사용자입니다."

### 문제 분석

#### 초기 구현 방식
```typescript
// ❌ 잘못된 패턴 (초기 구현)
export const registerEnrollmentsRoutes = (app: Hono<AppEnv>) => {
  app.post('/enrollments', async (c) => {
    const supabase = c.get('supabase'); // Service Role Key 클라이언트

    // Service Role Key 클라이언트로 auth.getUser() 호출
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // ❌ 사용자의 JWT 토큰이 클라이언트에 전달되지 않음
    // ❌ Authorization 헤더는 있지만 활용되지 않음
  });
};
```

#### 문제의 원인
1. **Service Role Key 클라이언트의 한계**:
   - `withSupabase()` 미들웨어는 Service Role Key를 사용하는 Supabase 클라이언트를 제공
   - Service Role Key 클라이언트는 관리자 권한을 가지지만, 사용자의 JWT 토큰과 연결되지 않음
   - `auth.getUser()`를 호출해도 현재 요청의 사용자를 인증할 수 없음

2. **Authorization 헤더 미활용**:
   - 프론트엔드는 `Authorization: Bearer <access_token>` 헤더를 전송
   - 백엔드는 이 토큰을 추출하고 활용하는 로직이 없음

### 해결 방법

#### 올바른 패턴: Anon Client + Access Token
```typescript
// ✅ 올바른 패턴
export const registerEnrollmentsRoutes = (app: Hono<AppEnv>) => {
  app.post('/enrollments', async (c) => {
    const logger = getLogger(c);
    const config = getConfig(c);

    // 1. Authorization 헤더에서 access token 추출
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return respond(
        c,
        failure(401, enrollmentErrorCodes.unauthorized, '인증 토큰이 필요합니다.'),
      );
    }

    // 2. Anon Key + Access Token 조합으로 클라이언트 생성
    const supabase = createAnonClient({
      url: config.supabase.url,
      anonKey: config.supabase.anonKey,
      accessToken, // ← 사용자의 JWT 토큰 주입
    });

    // 3. 사용자 인증
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Auth error:', authError?.message || 'No user found');
      return respond(
        c,
        failure(401, enrollmentErrorCodes.unauthorized, '인증되지 않은 사용자입니다.'),
      );
    }

    // 4. 인증된 사용자로 비즈니스 로직 처리
    const result = await enrollInCourseService(supabase, user.id, ...);
    return respond(c, result);
  });
};
```

#### createAnonClient의 구현 원리
```typescript
// src/backend/supabase/client.ts
export const createAnonClient = ({
  url,
  anonKey,
  accessToken,
}: AnonClientConfig): SupabaseClient => {
  const client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`, // ← JWT 토큰 주입
          }
        : {},
    },
  });

  return client;
};
```

### 영향받은 파일

#### 수정된 파일
1. **`src/features/enrollments/backend/route.ts`**:
   - Authorization 헤더 추출 로직 추가
   - `createAnonClient` 사용으로 변경
   - 사용자 인증 로직 추가

2. **`src/features/assignments/backend/route.ts`**:
   - 동일한 패턴 적용 (일관성 유지)

#### 참조 패턴 (이미 올바르게 구현됨)
- **`src/features/courses/backend/route.ts`**: 강의 생성 기능에서 이미 올바른 패턴 사용 중

### 핵심 차이점 비교

| 측면 | Service Role Client | Anon Client + Access Token |
|------|--------------------|-----------------------------|
| **키 종류** | Service Role Key (관리자) | Anon Key + 사용자 JWT |
| **권한** | 모든 데이터 접근 가능 | RLS 정책 적용됨 |
| **사용자 인증** | ❌ 불가능 | ✅ 가능 (`auth.getUser()`) |
| **용도** | 관리자 작업, 백그라운드 작업 | 사용자 요청 처리 |
| **보안** | 서버 전용 (노출 금지) | 클라이언트 안전 (Anon Key는 공개 가능) |

### 검증 결과
- ✅ 수강신청 버튼 클릭 시 정상 동작
- ✅ 토스트 메시지: "수강신청이 완료되었습니다." 정상 표시
- ✅ 데이터베이스에 enrollment 레코드 생성 확인
- ✅ 네트워크 탭에서 200 OK 응답 확인

### 교훈
1. **Service Role Key는 사용자 인증에 적합하지 않음**:
   - 관리자 권한 작업(회원가입, 시스템 초기화 등)에만 사용
   - 사용자 요청 처리에는 Anon Key + Access Token 패턴 사용

2. **Authorization 헤더 활용 필수**:
   - 프론트엔드가 전송한 JWT 토큰을 백엔드에서 명시적으로 추출하고 활용
   - `createAnonClient`에 토큰을 주입하여 인증된 클라이언트 생성

3. **일관된 패턴 적용**:
   - 모든 사용자 인증이 필요한 라우트에 동일한 패턴 적용
   - 코드 재사용성과 유지보수성 향상

4. **기존 구현 참조**:
   - 새로운 기능 구현 시 기존 올바른 구현(`courses` 라우트) 참조
   - 패턴 일관성 유지로 버그 예방
