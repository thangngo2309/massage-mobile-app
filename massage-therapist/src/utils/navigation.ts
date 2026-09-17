import { router } from 'expo-router';

export const pushRoute = (path: string) => {
  router.push(path as never);
};

export const replaceRoute = (path: string) => {
  router.replace(path as never);
};
