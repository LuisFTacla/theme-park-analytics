import { useEffect, useState } from 'react';
import { subscribeWaking } from '@/services/api';

export function useServerWaking(): boolean {
  const [waking, setWaking] = useState(false);

  useEffect(() => subscribeWaking(setWaking), []);

  return waking;
}
