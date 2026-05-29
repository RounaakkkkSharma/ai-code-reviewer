import { useState, useCallback } from 'react';

type StreamCallback = (event: string, data: any) => void;

export function useStreaming() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startStream = useCallback(async (url: string, body: any, onEvent: StreamCallback) => {
    setIsStreaming(true);
    setError(null);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        let errMessage = 'Stream request failed';
        try {
            const errData = await response.json();
            errMessage = errData.detail || errMessage;
        } catch(e) {}
        throw new Error(errMessage);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No reader available');
      }
      
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        let currentEvent = '';
        
        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            const dataStr = line.substring(5).trim();
            if (dataStr) {
              try {
                const dataObj = JSON.parse(dataStr);
                onEvent(currentEvent, dataObj);
                
                if (currentEvent === 'complete' || currentEvent === 'fatal_error') {
                   setIsStreaming(false);
                   return; // stream ends naturally
                }
              } catch (e) {
                console.error("Failed to parse SSE data", e);
              }
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Streaming error');
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { isStreaming, error, startStream };
}
