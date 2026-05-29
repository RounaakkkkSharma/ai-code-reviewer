import React from 'react';
import { AgentStatus } from '@/hooks/useReview';
import { Bug, ShieldAlert, Zap, Paintbrush, CheckCircle2, Loader2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const getAgentDetails = (name: string) => {
  switch (name) {
    case 'bug_detector': return { label: 'Bug Detector', icon: Bug, color: 'text-red-500' };
    case 'security_analyzer': return { label: 'Security Analyzer', icon: ShieldAlert, color: 'text-orange-500' };
    case 'performance_analyzer': return { label: 'Performance Analyzer', icon: Zap, color: 'text-amber-500' };
    case 'style_checker': return { label: 'Style Checker', icon: Paintbrush, color: 'text-blue-500' };
    default: return { label: name, icon: Bug, color: 'text-slate-500' };
  }
};

export default function ReviewProgress({ statuses, stage }: { statuses: AgentStatus[], stage: string }) {
  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="mb-6 text-center">
        <h3 className="text-lg font-semibold text-slate-800">Review in Progress</h3>
        <p className="text-sm text-slate-500 mt-1">{stage || "Initializing..."}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {statuses.map((agent) => {
          const details = getAgentDetails(agent.name);
          const Icon = details.icon;
          
          return (
            <div key={agent.name} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50">
              <div className="flex items-center space-x-3">
                <Icon className={cn("h-5 w-5", details.color)} />
                <span className="font-medium text-sm text-slate-700">{details.label}</span>
              </div>
              <div>
                {agent.status === 'queued' && <Circle className="h-4 w-4 text-slate-300" />}
                {agent.status === 'analyzing' && <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />}
                {agent.status === 'complete' && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                      {agent.findingCount} findings
                    </span>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
