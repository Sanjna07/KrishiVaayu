import { Suspense } from 'react';
import FarmerDashboardClient from './FarmerDashboardClient';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ManageListingPage({ params }: PageProps) {
  const { token } = await params;

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F7FA] text-[#5B6675] p-8 text-xs font-medium">Loading dashboard...</div>}>
      <FarmerDashboardClient token={token} />
    </Suspense>
  );
}
