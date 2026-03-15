import React, { useState } from 'react';
import { RoutesTab } from './adapters/ui/components/RoutesTab';
import { CompareTab } from './adapters/ui/components/CompareTab';
import { BankingTab } from './adapters/ui/components/BankingTab';
import { PoolingTab } from './adapters/ui/components/PoolingTab';

type Tab = 'routes' | 'compare' | 'banking' | 'pooling';

const TABS: { id: Tab; label: string; icon: string; description: string }[] = [
  { id: 'routes',  label: 'Routes',  icon: '🚢', description: 'Route registry & baselines' },
  { id: 'compare', label: 'Compare', icon: '📊', description: 'GHG intensity comparison' },
  { id: 'banking', label: 'Banking', icon: '🏦', description: 'Article 20 – Banking' },
  { id: 'pooling', label: 'Pooling', icon: '🏊', description: 'Article 21 – Pooling' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('routes');

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-ocean-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚓</span>
              <div>
                <h1 className="text-lg font-bold tracking-tight font-display">FuelEU Maritime</h1>
                <p className="text-xs text-ocean-300 leading-none">Compliance Dashboard · EU 2023/1805</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-ocean-300">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Target: 89.3368 gCO₂e/MJ
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all duration-150 ${
                  activeTab === tab.id
                    ? 'border-ocean-600 text-ocean-700 bg-ocean-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Breadcrumb / subtitle */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <p className="text-xs text-slate-400">
            {TABS.find((t) => t.id === activeTab)?.icon}{' '}
            {TABS.find((t) => t.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'routes'  && <RoutesTab />}
        {activeTab === 'compare' && <CompareTab />}
        {activeTab === 'banking' && <BankingTab />}
        {activeTab === 'pooling' && <PoolingTab />}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <span>FuelEU Maritime Compliance Platform · Reg. (EU) 2023/1805</span>
          <span>Hexagonal Architecture · React + TypeScript + Node.js</span>
        </div>
      </footer>
    </div>
  );
}
