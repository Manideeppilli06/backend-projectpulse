import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const WS_URL = API.replace(/^http/, 'ws') + '/ws';

export default function useLiveTopic(topic, onEvent) {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onEvent);

  useEffect(() => {
    handlerRef.current = onEvent;
  });

  useEffect(() => {
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(topic, (message) => {
          handlerRef.current(JSON.parse(message.body));
        });
        handlerRef.current({ type: 'connected' });
      },
      onWebSocketClose: () => setConnected(false),
    });

    client.activate();
    return () => {
      client.deactivate();
    };
  }, [topic]);

  return connected;
}