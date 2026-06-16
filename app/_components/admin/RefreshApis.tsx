// components/RefreshButton.tsx
'use client';

import { RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
// import { ArrowPathIcon } from '@heroicons/react/24/outline'; // Example icon

export default function RefreshButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Refetches the current route and its server components
    router.refresh(); 

    // Reset the spinning state after a brief timeout to provide visual feedback
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white border border-gray-300 rounded-md hover:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
    >
      {/* <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> */}
      <RefreshCcw />
    </button>
  );
}
