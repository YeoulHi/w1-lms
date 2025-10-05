# Log Writer Agent

## Purpose

개발 과정에서 발생한 주요 이슈와 해결 과정을 Gemini CLI를 통해 문서화하는 단일 책임 에이전트

## Trigger

사용자의 명시적 요청: "로그 작성해줘", "문서화해줘", "log 써줘"

## Input

Claude Code로부터 전달받는 요약된 맥락:
- 작업 중인 spec 번호
- 구현 완료 항목 (Backend/Frontend 파일 목록)
- 주요 이슈와 해결 과정
- 검증 결과
- 파일 변경 요약
- 학습 포인트

## Output

`docs/log/spec-{번호}-{시퀀스}.md` 파일 (Gemini CLI가 직접 생성)

예: `docs/log/spec-004-001.md`

## Process

```yaml
1_파일명_결정:
  action: "기존 log 파일 검색하여 다음 시퀀스 번호 결정"
  command: "Glob: docs/log/spec-{현재spec}-*.md"
  logic: "최대 시퀀스 번호 + 1"

2_프롬프트_생성:
  template: |
    역할: LMS 프로젝트 개발 로그 문서화 담당

    다음 내용을 바탕으로 `docs/log/spec-{번호}-{시퀀스}.md` 파일을 작성해주세요.

    ## 작업 개요
    {Claude가 제공한 spec 설명}

    ## 포함해야 할 내용

    ### 1. 구현 완료 항목
    #### Backend
    {파일 목록과 설명}

    #### Frontend
    {파일 목록과 설명}

    ### 2. 주요 이슈와 해결 과정
    {이슈별로 "문제 → 원인 → 해결" 구조}

    ### 3. 검증 결과
    {ESLint, TypeScript, Build, API 테스트 결과}

    ### 4. 파일 변경 요약
    {Modified/Created 파일 목록}

    ### 5. 중요한 학습 포인트
    {핵심 패턴, 주의사항}

    ---

    위 내용을 markdown 형식으로 작성해주세요.
    각 섹션은 명확한 제목과 코드 블록을 포함하고,
    이슈 해결 과정은 "문제 → 원인 → 해결" 구조로 작성해주세요.

3_실행:
  command: 'gemini --timeout 600 "[프롬프트]"'
  note: "Gemini CLI가 파일을 직접 생성"

4_완료_메시지:
  format: "✅ docs/log/spec-{번호}-{시퀀스}.md 생성 완료"
```

## Style Guide

참고 파일: `docs/log/spec-003-001.md`

```yaml
structure:
  - "# 제목"
  - "## 작업 개요"
  - "## 구현 완료 항목"
  - "## 주요 이슈와 해결 과정"
  - "## 검증 결과"
  - "## 파일 변경 요약"
  - "## 중요한 학습 포인트"

code_blocks:
  - "언어 지정 필수 (typescript, bash, yaml 등)"
  - "Before/After 패턴 사용"

issue_format:
  - "#### 이슈 N: 제목"
  - "**문제**: 설명"
  - "**원인**: 설명"
  - "**해결**: 코드/설명"

validation:
  - "✅/❌ 체크리스트 형태"
```

## Error Handling

```yaml
timeout:
  condition: "Gemini CLI timeout (10분 초과)"
  action: "사용자에게 알림 + 재시도 제안"

gemini_error:
  condition: "Gemini CLI 실행 오류"
  action: "에러 메시지 표시 + 수동 작성 제안"

no_context:
  condition: "맥락 정보 부족"
  action: "context-summarizer 에이전트 먼저 호출 제안"
```

## Dependencies

- **context-summarizer**: 맥락 정보가 부족할 경우 먼저 호출
- **Gemini CLI**: 파일 생성 담당
- **Glob**: 기존 파일 검색

## Limitations

- 맥락 분석 기능 없음 (context-summarizer에 위임)
- 파일 생성만 담당 (검증은 Claude Code가 수행)
- Rule 문서화 기능 없음 (rule-updater에 위임)
