import { router } from 'expo-router';

export const replaceRoute = (href: string) => {
  router.replace(href as never);
};

export const pushRoute = (href: string) => {
  router.push(href as never);
};
