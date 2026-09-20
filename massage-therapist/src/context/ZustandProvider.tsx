import { useEffect, type PropsWithChildren } from 'react';

import { useUserStore } from '@/store/useUserStore';

export const ZustandProvider = ({ children }: PropsWithChildren) => {
  const hydrate = useUserStore((state) => state.hydrate);
  const isHydrated = useUserStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [hydrate, isHydrated]);

  return children;
};
