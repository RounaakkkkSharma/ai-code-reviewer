import { useState, useCallback } from 'react';
import { useStreaming } from './useStreaming';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface AgentStatus {
  name: 'bug_detector' | 'security_analyzer' | 'performance_analyzer' | 'style_checker';
  status: 'queued' | 'analyzing' | 'complete';
  findingCount: number | null;
}

const initialAgentStatuses: AgentStatus[] = [
  { name: 'bug_detector', status: 'queued', findingCount: null },
  { name: 'security_analyzer', status: 'queued', findingCount: null },
  { name: 'performance_analyzer', status: 'queued', findingCount: null },
  { name: 'style_checker', status: 'queued', findingCount: null },
];

export function useReview() {
  const { isStreaming, error: streamError, startStream } = useStreaming();
  
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>(initialAgentStatuses);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setAgentStatuses(initialAgentStatuses);
    setCurrentStage('');
    setReviewId(null);
    setError(null);
  };

  const handleStreamEvent = useCallback((event: string, data: any) => {
    if (event === 'progress') {
      setCurrentStage(data.message);
      if (data.stage === 'analyzing') {
        setAgentStatuses(prev => prev.map(a => ({ ...a, status: 'analyzing' })));
      }
    } else if (event === 'agent_complete') {
      setAgentStatuses(prev => prev.map(a => {
        if (a.name === data.agent) {
          return { ...a, status: 'complete', findingCount: data.finding_count };
        }
        return a;
      }));
    } else if (event === 'complete') {
      setReviewId(data.review_id);
    } else if (event === 'fatal_error') {
      setError(data.error);
    }
  }, []);

  const submitSnippet = async (
    code: string,
    language: string,
    context: string,
    reviewMode: 'fast' | 'deep' = 'deep',
    categories: string[] = ['bug', 'security', 'performance', 'style']
  ) => {
    resetState();
    await startStream(
      `${BASE_URL}/api/v1/review/snippet`,
      {
        code,
        language,
        context,
        review_mode: reviewMode,
        categories,
      },
      handleStreamEvent
    );
  };

  const submitPR = async (
    prUrl: string,
    context: string,
    reviewMode: 'fast' | 'deep' = 'deep',
    categories: string[] = ['bug', 'security', 'performance', 'style']
  ) => {
    resetState();
    await startStream(
      `${BASE_URL}/api/v1/review/github-pr`,
      {
        github_pr_url: prUrl,
        context,
        review_mode: reviewMode,
        categories,
      },
      handleStreamEvent
    );
  };

  return {
    submitSnippet,
    submitPR,
    agentStatuses,
    currentStage,
    reviewId,
    isStreaming,
    error: error || streamError
  };
}
