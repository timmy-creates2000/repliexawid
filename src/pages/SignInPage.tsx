import React from 'react';
import { SignIn } from '@clerk/clerk-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] scifi-grid flex items-center justify-center p-4">
      <SignIn routing="path" path="/sign-in" afterSignInUrl="/dashboard" />
    </div>
  );
}
