import { useEffect, useState, useRef } from "react";

export const useKafkaEvents = (topic) => {
  const [events, setEvents] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    const connectWebSocket = () => {
      // 1. Get the token from localStorage (Ensure key matches your Login logic)
      const token = localStorage.getItem("token");

      // 2. Safety Check: Don't try to connect if not logged in
      if (!token) {
        console.warn(`Skipping Kafka connection for ${topic}: No auth token found.`);
        return;
      }

      try {
        // 3. FIX: Append the token as a query parameter
        const ws = new WebSocket(`ws://localhost:8080/kafka/${topic}?token=${token}`);
        
        ws.onopen = () => {
          console.log(`Connected to Kafka topic: ${topic}`);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setEvents((prev) => [...prev, data]);
          } catch (error) {
            console.error("Error parsing Kafka event:", error);
          }
        };

        ws.onerror = (error) => {
          console.error(`WebSocket error for topic ${topic}:`, error);
        };

        ws.onclose = () => {
          console.log(`Disconnected from Kafka topic: ${topic}`);
          // Attempt to reconnect after 3 seconds
          // Note: verify token exists again inside the retry if needed, 
          // but for this simple implementation, it will re-read token on next call.
          setTimeout(connectWebSocket, 3000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error(`Failed to connect to Kafka topic ${topic}:`, error);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [topic]);

  return events;
};