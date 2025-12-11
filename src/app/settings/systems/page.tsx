'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SettingsLayout from '@/components/settings/SettingsLayout';
import MainSystemsList from '@/components/settings/systems/MainSystemsList';
import SubSystemsList from '@/components/settings/systems/SubSystemsList';

type TabType = 'main-systems' | 'sub-systems';

function SystemsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'main-systems';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/settings/systems?tab=${tab}`, { scroll: false });
  };

  return (
    <SettingsLayout>
      <div className="max-w-6xl mx-auto">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Systems Configuration</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage Main Systems and Sub Systems for your organization
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
              <button
                onClick={() => handleTabChange('main-systems')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === 'main-systems'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={activeTab === 'main-systems' ? 'page' : undefined}
              >
                Main Systems
              </button>
              <button
                onClick={() => handleTabChange('sub-systems')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === 'sub-systems'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={activeTab === 'sub-systems' ? 'page' : undefined}
              >
                Sub Systems
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'main-systems' && <MainSystemsList />}
            {activeTab === 'sub-systems' && <SubSystemsList />}
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}

export default function SystemsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SystemsContent />
    </Suspense>
  );
}
