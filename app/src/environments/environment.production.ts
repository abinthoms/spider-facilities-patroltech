export const environment = {
  production: true,
  // Relative on purpose - nginx (see app/nginx.conf) proxies /api/* to
  // the backend container so the app works same-origin wherever it's hosted.
  apiServer: ''
};
