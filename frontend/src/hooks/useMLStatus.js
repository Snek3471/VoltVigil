import { useState, useEffect } from 'react';

const ML_HEALTH_URL   = 'http://localhost:5001/health';
const POLL_INTERVAL   = 30_000; // 30 seconds
const REQUEST_TIMEOUT = 2_000;  // 2 seconds

const useMLStatus = () => {
  const [mlOnline, setMlOnline] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
        const res = await fetch(ML_HEALTH_URL, { signal: controller.signal });
        clearTimeout(timer);
        setMlOnline(res.ok);
      } catch {
        setMlOnline(false);
      }
    };

    check();
    const interval = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return mlOnline;
};

export default useMLStatus;
