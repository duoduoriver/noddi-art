#!/usr/bin/env python3
"""
Scaffold a new page in duoduohe-tanstack.

Examples:
  python .agents/skills/tanstack-page-builder/scripts/create_page.py \\
    --type content \\
    --route "/ai-tools" \\
    --title "AI Tools" \\
    --description "Explore our AI-powered tools."

  python .agents/skills/tanstack-page-builder/scripts/create_page.py \\
    --type marketing \\
    --route "/features/seo" \\
    --title "SEO Tools" \\
    --description "Built-in SEO for your SaaS."
"""

from __future__ import annotations

import argparse
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse


def _repo_root() -> Path:
    # .../.agents/skills/tanstack-page-builder/scripts/create_page.py
    return Path(__file__).resolve().parents[4]


def _normalize_route(route_or_url: str) -> str:
    raw = (route_or_url or "").strip()
    if not raw:
        raise ValueError("route is required")

    if "://" in raw:
        parsed = urlparse(raw)
        raw = parsed.path or "/"

    raw = raw.split("?", 1)[0].split("#", 1)[0]
    if not raw.startswith("/"):
        raw = "/" + raw
    raw = re.sub(r"/{2,}", "/", raw)
    return raw


def _slug_from_route(route: str) -> str:
    slug = route.strip().strip("/")
    if not slug:
        raise ValueError("route resolves to empty slug; use a non-root path")
    if ".." in slug:
        raise ValueError(f"invalid slug: {slug}")
    return slug


def _route_key(slug: str) -> str:
    parts = re.split(r"[-/]", slug)
    return "".join(p[:1].upper() + p[1:] for p in parts if p)


