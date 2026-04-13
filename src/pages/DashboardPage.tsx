import React from 'react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import type { BusinessConfig } from '../lib/types';

interface DashboardPageProps {
  config: BusinessConfig | null;
  setConfig: React.Dispatch<React.SetStateAction<BusinessConfig | null>>;
}

export default function DashboardPage({ config, setConfig }: DashboardPageProps) {
  return (
    <>
      <SignedIn>
        <Dashboard config={config} setConfig={setConfig} />
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
}
