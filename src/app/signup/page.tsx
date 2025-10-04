import Link from 'next/link';
import { SignUpForm } from '@/features/auth/components/SignUpForm';

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-8 px-6 py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold">Create an account</h1>
        <p className="text-muted-foreground">
          Sign up to start your learning journey
        </p>
      </header>

      <div className="w-full rounded-xl border border-border bg-card p-6 shadow-sm">
        <SignUpForm />
      </div>

      <p className="text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-primary underline hover:text-primary/80"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