def _escape_ts(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'")


def _content_markdown(title: str, description: str, keywords: list[str]) -> str:
    today = date.today().isoformat()
    kw_line = ", ".join(keywords) if keywords else "TODO: keywords"
    return f"""---
title: {title}
description: {description}
date: {today}
---

## Overview

{description}

<!-- TODO: expand body copy. Keywords: {kw_line} -->

## Next steps

Add more sections here. This page is rendered via Content Collections and `MarkdownPage`.
"""


def _content_route_tsx(route: str, slug: str, group: str) -> str:
    route_id = f"/({group})/{slug}"
    path = route if route.startswith("/") else f"/{route}"
    return f"""import {{ createFileRoute, notFound }} from '@tanstack/react-router';
import Container from '@/components/layout/container';
import {{ MarkdownPage }} from '@/components/page/markdown-page';
import {{ getPageContent }} from '@/api/content';
import {{ websiteConfig }} from '@/config/website';
import {{ seo }} from '@/lib/seo';

export const Route = createFileRoute('{route_id}')({{
  loader: async () => {{
    const page = await getPageContent({{ data: {{ slug: '{slug}' }} }});
    if (!page) throw notFound();
    return {{ page }};
  }},
  head: ({{ loaderData }}) => {{
    const p = loaderData?.page;
    if (!p) return {{}};
    return seo('{path}', {{
      title: `${{p.title}} | ${{websiteConfig.metadata?.name}}`,
      description: p.description,
    }});
  }},
  component: ContentPage,
}});

function ContentPage() {{
  const {{ page }} = Route.useLoaderData();
  if (!page) throw notFound();
  return (
    <Container className="py-16 px-4">
      <MarkdownPage page={{page}} />
    </Container>
  );
}}
"""


def _marketing_route_tsx(route: str, slug: str, title: str, description: str) -> str:
    route_id = f"/(pages)/{slug}"
    path = route if route.startswith("/") else f"/{route}"
    t = _escape_ts(title)
    d = _escape_ts(description)
    return f"""import {{ createFileRoute }} from '@tanstack/react-router';
import Container from '@/components/layout/container';
import CallToActionSection from '@/components/blocks/calltoaction';
import FaqSection from '@/components/blocks/faqs';
import {{ websiteConfig }} from '@/config/website';
import {{ seo }} from '@/lib/seo';

const m = {{
  title: '{t}',
  description: '{d}',
}};

export const Route = createFileRoute('{route_id}')({{
  head: () =>
    seo('{path}', {{
      title: `${{m.title}} | ${{websiteConfig.metadata?.name}}`,
      description: m.description,
    }}),
  component: MarketingPage,
}});

function MarketingPage() {{
  return (
    <Container className="py-16 px-4">
      <div className="mx-auto max-w-4xl space-y-12 pb-16">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight">{{m.title}}</h1>
          <p className="text-lg text-muted-foreground">{{m.description}}</p>
        </div>
        {{/* TODO: customize sections or add feature copy */}}
        <FaqSection />
        <CallToActionSection />
      </div>
    </Container>
  );
}}
"""


def _patch_routes_ts(routes_path: Path, key: str, route: str, *, force: bool) -> None:
    text = routes_path.read_text(encoding="utf-8")
    entry = f"  {key}: '{route}',"
    if f"{key}:" in text:
        if force:
            text = re.sub(
                rf"  {re.escape(key)}: '[^']*',?\n",
                entry + "\n",
                text,
                count=1,
            )
        else:
            print(f"Routes.{key} already exists; skipping", file=sys.stderr)
            return
    else:
        marker = "  // Auth routes"
        if marker not in text:
            raise RuntimeError(f"Could not find insertion point in {routes_path}")
        text = text.replace(marker, entry + "\n\n" + marker, 1)
    routes_path.write_text(text, encoding="utf-8")


def _patch_sitemap(sitemap_path: Path, route: str, *, force: bool) -> None:
    text = sitemap_path.read_text(encoding="utf-8")
    path = route if route.startswith("/") else f"/{route}"
    entry = f"{{ path: '{path}', changefreq: 'monthly' }},"
    if f"path: '{path}'" in text:
        if not force:
            print(f"Sitemap already includes {path}; skipping", file=sys.stderr)
            return
    else:
        anchor = "{ path: '/cookie', changefreq: 'monthly' },"
        if anchor not in text:
            raise RuntimeError(f"Could not find sitemap insertion point in {sitemap_path}")
        text = text.replace(anchor, anchor + "\n          " + entry, 1)
    sitemap_path.write_text(text, encoding="utf-8")


def _write_file(path: Path, content: str, *, force: bool) -> None:
    if path.exists() and not force:
        raise FileExistsError(f"Refusing to overwrite {path} (use --force)")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"Wrote {path}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a new duoduohe-tanstack page")
    parser.add_argument("--type", choices=["content", "marketing"], default="content")
    parser.add_argument("--route", required=True, help="e.g. /ai-tools or /features/seo")
    parser.add_argument("--title", required=True)
    parser.add_argument("--description", required=True)
    parser.add_argument("--keywords", default="", help="Comma-separated keywords")
    parser.add_argument(
        "--legal",
        action="store_true",
        help="Place content route under (legals) group instead of (pages)",
    )
    parser.add_argument("--force", action="store_true", help="Overwrite existing files")
    args = parser.parse_args()

    root = _repo_root()
    route = _normalize_route(args.route)
    slug = _slug_from_route(route)
    key = _route_key(slug)
    keywords = [k.strip() for k in args.keywords.split(",") if k.strip()]

    group = "legals" if args.legal else "pages"
    route_path = root / "src/routes" / f"({group})" / Path(f"{slug}.tsx")

    try:
        if args.type == "content":
            md_path = root / "content/pages" / Path(f"{slug}.md")
            _write_file(md_path, _content_markdown(args.title, args.description, keywords), force=args.force)
            _write_file(
                route_path,
                _content_route_tsx(route, slug, group),
                force=args.force,
            )
        else:
            _write_file(
                route_path,
                _marketing_route_tsx(route, slug, args.title, args.description),
                force=args.force,
            )

        _patch_routes_ts(root / "src/lib/routes.ts", key, route, force=args.force)
        _patch_sitemap(root / "src/routes/sitemap[.]xml.ts", route, force=args.force)
    except FileExistsError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(f"\nDone. Routes.{key} = '{route}'")
    print("Next: fill TODO markers, then run `pnpm build`")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
