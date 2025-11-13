import { useContext } from 'react';
import { SessionContext } from '../contexts';

export function useSession() {
  return useContext(SessionContext);
}

