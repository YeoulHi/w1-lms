# Styling Guidelines

## Shadcn UI Setup

```yaml
shadcn_ui_setup:
  toast_component:
    requirement: "useToast() hook 사용 시 반드시 <Toaster /> 컴포넌트를 렌더링 트리에 추가"
    location: "app/layout.tsx 또는 최상위 레이아웃"
    pattern: |
      import { Toaster } from "@/components/ui/toaster";
      
      export default function RootLayout({ children }) {
        return (
          <Provider>
            {children}
            <Toaster />
          </Provider>
        );
      }
    
  hook_callback_pattern:
    problem: "useMutation의 로컬 onSuccess 콜백이 hook 정의된 onSuccess를 덮어씀"
    solution: "Hook에 콜백 파라미터 추가하여 체이닝"
    example: |
      // Hook 정의
      export const useCreateCourse = (onSuccessCallback?: () => void) => {
        return useMutation({
          onSuccess: () => {
            toast({ ... });
            onSuccessCallback?.();
          }
        });
      };
      
      // 컴포넌트 사용
      const { mutate } = useCreateCourse(() => form.reset());
      mutate(data); // 로컬 onSuccess 전달하지 않음

  variable_order:
    rule: "Hook이 다른 변수를 참조할 경우 선언 순서 주의"
    pattern: |
      // ❌ 잘못된 순서
      const { mutate } = useHook(() => form.reset());
      const form = useForm();
      
      // ✅ 올바른 순서
      const form = useForm();
      const { mutate } = useHook(() => form.reset());
```
