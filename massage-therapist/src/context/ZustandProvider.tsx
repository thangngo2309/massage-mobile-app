import { type PropsWithChildren, useEffect } from 'react';

import { useUserStore } from '@/store/useUserStore';

export const ZustandProvider = ({ children }: PropsWithChildren) => {
  const hydrate = useUserStore(state => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return children;
};
