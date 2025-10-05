# Task-005-001: 강사용 과제 제출물 목록 페이지 구현 명세

## 1. 개요

- **목적**: 강사가 특정 과제에 대한 모든 제출물을 한눈에 보고, 각 제출물을 선택하여 채점할 수 있는 UI 페이지를 구현합니다. 이 페이지는 QA-005-001 테스트 시나리오를 수행하기 위한 진입점 역할을 합니다.
- **사용자 역할**: 강사 (Instructor)
- **최종 경로**: `/(protected)/instructor/courses/{courseId}/assignments/{assignmentId}`

## 2. 기능 요구사항

### 2.1. 데이터 조회 및 표시

1.  **과제 정보 표시**:
    - 페이지 상단에 현재 과제의 제목(예: "1주차 과제: React 컴포넌트 만들기")을 표시해야 합니다.

2.  **제출물 목록 조회**:
    - 해당 과제에 제출된 모든 수강생의 제출물 목록을 서버로부터 가져와야 합니다.
    - 이를 위해 새로운 백엔드 API 엔드포인트와 연동되는 프론트엔드 데이터 fetching 훅(예: `useSubmissionsByAssignment`)이 필요합니다.

3.  **제출물 목록 UI**:
    - 제출물 목록은 테이블 또는 리스트 형태로 표시되어야 합니다.
    - 각 항목에는 다음 정보가 포함되어야 합니다.
        - **수강생 이름** (또는 식별자)
        - **제출 상태** (`제출 완료`, `채점 완료`, `재제출 필요`) - `Badge` 컴포넌트 활용
        - **제출일**
        - **점수** (채점 완료 시)

### 2.2. 상호작용

1.  **채점 인터페이스 열기**:
    - 강사가 제출물 목록에서 특정 항목(행)을 클릭하면, 해당 제출물을 채점할 수 있는 UI가 나타나야 합니다.
    - UI는 `Sheet` (화면 옆에서 나오는 패널) 또는 `Dialog` (모달창)를 사용하여 표시하는 것을 권장합니다.

2.  **채점 컴포넌트 연동**:
    - 채점 UI에는 이미 구현된 `GradeSubmissionForm` 컴포넌트를 재사용해야 합니다.
    - 이때, 선택된 제출물의 `submissionId`를 `GradeSubmissionForm` 컴포넌트에 `prop`으로 전달해야 합니다.

3.  **상태 자동 업데이트**:
    - 채점 또는 재제출 요청이 성공적으로 완료되면, 목록의 해당 제출물 상태(상태, 점수)가 별도의 페이지 새로고침 없이 실시간으로 업데이트되어야 합니다. (React Query의 `queryClient.invalidateQueries` 활용)

## 3. 기술 구현 가이드

- **구현 위치**: `src/app/(protected)/instructor/courses/[courseId]/assignments/[assignmentId]/page.tsx`
- **필요한 신규 훅**:
    - `src/features/submissions/hooks/useSubmissionsByAssignment.ts`
    - `useQuery`를 사용하여 특정 과제(`assignmentId`)의 모든 제출물을 가져오는 훅을 작성합니다.
- **필요한 신규 API 엔드포인트 (백엔드)**:
    - **`GET /api/assignments/{assignmentId}/submissions`**
    - 백엔드팀은 위 API를 구현해야 합니다. 이 API는 권한(해당 코스 강사)을 확인하고, `assignmentId`에 해당하는 모든 `submissions` 레코드를 반환해야 합니다.
- **UI 컴포넌트**:
    - `Table`, `Badge`, `Sheet` 등 `shadcn-ui`의 컴포넌트를 적극적으로 활용합니다.

## 4. 완료 조건 (Acceptance Criteria)

- [ ] 강사가 해당 URL로 접속했을 때, 과제 제목과 제출물 목록이 올바르게 표시된다.
- [ ] 제출물 목록의 각 항목(수강생, 상태, 날짜, 점수) 정보가 정확하다.
- [ ] 목록에서 특정 제출물을 클릭하면, `Sheet` 또는 `Dialog` 안에 `GradeSubmissionForm`이 올바르게 렌더링된다.
- [ ] `GradeSubmissionForm`을 통해 채점을 완료하면, 폼이 닫히고 목록의 정보(상태, 점수)가 자동으로 갱신된다.
