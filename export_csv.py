#!/usr/bin/env python3
"""Convert way2movies audit JSON to CSV summaries."""

import csv
import json
import sys
from pathlib import Path


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: export_csv.py audit.json", file=sys.stderr)
        sys.exit(1)

    path = Path(sys.argv[1])
    data = json.loads(path.read_text())

    out_dir = path.parent
    stem = path.stem

    episodes_path = out_dir / f"{stem}-episodes.csv"
    watch_path = out_dir / f"{stem}-watch.csv"
    scraper_path = out_dir / f"{stem}-scraper.csv"

    with episodes_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "episode_number",
                "name",
                "air_date",
                "runtime",
                "tmdb_episode_id",
                "watch_url",
            ],
        )
        w.writeheader()
        watch_by_ep = {r["episode"]: r for r in data.get("watch", [])}
        token_path = "/watch/tv/G_rMbPm8Tz13RvVKCtnLHwgkbLJTigb6F7MX3K6R2QdfRScSKb2VZT5YcbxA/10"
        for ep in data.get("episodes", []):
            n = ep["episode_number"]
            w.writerow(
                {
                    **ep,
                    "watch_url": watch_by_ep.get(n, {}).get(
                        "watchUrl",
                        f"https://beta.way2movies.live{token_path}/{n}?server=39",
                    ),
                }
            )

    with watch_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["episode", "watchUrl", "watchStatus", "watchOk", "watchMs"],
        )
        w.writeheader()
        for row in data.get("watch", []):
            w.writerow(row)

    with scraper_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "episode",
                "resolvedServer",
                "sourceCount",
                "languages",
                "hosts",
                "formats",
                "primaryStatus",
                "primaryMs",
                "attempts",
            ],
        )
        w.writeheader()
        for row in data.get("scraper", []):
            attempts = row.get("attempts", [])
            primary = attempts[0] if attempts else {}
            summary = primary.get("summary") or {}
            w.writerow(
                {
                    "episode": row.get("episode"),
                    "resolvedServer": row.get("resolvedServer"),
                    "sourceCount": row.get("sourceCount"),
                    "languages": json.dumps(summary.get("languages")),
                    "hosts": "|".join(summary.get("hosts") or []),
                    "formats": "|".join(summary.get("formats") or []),
                    "primaryStatus": primary.get("status"),
                    "primaryMs": primary.get("ms"),
                    "attempts": len(attempts),
                }
            )

    print(f"Wrote {episodes_path}")
    print(f"Wrote {watch_path}")
    print(f"Wrote {scraper_path}")


if __name__ == "__main__":
    main()
