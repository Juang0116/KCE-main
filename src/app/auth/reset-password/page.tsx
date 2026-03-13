// src/app/auth/reset-password/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import * as React from 'react';

import ResetPasswordForm from '@/features/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  const sp = useSearchParams();
  const nextParam = sp?.get('next');

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <ResetPasswordForm nextParam={nextParam} />
    </div>
  );
}
