export const redirectResponse = (location: string | URL, status = 302) => {
  const headers = new Headers();
  headers.set('Location', String(location));
  headers.set('Cache-Control', 'private, no-store');

  return new Response(null, {
    status,
    headers,
  });
};
