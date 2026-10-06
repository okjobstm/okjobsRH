"""
Admin-side e2e on the CEO job. Mints a Supabase session cookie via Node, then
drives Playwright through the redesigned role page to verify each tab and the
context menus render.

Run:
    cd /path/to/recruit
    set -a; source .env.test; set +a
    python3 tests/e2e/test_ceo_admin_e2e.py
"""

import json
import os
import subprocess
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect, Page

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
ROOT = Path(__file__).resolve().parents[2]
SHOTS = ROOT / "tests/e2e/screenshots/ceo_admin"
SHOTS.mkdir(parents=True, exist_ok=True)
CEO_JOB_ID = "cmo2x24uj0000mj6j4gnq63wx"


def shot(page: Page, name: str):
    p = SHOTS / f"{name}.png"
    page.screenshot(path=str(p), full_page=True)
    print(f"    📸 {p.name}")


def mint_session() -> dict:
    result = subprocess.run(
        ["node", "tests/e2e/mint_admin_session.mjs"],
        cwd=str(ROOT),
        env={**os.environ},
        capture_output=True,
        text=True,
        timeout=15,
    )
    if result.returncode != 0:
        raise RuntimeError(f"mint_admin_session failed: {result.stderr}")
    return json.loads(result.stdout.strip().splitlines()[-1])


def delete_session(email: str):
    subprocess.run(
        ["node", "-e",
         """
         const { PrismaClient } = require('@prisma/client');
         const { PrismaPg } = require('@prisma/adapter-pg');
         const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
         const prisma = new PrismaClient({ adapter });
         (async () => {
           await prisma.adminSession.deleteMany({ where: { email: process.env.EMAIL } }).catch(() => {});
           await prisma.$disconnect();
         })();
         """],
        env={**os.environ, "EMAIL": email},
        capture_output=True,
        text=True,
        timeout=10,
    )


def main():
    print("\n" + "═" * 64)
    print("  Recruit — CEO admin-side e2e")
    print("═" * 64)
    print(f"  Target: {BASE_URL}")

    sess = mint_session()
    print(f"  Session: {sess['email']} ({len(sess['cookies'])} cookie(s))")
    print()

    failed = False
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        ctx.add_cookies([
            {
                "name": cookie["name"],
                "value": cookie["value"],
                "domain": "localhost",
                "path": "/",
                "secure": True,
                "httpOnly": True,
                "sameSite": "Lax",
            }
            for cookie in sess["cookies"]
        ])
        page = ctx.new_page()

        try:
            print("  → /admin (dashboard)")
            page.goto(f"{BASE_URL}/admin", wait_until="domcontentloaded")
            expect(page.locator("text=Pipeline overview")).to_be_visible(timeout=10_000)
            shot(page, "01_dashboard")

            print("  → Sidebar shows CEO row")
            ceo_link = page.locator(f'a[href="/admin/jobs/{CEO_JOB_ID}"]').first
            expect(ceo_link).to_be_visible()

            print("  → /admin/jobs/CEO?tab=candidates (default)")
            page.goto(f"{BASE_URL}/admin/jobs/{CEO_JOB_ID}", wait_until="domcontentloaded")
            expect(page.locator("h1:has-text('CEO')")).to_be_visible(timeout=10_000)
            expect(page.locator("text=All").first).to_be_visible()
            expect(page.locator("text=Submitted").first).to_be_visible()
            shot(page, "02_role_candidates")

            print("  → ?tab=invites")
            page.goto(f"{BASE_URL}/admin/jobs/{CEO_JOB_ID}?tab=invites", wait_until="domcontentloaded")
            expect(page.locator("text=Reusable invite link")).to_be_visible(timeout=10_000)
            shot(page, "03_role_invites")

            print("  → ?tab=setup")
            page.goto(f"{BASE_URL}/admin/jobs/{CEO_JOB_ID}?tab=setup", wait_until="domcontentloaded")
            expect(page.locator("text=Job description")).to_be_visible(timeout=10_000)
            expect(page.locator("text=Role questions")).to_be_visible()
            expect(page.locator("text=Danger zone")).to_be_visible()
            shot(page, "04_role_setup")

            print("  → Audit log")
            page.goto(f"{BASE_URL}/admin/jobs/{CEO_JOB_ID}/audit", wait_until="domcontentloaded")
            expect(page.locator("text=Audit log")).to_be_visible(timeout=10_000)
            shot(page, "05_audit")

            print("  → Stat-chip filter jump (shortlisted)")
            page.goto(f"{BASE_URL}/admin/jobs/{CEO_JOB_ID}?tab=candidates&filter=shortlisted", wait_until="domcontentloaded")
            shot(page, "06_filter_shortlisted")

            print("\n  ALL CHECKS PASSED")

        except Exception as e:
            failed = True
            try:
                shot(page, "ZZ_failure")
                print(f"\n  FAILURE: {e}")
                print(f"  Last URL: {page.url}")
            except Exception:
                pass

        finally:
            ctx.close()
            browser.close()

    delete_session(sess["email"])
    print(f"  → Cleaned up session {sess['email']}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
