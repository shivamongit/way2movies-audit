/**
 * Run in browser console on beta.way2movies.live after Cloudflare verify.
 * Network audit only — records HTTP status/timing and source metadata shapes.
 */
(async () => {
  const TOKEN =
    "G_rMbPm8Tz13RvVKCtnLHwgkbLJTigb6F7MX3K6R2QdfRScSKb2VZT5YcbxA";
  const TMDB = 11436;
  const PRIMARY_SERVER = 39;
  const FALLBACK_SERVERS = [42, 45, 53, 58, 63, 69, 74, 79];
  const SERVERS = [PRIMARY_SERVER, ...FALLBACK_SERVERS];
  const SCRAPER_Q =
    "title=Bigg+Boss&year=2006&imdb_id=tt1281973&original_language=hi";
  const BASE = "https://beta.way2movies.live";

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function summarizeSourceBody(body) {
    if (!body || typeof body !== "object") {
      return { kind: "non_object" };
    }
    if (body.error) {
      return {
        kind: "error",
        statusCode: body.error.statusCode ?? null,
        message: body.error.message ?? null,
      };
    }
    const sources = body.sources ?? body.data ?? body.streams ?? null;
    const list = Array.isArray(sources) ? sources : null;
    return {
      kind: list ? "sources" : "other",
      topKeys: Object.keys(body).slice(0, 12),
      sourceCount: list ? list.length : null,
      sampleTypes: list
        ? [...new Set(list.map((s) => s?.type || s?.label || s?.name).filter(Boolean))].slice(
            0,
            5
          )
        : null,
    };
  }

  async function probeScraper(episode, serverId) {
    const url = `https://scraper.way2movies.fun/server/${serverId}/tv/${TMDB}/10/${episode}?${SCRAPER_Q}`;
    const t0 = performance.now();
    const res = await fetch(url);
    const ms = Math.round(performance.now() - t0);
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = { parseError: true };
    }
    const summary = summarizeSourceBody(body);
    const ok = res.ok && summary.kind === "sources" && (summary.sourceCount ?? 0) > 0;
    return { serverId, url, status: res.status, ms, ok, summary };
  }

  async function probeWatch(episode) {
    const path = `/watch/tv/${TOKEN}/10/${episode}?server=${PRIMARY_SERVER}`;
    const t0 = performance.now();
    const res = await fetch(path, { credentials: "include" });
    const ms = Math.round(performance.now() - t0);
    return {
      episode,
      watchUrl: `${BASE}${path}`,
      watchStatus: res.status,
      watchOk: res.ok,
      watchMs: ms,
    };
  }

  const apiT0 = performance.now();
  const seasonRes = await fetch(
    `https://api.way2movies.fun/series/${TMDB}/season/10`
  );
  const apiMs = Math.round(performance.now() - apiT0);
  const season = await seasonRes.json();
  const episodes = season.episodes ?? [];
  const numbers = episodes.map((e) => e.episode_number).sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i <= 106; i++) {
    if (!numbers.includes(i)) gaps.push(i);
  }

  const watch = [];
  for (let ep = 1; ep <= 106; ep++) {
    watch.push(await probeWatch(ep));
    if (ep % 10 === 0) await sleep(120);
  }

  const scraper = [];
  for (let ep = 1; ep <= 106; ep++) {
    const row = { episode: ep, attempts: [], resolvedServer: null };
    for (const sid of SERVERS) {
      const attempt = await probeScraper(ep, sid);
      row.attempts.push({
        serverId: attempt.serverId,
        status: attempt.status,
        ms: attempt.ms,
        ok: attempt.ok,
        summary: attempt.summary,
      });
      if (attempt.ok) {
        row.resolvedServer = sid;
        row.sourceCount = attempt.summary.sourceCount;
        break;
      }
      await sleep(800);
    }
    scraper.push(row);
    await sleep(400);
  }

  const report = {
    meta: {
      series: "Bigg Boss",
      tmdbId: TMDB,
      imdbId: "tt1281973",
      season: 10,
      primaryServer: PRIMARY_SERVER,
      fallbackServers: FALLBACK_SERVERS,
      auditedAt: new Date().toISOString(),
    },
    api: {
      url: `https://api.way2movies.fun/series/${TMDB}/season/10`,
      status: seasonRes.status,
      responseMs: apiMs,
      episodeCount: episodes.length,
      expectedCount: 106,
      gaps,
      airDateFirst: episodes.find((e) => e.episode_number === 1)?.air_date,
      airDateLast: episodes.find((e) => e.episode_number === 106)?.air_date,
    },
    episodes: episodes.map((e) => ({
      episode_number: e.episode_number,
      name: e.name,
      air_date: e.air_date,
      runtime: e.runtime,
      tmdb_episode_id: e.id,
    })),
    watch,
    scraper,
  };

  console.log(JSON.stringify(report));
  return report;
})();
