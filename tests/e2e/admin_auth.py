"""Authenticates a Playwright context as the E2E admin.

There is no password form any more: `/login` offers Google Sign-In through
Supabase Auth, and a browser cannot be driven through an OAuth round trip in a
sandbox. `mint_admin_session.mjs` does the equivalent server-side (admin API ->
one-time login link -> verify), so the session cookies it prints are real
Supabase cookies, the same ones the callback would have written.

Point this at a disposable project. It creates and authenticates a real auth
user, and writes an AdminSession row.

    set -a && source .env.test && set +a
"""

import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MINT = Path(__file__).resolve().parent / "mint_admin_session.mjs"


def mint() -> dict:
    result = subprocess.run(
        ["node", str(MINT)],
        capture_output=True,
        text=True,
        cwd=ROOT,
        env=os.environ,
    )
    if result.returncode != 0:
        print(result.stdout, file=sys.stderr)
        sys.exit(f"mint_admin_session failed:\n{result.stderr.strip()}")
    return json.loads(result.stdout.strip().splitlines()[-1])


def authenticate(context) -> str:
    """Adds the admin session cookies to `context` before its first navigation.

    Returns the admin email.
    """
    session = mint()
    context.add_cookies(
        [
            {
                "name": cookie["name"],
                "value": cookie["value"],
                # Same host the app runs on in CI; wrong host and the cookie is
                # silently dropped, which looks like a failed sign-in.
                "domain": "localhost",
                "path": "/",
                "secure": True,
                "httpOnly": True,
                "sameSite": "Lax",
            }
            for cookie in session["cookies"]
        ]
    )
    return session["email"]
