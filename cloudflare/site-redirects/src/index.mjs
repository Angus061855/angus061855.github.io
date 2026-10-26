export const redirects = new Map([
  ['/blog/', '/blog'],
  ['/guides', '/knowledge'],
  ['/guides/', '/knowledge'],
  ['/brand', '/contact'],
  ['/brand/', '/contact']
]);

export function redirectResponse(request) {
  const url = new URL(request.url);
  const target = redirects.get(url.pathname);
  if (!target) return null;
  url.pathname = target;
  return Response.redirect(url.href, 301);
}

// Single Redirect rules match paths exactly without intercepting guide articles.
export const cloudflareRules = [...redirects].map(([path, target], index) => ({
  ref: `as_public_url_${index + 1}`,
  expression: `(http.host eq "as-ent-tw.com" and http.request.uri.path eq "${path}")`,
  action: 'redirect',
  action_parameters: { from_value: {
    status_code: 301,
    target_url: { value: `https://as-ent-tw.com${target}` },
    preserve_query_string: true
  } },
  enabled: true
}));
