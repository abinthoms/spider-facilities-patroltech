export const environment = {
  production: true,
  // Relative on purpose - nginx (see dashboard/nginx.conf) proxies /api/* to
  // the backend container so the dashboard works same-origin wherever it's hosted.
  apiServer: '',
  googleTagManagerId: 'GTM-WWB2NQG2',
};
