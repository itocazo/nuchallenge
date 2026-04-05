'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '@/lib/hooks/use-api';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ChallengeForm from '@/components/admin/ChallengeForm';
import { ArrowLeft } from 'lucide-react';

export default function AdminCreateChallengePage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <Link href="/admin/challenges" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to challenges
      </Link>
      <AdminPageHeader title="Create Challenge" />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <ChallengeForm
          submitLabel="Create Challenge"
          onSubmit={async (data) => {
            await apiPost('/api/admin/challenges', data);
            router.push('/admin/challenges');
          }}
        />
      </div>
    </div>
  );
}
