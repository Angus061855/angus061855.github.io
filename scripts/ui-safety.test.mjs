import test from 'node:test';
import assert from 'node:assert/strict';
import { redirectResponse, redirects, cloudflareRules } from '../cloudflare/site-redirects/src/index.mjs';

test('exact public routes redirect once and preserve query strings', () => {
  for (const [from, to] of redirects) {
    const response = redirectResponse(new Request(`https://as-ent-tw.com${from}?source=test`));
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), `https://as-ent-tw.com${to}?source=test`);
    assert.equal(redirectResponse(new Request(response.headers.get('location'))), null);
  }
});
test('article and tool URLs are not redirected', () => {
  for (const path of ['/guides/hotel-pr-guide/', '/guides/hotel-contract/', '/tools/time-calculator/', '/post/example', '/blogger', '/brand-old/']) {
    assert.equal(redirectResponse(new Request(`https://as-ent-tw.com${path}`)), null);
  }
});
test('Cloudflare rules match exact host/path and preserve queries without wildcards', () => {
  assert.equal(cloudflareRules.length, redirects.size);
  for (const [index, [path, target]] of [...redirects].entries()) {
    const rule = cloudflareRules[index];
    assert.equal(rule.expression, `(http.host eq "as-ent-tw.com" and http.request.uri.path eq "${path}")`);
    assert.equal(rule.action_parameters.from_value.status_code, 301);
    assert.equal(rule.action_parameters.from_value.preserve_query_string, true);
    assert.equal(rule.action_parameters.from_value.target_url.value, `https://as-ent-tw.com${target}`);
  }
});
