#!/usr/bin/env node
/**
 * Notify IndexNow that the published pages changed.
 *
 * IndexNow is a push protocol: instead of waiting for a crawler to come
 * back, the site tells Bing, Yandex, Seznam and Naver which URLs to fetch.
 * Google does not participate — its indexing stays on the sitemap.
 *
 * The URL list is read from the deployed sitemap, so pages added later are
 * submitted without touching this script.
 *
 * Runs from the docs workflow after a Pages deploy, and standalone via
 * `node scripts/indexnow.mjs`.
 */

/**
 * The key is public by design — it is served verbatim at KEY_LOCATION, and
 * hosting that file is what proves control of the domain. It is not a
 * secret and must not be moved into one: a reader needs to be able to
 * check that this value and the deployed file agree.
 */
const KEY = "b2947bf41182ff1cb20adfc0232069e3";

const HOST = "orwa-mahmoud.github.io";

/**
 * The key lives at the host root rather than under /adapttable/, so it
 * authorises every project served from this domain. IndexNow requires the
 * key file to sit at or above every submitted URL.
 */
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const SITEMAP = `https://${HOST}/adapttable/sitemap.xml`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

async function readSitemap() {
  const res = await fetch(SITEMAP);
  if (!res.ok) {
    throw new Error(`sitemap ${SITEMAP} returned HTTP ${res.status}`);
  }
  const urls = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => m[1].trim()
  );
  if (urls.length === 0) {
    throw new Error(`sitemap ${SITEMAP} listed no <loc> entries`);
  }
  return urls;
}

async function submit(urlList) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList,
    }),
  });

  // 200 accepts the batch outright; 202 accepts it pending key validation.
  // Anything else means the submission did not land, and the most likely
  // cause — a missing or mismatched key file — stays broken silently unless
  // this exits non-zero.
  if (res.status !== 200 && res.status !== 202) {
    throw new Error(
      `IndexNow returned HTTP ${res.status} ${res.statusText}\n` +
        `${await res.text()}\n` +
        `Check that ${KEY_LOCATION} is live and contains exactly "${KEY}".`
    );
  }
  return res.status;
}

async function main() {
  const urls = await readSitemap();
  const status = await submit(urls);
  console.log(
    `indexnow: submitted ${urls.length} URLs, HTTP ${status}` +
      (status === 202 ? " (accepted, key validation pending)" : "")
  );
}

await main();
