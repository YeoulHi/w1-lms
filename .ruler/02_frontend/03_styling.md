# Styling & UI

## Shadcn UI Rules

1.  **Toaster**: When using `useToast()`, you **must** add the `<Toaster />` component to the root layout (`app/layout.tsx`).

2.  **Mutation Hook Callbacks**: To avoid overriding global `onSuccess` callbacks, pass local callbacks as a parameter to the hook creator, not to the `mutate` function.

    ```typescript
    // ✅ Correct: Pass callback to hook creator
    const { mutate } = useCreateCourse(() => form.reset());
    mutate(data);
    ```

3.  **Variable Declaration Order**: Ensure variables used within a hook's callback are declared *before* the hook itself.

    ```typescript
    // ✅ Correct: Declare form before useHook
    const form = useForm();
    const { mutate } = useHook(() => form.reset());
    ```

4.  **UI Feedback Essentials**: For every user action, provide clear feedback for all possible states.

    - **Loading State**: Disable buttons and show a pending message during async operations.
      ```tsx
      <Button disabled={isPending}>
        {isPending ? 'Submitting...' : 'Submit'}
      </Button>
      ```

    - **Success Feedback**: Show a toast message on successful completion.
      ```typescript
      onSuccess: () => {
        toast({ title: 'Success!', description: 'Your action was completed.' });
      }
      ```

    - **Error Feedback**: Show a destructive toast with a clear error message on failure.
      ```typescript
      onError: (error) => {
        toast({
          title: 'Action Failed',
          description: extractApiErrorMessage(error),
          variant: 'destructive',
        });
      }
      ```