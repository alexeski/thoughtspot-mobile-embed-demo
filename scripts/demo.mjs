#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// One-command demo launcher.
//
//   npm run demo          → Android emulator (boots one if none is running)
//   npm run demo:phone    → your Android phone over USB (mirror it in Android
//                           Studio: View → Tool Windows → Running Devices)
//
// What it does:
//   1. checks the setup (server/.env, dependencies, Android SDK, free ports)
//   2. finds the device – or boots the first Android Studio virtual device
//   3. forwards the device's localhost:4000 and :8081 to this Mac (adb reverse),
//      so the app reaches the backend and Metro over USB – no Wi-Fi needed
//   4. starts the backend, waits until it answers
//   5. starts Expo and opens the app on the device (interactive: r = reload)
// Ctrl+C stops the backend and Expo; the emulator keeps running.
//
// Options (environment variables):
//   AVD=<name>           virtual device to boot (default: the first one)
//   BACKEND_PORT=4000    backend port      METRO_PORT=8081   Expo/Metro port
//   ANDROID_HOME=…       Android SDK path (default: ~/Library/Android/sdk)
// ─────────────────────────────────────────────────────────────────────────────
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import net from 'node:net';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const USE_PHONE = process.argv.includes('--phone');
const SDK = process.env.ANDROID_HOME ?? join(homedir(), 'Library/Android/sdk');
const ADB = join(SDK, 'platform-tools/adb');
const EMULATOR = join(SDK, 'emulator/emulator');
const BACKEND_PORT = Number(process.env.BACKEND_PORT ?? 4000);
const METRO_PORT = Number(process.env.METRO_PORT ?? 8081);

const step = (msg) => console.log(`\n▶ ${msg}`);
const fail = (msg) => {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const adb = (...args) => spawnSync(ADB, args, { encoding: 'utf8' }).stdout?.trim() ?? '';

// Is something already listening on this port?
const portInUse = (port) =>
  new Promise((resolve) => {
    const socket = net.connect(port, '127.0.0.1');
    socket.once('connect', () => (socket.destroy(), resolve(true)));
    socket.once('error', () => resolve(false));
  });

// Connected devices: [{ serial, emulator }]
function devices() {
  return adb('devices')
    .split('\n')
    .slice(1)
    .filter((line) => line.endsWith('\tdevice'))
    .map((line) => line.split('\t')[0])
    .map((serial) => ({ serial, emulator: serial.startsWith('emulator-') }));
}

async function waitFor(check, timeoutMs, what) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return;
    await sleep(2000);
  }
  fail(`Timed out waiting for ${what}.`);
}

// ── 1. Setup checks ──────────────────────────────────────────────────────────
step('Checking the setup');
if (!existsSync(join(ROOT, 'server/.env'))) fail('server/.env is missing: cp server/.env.example server/.env and fill it in.');
if (!existsSync(join(ROOT, 'server/node_modules')) || !existsSync(join(ROOT, 'app/node_modules'))) {
  fail('Dependencies are missing: run npm run setup');
}
if (!existsSync(ADB)) fail(`Android SDK not found at ${SDK}. Install Android Studio, or set ANDROID_HOME.`);

for (const [port, what] of [
  [BACKEND_PORT, 'backend'],
  [METRO_PORT, 'Expo/Metro'],
]) {
  if (await portInUse(port)) {
    const pid = spawnSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' }).stdout.trim();
    fail(`Port ${port} (${what}) is already in use${pid ? ` by PID ${pid}` : ''}. Stop it first (Ctrl+C in its terminal, or kill ${pid}).`);
  }
}

// ── 2. Device ────────────────────────────────────────────────────────────────
let device;
if (USE_PHONE) {
  step('Looking for your Android phone on USB');
  await waitFor(() => (device = devices().find((d) => !d.emulator)), 30_000,
    'a phone. Connect it by USB, enable Developer options → USB debugging, and accept the prompt on the phone');
} else {
  device = devices().find((d) => d.emulator);
  if (device) {
    step(`Using the running emulator (${device.serial})`);
  } else {
    const avds = spawnSync(EMULATOR, ['-list-avds'], { encoding: 'utf8' }).stdout.split('\n').filter(Boolean);
    const avd = process.env.AVD ?? avds[0];
    if (!avd) fail('No virtual device found. Create one in Android Studio → Device Manager.');
    step(`Booting the ${avd} emulator (the first boot takes a minute)`);
    spawn(EMULATOR, ['-avd', avd, '-no-snapshot-save'], { detached: true, stdio: 'ignore' }).unref();
    await waitFor(() => (device = devices().find((d) => d.emulator)), 120_000, 'the emulator to appear');
  }
}
await waitFor(() => adb('-s', device.serial, 'shell', 'getprop', 'sys.boot_completed') === '1', 180_000, 'Android to finish booting');

// ── 3. Port forwarding ───────────────────────────────────────────────────────
// The app reaches the backend at "<Metro host>:4000". With Expo in --localhost
// mode that host is localhost, which adb reverse maps back to this Mac.
step(`Forwarding the device's localhost:${BACKEND_PORT} and :${METRO_PORT} to this Mac`);
for (const port of [BACKEND_PORT, METRO_PORT]) adb('-s', device.serial, 'reverse', `tcp:${port}`, `tcp:${port}`);

// ── 4. Backend ───────────────────────────────────────────────────────────────
step(`Starting the backend on port ${BACKEND_PORT}`);
const backend = spawn('npm', ['start'], {
  cwd: join(ROOT, 'server'),
  env: { ...process.env, PORT: String(BACKEND_PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const prefix = (chunk) => process.stdout.write(chunk.toString().replace(/^(?=.)/gm, '[backend] '));
backend.stdout.on('data', prefix);
backend.stderr.on('data', prefix);
backend.on('exit', (code) => code && fail(`The backend stopped (exit code ${code}). See the [backend] lines above.`));
await waitFor(() => portInUse(BACKEND_PORT), 20_000, 'the backend to start');

// ── 5. Expo ──────────────────────────────────────────────────────────────────
step('Starting Expo and opening the app on the device');
const expo = spawn('npx', ['expo', 'start', '--localhost', '--android', '--port', String(METRO_PORT)], {
  cwd: join(ROOT, 'app'),
  env: {
    ...process.env,
    ANDROID_SERIAL: device.serial, // the device adb commands should target
    ...(BACKEND_PORT !== 4000 && { EXPO_PUBLIC_BACKEND_URL: `http://localhost:${BACKEND_PORT}` }),
  },
  stdio: 'inherit',
});

// ── Clean shutdown ───────────────────────────────────────────────────────────
function stop() {
  backend.kill();
  expo.kill();
  console.log('\nStopped the backend and Expo. The emulator is still running.');
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
expo.on('exit', stop);
