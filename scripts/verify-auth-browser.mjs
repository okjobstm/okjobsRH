import { spawn } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const chromePath = process.argv[2];
const origin = process.argv[3] ?? "http://localhost:3100";
if (!chromePath) throw new Error("Usage: node scripts/verify-auth-browser.mjs <chrome-path> [origin]");

const port = 9333;
const profile = await mkdtemp(path.join(os.tmpdir(), "okjobs-auth-qa-"));
const output = path.resolve("docs/design-references/lobbystack-local/auth");
await mkdir(output, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "about:blank",
], { stdio: "ignore", windowsHide: true });

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function getTarget() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
      const page = targets.find((target) => target.type === "page");
      if (page?.webSocketDebuggerUrl) return page;
    } catch {
      // Chrome is still starting.
    }
    await pause(100);
  }
  throw new Error("Chrome DevTools endpoint did not start.");
}

const failures = [];
let socket;

try {
  const target = await getTarget();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let commandId = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id) return;
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result);
  });

  function command(method, params = {}) {
    const id = ++commandId;
    socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  }

  async function evaluate(expression) {
    const result = await command("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    return result.result.value;
  }

  async function open(route, viewport) {
    await command("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.width < 768,
    });
    await command("Page.navigate", { url: `${origin}${route}` });
    for (let attempt = 0; attempt < 80; attempt += 1) {
      if (await evaluate("document.readyState === 'complete'")) break;
      await pause(100);
    }
    await pause(250);
  }

  async function screenshot(name) {
    const result = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
    await writeFile(path.join(output, name), Buffer.from(result.data, "base64"));
  }

  await command("Page.enable");
  await command("Runtime.enable");

  await open("/login", { width: 390, height: 844 });
  const mobile = await evaluate(`(() => ({
    heading: document.querySelector('h1')?.textContent?.trim(),
    email: Boolean(document.querySelector('#auth-email')),
    password: Boolean(document.querySelector('#auth-password')),
    forgot: document.querySelector('a[href="/forgot-password"]')?.textContent?.trim(),
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    viewport: [window.innerWidth, window.innerHeight]
  }))()`);
  if (mobile.heading !== "Bon retour") failures.push("mobile login heading mismatch");
  if (!mobile.email || !mobile.password) failures.push("mobile login fields missing");
  if (!mobile.forgot) failures.push("mobile forgot-password link missing");
  if (mobile.overflow > 1) failures.push(`mobile horizontal overflow: ${mobile.overflow}px`);
  if (mobile.viewport[0] !== 390) failures.push(`mobile viewport mismatch: ${mobile.viewport[0]}px`);
  await screenshot("login-mobile-390.png");

  await open("/signup", { width: 1440, height: 1000 });
  const initialSignup = await evaluate(`(() => ({
    heading: document.querySelector('h1')?.textContent?.trim(),
    disabled: document.querySelector('button[type="submit"]')?.disabled,
    segments: document.querySelectorAll('nav[aria-label*="étape"] li').length
  }))()`);
  if (initialSignup.heading !== "Créer votre compte") failures.push("signup heading mismatch");
  if (!initialSignup.disabled) failures.push("signup button should start disabled");
  if (initialSignup.segments !== 8) failures.push("signup progress should contain 8 segments");

  await evaluate(`(() => {
    const setValue = (selector, value) => {
      const input = document.querySelector(selector);
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    setValue('#auth-email', 'admin@example.com');
    document.querySelector('input[name="role"][value="CANDIDATE"]').click();
    document.querySelector('#auth-password').focus();
    document.querySelector('#auth-password').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    setValue('#auth-password', 'Password!1');
  })()`);
  await pause(250);
  const completedSignup = await evaluate(`(() => ({
    disabled: document.querySelector('button[type="submit"]')?.disabled,
    criteria: [...document.querySelectorAll('ul[aria-live="polite"] li')].map((item) => item.textContent.trim()),
    roles: document.querySelectorAll('input[name="role"]').length
  }))()`);
  if (completedSignup.disabled) failures.push("valid signup values did not enable submit");
  if (completedSignup.criteria.length !== 3) failures.push("signup password criteria missing");
  if (completedSignup.roles !== 3) failures.push("signup role choices missing");
  await screenshot("signup-desktop-1440.png");

  await open("/forgot-password", { width: 768, height: 900 });
  const forgot = await evaluate(`(() => ({
    heading: document.querySelector('h1')?.textContent?.trim(),
    back: document.querySelector('a[href="/login"]')?.textContent?.trim()
  }))()`);
  if (forgot.heading !== "Réinitialiser votre mot de passe") failures.push("forgot-password heading mismatch");
  if (!forgot.back) failures.push("forgot-password return link missing");

  if (failures.length) throw new Error(failures.join("\n"));
  console.log("Auth browser QA passed: 390px mobile, signup validation, recovery route and screenshots.");
} finally {
  socket?.close();
  chrome.kill();
  const resolvedProfile = path.resolve(profile);
  if (resolvedProfile.startsWith(path.resolve(os.tmpdir()) + path.sep)) {
    await rm(resolvedProfile, { recursive: true, force: true }).catch(() => undefined);
  }
}
