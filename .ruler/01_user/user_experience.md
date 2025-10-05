# User Experience Guidelines

This document outlines the principles and rules related to the user's experience and interaction with the application.

## General Principles

- **Clarity and Simplicity**: The UI should be intuitive and easy to navigate.
- **Consistency**: UI elements and user interactions should be consistent across the application.
- **Feedback**: The system should provide clear and timely feedback to the user (e.g., loading states, success/error messages).

## Frontend Navigation

```yaml
frontend_navigation:
  mock_data_policy: "API 미구현 시 Mock 데이터 사용을 허용하되, TODO 주석으로 명시"
  routing_pattern: "목록->상세 페이지 이동은 Link 컴포넌트를 사용한 선언적 네비게이션을 우선"
```
