# Log SPEC-007-001: 성적 및 피드백 열람 기능

## 백엔드
- `GET /courses/:courseId/grades` 라우트 등록
- `active` 수강 여부와 과제 상태(published/closed) 검증
- 제출 점수·피드백·상태를 Zod(`grades_response_schema`)로 검증

## 프런트엔드
- 공용 DTO 재노출 및 `useGetGrades` React Query 훅 작성
- Gradebook 테이블이 로딩/에러/빈 상태와 상태 배지를 처리
- 재사용 가능한 Table UI 컴포넌트 추가

## 검증
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
