import { useEffect, useRef } from 'react';
import { resolveApiUrl } from '../services/api';

interface LiveMarketStreamHandlers {
  onIndices?: (payload: { timestamp?: string; session?: string }) => void;
  onStocks?: (payload: {
    totalUniverse?: number;
    timestamp?: string;
    triggeredAlerts?: number;
    session?: string;
  }) => void;
  onIpos?: (payload: { total?: number; timestamp?: string; session?: string }) => void;
  onAlerts?: (payload: { triggered?: number; timestamp?: string }) => void;
  onHeartbeat?: (payload: {
    timestamp?: string;
    session?: string;
    istTimeLabel?: string;
  }) => void;
  enabled?: boolean;
}

export function useLiveMarketStream(handlers: LiveMarketStreamHandlers) {
  const ref = useRef(handlers);
  ref.current = handlers;
  const enabled = handlers.enabled ?? true;

  useEffect(() => {
    if (!enabled || typeof EventSource === 'undefined') return;

    let closed = false;
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (closed) return;
      source = new EventSource(resolveApiUrl('/api/stream/market'));

      const parse = (ev: MessageEvent) => {
        try {
          return JSON.parse(ev.data || '{}');
        } catch {
          return {};
        }
      };

      source.addEventListener('indices', (ev) => {
        ref.current.onIndices?.(parse(ev as MessageEvent));
      });
      source.addEventListener('stocks', (ev) => {
        ref.current.onStocks?.(parse(ev as MessageEvent));
      });
      source.addEventListener('ipos', (ev) => {
        ref.current.onIpos?.(parse(ev as MessageEvent));
      });
      source.addEventListener('alerts', (ev) => {
        ref.current.onAlerts?.(parse(ev as MessageEvent));
      });
      source.addEventListener('heartbeat', (ev) => {
        ref.current.onHeartbeat?.(parse(ev as MessageEvent));
      });

      source.onerror = () => {
        source?.close();
        source = null;
        if (!closed && !reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connect();
          }, 10_000);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      source?.close();
    };
  }, [enabled]);
}
