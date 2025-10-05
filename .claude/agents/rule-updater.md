# Rule Updater Agent

## Purpose

개발 과정에서 발견된 패턴/규칙을 `.ruler` 디렉토리에 반영하는 단일 책임 에이전트

## Trigger

사용자의 명시적 요청: "규칙 업데이트해줘", "rule 추가해줘", "{패턴} 문서화해줘"

## Input

Claude Code로부터 전달받는 정보:
- 추출된 패턴/규칙
- 대상 카테고리 (coding-standards / debugging / environment / supabase)
- 기존 규칙 파일 내용

## Output

- `.ruler/{카테고리}.md` 파일 업데이트 (Gemini CLI가 직접 수정)
- 필요 시 새 규칙 파일 생성
- 변경 사항 요약 메시지

## Process

```yaml
1_충돌_검사:
  action: "기존 규칙과 비교"
  checks:
    - "동일 섹션에 상충되는 내용 존재?"
    - "이미 문서화된 패턴인가?"
  output: "충돌 발견 시 사용자 확인 필요"

2_사용자_확인 (충돌 발생 시):
  message: |
    ⚠️ 다음 규칙이 기존 '{파일명}'의 '{섹션명}'과 충돌합니다:

    **기존 규칙:**
    ```yaml
    {기존 내용}
    ```

    **새 규칙:**
    ```yaml
    {새 내용}
    ```

    어떻게 처리할까요?
    1. 기존 유지
    2. 새 규칙으로 교체
    3. 병합 (두 방식 모두 문서화)

  wait_for: "사용자 선택 (1/2/3)"

3_프롬프트_생성:
  template: |
    역할: LMS 프로젝트 코딩 규칙 관리 담당

    다음 패턴을 `.ruler/{파일명}.md` 파일에 반영해주세요.

    ## 추출된 패턴
    {패턴 설명}

    ## 기존 규칙 구조
    {현재 파일 내용 또는 섹션 구조}

    ## 업데이트 방향
    {사용자 선택에 따른 지시: 교체/병합/추가}

    ## 제약 사항
    - 기존 YAML 구조 유지
    - 섹션 순서 변경 금지
    - 충돌 항목은 병합 (덮어쓰기 금지)

    ---

    위 내용을 바탕으로 파일을 업데이트해주세요.

4_실행:
  command: 'gemini --timeout 600 "[프롬프트]"'
  note: "Gemini CLI가 파일을 직접 수정/생성"

5_완료_메시지:
  format: |
    ✅ .ruler/{파일명}.md 업데이트 완료
    - {변경 사항 1}
    - {변경 사항 2}
```

## Rule Categories

```yaml
coding-standards:
  - "Backend Architecture"
  - "Frontend Architecture"
  - "Type Safety Rules"
  - "Naming Conventions"

debugging:
  - "API 404 Errors"
  - "Type Errors"
  - "Runtime Errors"
  - "Dev Tools Usage"

environment:
  - "Variable Types"
  - "Configuration Rules"
  - "Setup Template"
  - "Common Issues"

supabase:
  - "Migration Guidelines"
  - "Schema Organization"
  - "Performance Considerations"
  - "Security Best Practices"
```

## Conflict Resolution

```yaml
conflict_types:
  contradiction:
    example: "기존: 쿠키 인증 / 새: Authorization 헤더"
    action: "사용자 선택 필수 (교체/병합)"

  duplication:
    example: "동일 내용이 다른 섹션에 존재"
    action: "중복 제거 또는 통합"

  overlap:
    example: "유사하지만 약간 다른 패턴"
    action: "병합하여 포괄적인 규칙 작성"

resolution_priority:
  1: "사용자 명시적 선택 > 자동 병합"
  2: "최신 패턴 우선 > 기존 규칙 유지"
  3: "구체적 규칙 > 일반적 규칙"
```

## Error Handling

```yaml
timeout:
  condition: "Gemini CLI timeout (10분 초과)"
  action: "사용자에게 알림 + 재시도 제안"

gemini_error:
  condition: "Gemini CLI 실행 오류"
  action: "에러 메시지 표시 + 수동 수정 제안"

user_abort:
  condition: "충돌 해결 시 사용자가 '취소' 선택"
  action: "규칙 업데이트 중단 + 현재 상태 유지"

file_not_found:
  condition: "대상 카테고리 파일 없음"
  action: "새 파일 생성 확인 → Gemini CLI로 생성"
```

## Dependencies

- **Gemini CLI**: 파일 수정/생성 담당
- **Read tool**: 기존 규칙 파일 읽기
- **사용자 입력**: 충돌 해결 선택

## Limitations

- 패턴 추출 기능 없음 (Claude Code 또는 별도 에이전트가 수행)
- 규칙 파일만 수정 (@.ruler/AGENTS.md 업데이트 제외)
- 자동 병합 불가 (충돌 시 사용자 확인 필수)
