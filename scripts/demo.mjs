#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Demo launcher – starts everything needed to show the app on this Mac.
//
//   npm run demo          phone emulator  (an Android Studio virtual phone)
//   npm run demo:tablet   tablet emulator (an Android Studio virtual tablet)
//   npm run demo:usb      your real Android phone over USB – mirror it in
//                         Android Studio: View → Tool Windows → Running Devices
//   npm run demo:wifi     your real phone over Wi-Fi – scan the QR code with Expo Go
//   npm run help          prints the list of commands
//
// Steps:
//   1. check the setup (server/.env, dependencies, Android SDK, free ports)
//   2. pick the device – booting the virtual phone/tablet if it isn't running
//   3. forward the device's localhost:4000 (backend) and :8081 (Expo) to this
//      Mac over USB (adb reverse), so no Wi-Fi is needed
//   4. start the backend and wait until it answers
//   5. start Expo, install Expo Go on the device if needed, open the app there
// Wi-Fi mode skips steps 2, 3 and the opening: no Android SDK needed, Expo
// shows a QR code and the phone reaches this Mac on its Wi-Fi IP address.
// Ctrl+C stops the backend and Expo; emulators keep running.
//
// Environment variables (optional):
//   AVD=<name>          virtual device to use instead of the automatic choice
//   BACKEND_PORT=4000   METRO_PORT=8081   ANDROID_HOME=~/Library/Android/sdk
// ─────────────────────────────────────────────────────────────────────────────
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import net from 'node:net';
import { homedir, networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SDK = process.env.ANDROID_HOME ?? join(homedir(), 'Library/Android/sdk');
const ADB = join(SDK, 'platform-tools/adb');
const EMULATOR = join(SDK, 'emulator/emulator');
const BACKEND_PORT = Number(process.env.BACKEND_PORT ?? 4000);
const METRO_PORT = Number(process.env.METRO_PORT ?? 8081);
const EXPO_GO = 'host.exp.exponent';

const HELP = `
Northpeak demo – commands (run from the project folder)

  npm run setup          Install dependencies (server/ and app/). Run once.

  npm run demo           Start the demo on the PHONE emulator.
  npm run demo:tablet    Start the demo on the TABLET emulator.
  npm run demo:usb       Start the demo on your real Android phone (USB cable,
                         USB debugging on). Mirror it in Android Studio:
                         View → Tool Windows → Running Devices → +
  npm run demo:wifi      Start the demo on your real phone over Wi-Fi (no cable):
                         scan the QR code with the Expo Go app. Phone and Mac
                         must be on the same Wi-Fi.

  npm run backend        Start only the backend (port 4000).
  npm run app            Start only Expo – then scan the QR code with Expo Go,
                         or press a to open the app on an emulator.

Each demo command starts the backend + Expo and opens the app on the device
(over Wi-Fi, you open it by scanning the QR code).
Press r in that terminal to reload the app, Ctrl+C to stop.
Emulators are the virtual devices in Android Studio → Device Manager.
`;

const MODE = process.argv.includes('--help')
  ? 'help'
  : process.argv.find((a) => a.startsWith('--device='))?.split('=')[1] ?? 'phone';
if (MODE === 'help') {
  console.log(HELP);
  process.exit(0);
}
if (!['phone', 'tablet', 'usb', 'wifi'].includes(MODE)) {
  console.error(`Unknown device "${MODE}". Use --device=phone, --device=tablet, --device=usb or --device=wifi.`);
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
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

async function waitFor(check, timeoutMs, what) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return;
    await sleep(2000);
  }
  fail(`Timed out waiting for ${what}.`);
}

// Android Studio's virtual devices: [{ name, tablet }]. Like Android itself, a
// device is a tablet when its smallest side is at least 600dp.
function virtualDevices() {
  const dir = join(homedir(), '.android/avd');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.ini'))
    .map((f) => {
      const name = f.replace(/\.ini$/, '');
      const path = readFileSync(join(dir, f), 'utf8').match(/^path=(.*)$/m)?.[1];
      const config = path && existsSync(join(path, 'config.ini')) ? readFileSync(join(path, 'config.ini'), 'utf8') : '';
      const value = (key) => Number(config.match(new RegExp(`^${key}=(\\d+)`, 'm'))?.[1] ?? 0);
      const density = value('hw.lcd.density') || 160;
      const smallestDp = (Math.min(value('hw.lcd.width'), value('hw.lcd.height')) * 160) / density;
      return { name, tablet: smallestDp >= 600 };
    });
}

// Connected devices: [{ serial, emulator, avd }]
function connectedDevices() {
  return adb('devices')
    .split('\n')
    .slice(1)
    .filter((line) => line.endsWith('\tdevice'))
    .map((line) => {
      const serial = line.split('\t')[0];
      const emulator = serial.startsWith('emulator-');
      return { serial, emulator, avd: emulator ? adb('-s', serial, 'emu', 'avd', 'name').split('\n')[0].trim() : null };
    });
}

// This Mac's address on the local network (Wi-Fi mode), e.g. 192.168.1.20
// (en0 is the Mac's Wi-Fi; other interfaces may be a VPN).
const lanIp = () => {
  const { en0, ...others } = networkInterfaces();
  return [...(en0 ?? []), ...Object.values(others).flat()].find((i) => i.family === 'IPv4' && !i.internal)?.address;
};

// ── 1. Setup checks ──────────────────────────────────────────────────────────
step('Checking the setup');
if (!existsSync(join(ROOT, 'server/.env'))) fail('server/.env is missing: cp server/.env.example server/.env and fill it in.');
if (!existsSync(join(ROOT, 'server/node_modules')) || !existsSync(join(ROOT, 'app/node_modules'))) {
  fail('Dependencies are missing: run npm run setup');
}
if (MODE !== 'wifi' && !existsSync(ADB)) fail(`Android SDK not found at ${SDK}. Install Android Studio, or set ANDROID_HOME.`);
for (const [port, what] of [
  [BACKEND_PORT, 'backend'],
  [METRO_PORT, 'Expo'],
]) {
  if (await portInUse(port)) {
    const pid = spawnSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' }).stdout.trim();
    fail(`Port ${port} (${what}) is already in use${pid ? ` by PID ${pid}` : ''}. Stop it first (Ctrl+C in its terminal, or kill ${pid}).`);
  }
}

// ── 2. Device ────────────────────────────────────────────────────────────────
let device;
if (MODE === 'wifi') {
  if (!lanIp()) fail('This Mac is not on a network. Join the same Wi-Fi as your phone.');
  step(`Wi-Fi mode: your phone will reach this Mac at ${lanIp()}`);
} else if (MODE === 'usb') {
  step('Looking for your Android phone on USB');
  await waitFor(() => (device = connectedDevices().find((d) => !d.emulator)), 30_000,
    'a phone. Connect it by USB, turn on Developer options → USB debugging, and accept the prompt on the phone');
} else {
  const avd =
    process.env.AVD ??
    virtualDevices().find((d) => d.tablet === (MODE === 'tablet'))?.name ??
    fail(`No virtual ${MODE} found. Create one in Android Studio → Device Manager → + (Create Virtual Device).`);
  device = connectedDevices().find((d) => d.avd === avd);
  if (device) {
    step(`Using the running ${MODE} emulator: ${avd}`);
  } else {
    step(`Booting the ${MODE} emulator: ${avd} (about a minute the first time)`);
    spawn(EMULATOR, ['-avd', avd, '-no-snapshot-save'], { detached: true, stdio: 'ignore' }).unref();
    await waitFor(() => (device = connectedDevices().find((d) => d.avd === avd)), 120_000, `the ${avd} emulator to appear`);
  }
}
if (device) {
  await waitFor(() => adb('-s', device.serial, 'shell', 'getprop', 'sys.boot_completed') === '1', 180_000, 'Android to finish booting');

  // ── 3. Port forwarding ─────────────────────────────────────────────────────
  // The app reaches the backend at "<Expo host>:4000". In --localhost mode that
  // host is localhost, which adb reverse maps back to this Mac.
  step(`Forwarding the device's localhost:${BACKEND_PORT} and :${METRO_PORT} to this Mac`);
  for (const port of [BACKEND_PORT, METRO_PORT]) adb('-s', device.serial, 'reverse', `tcp:${port}`, `tcp:${port}`);
}

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

// ── 5. Expo + open the app ───────────────────────────────────────────────────
// Over USB and on emulators Expo serves on localhost (forwarded in step 3);
// over Wi-Fi it serves on the Mac's network address (--lan).
step('Starting Expo');
const host = MODE === 'wifi' ? lanIp() : 'localhost';
const expo = spawn('npx', ['expo', 'start', MODE === 'wifi' ? '--lan' : '--localhost', '--port', String(METRO_PORT)], {
  cwd: join(ROOT, 'app'),
  env: { ...process.env, ...(BACKEND_PORT !== 4000 && { EXPO_PUBLIC_BACKEND_URL: `http://${host}:${BACKEND_PORT}` }) },
  stdio: 'inherit',
});
await waitFor(() => portInUse(METRO_PORT), 60_000, 'Expo to start');

if (MODE === 'wifi') {
  console.log(`
  Ready. On your phone: open Expo Go → Scan QR code, and scan the QR code Expo shows
  (or type exp://${host}:${METRO_PORT} under "Enter URL manually").
  Phone and Mac must be on the same Wi-Fi. If the phone can't connect: allow
  "node" when macOS asks about incoming connections, and avoid guest or office
  Wi-Fi that isolates devices (a phone hotspot works).
  Press r here to reload the app, Ctrl+C to stop the backend and Expo.
`);
} else {
  // Expo Go runs the app. Expo downloads it into ~/.expo/android-apk-cache the
  // first time it opens a project on Android; we reuse that copy for new devices.
  if (!adb('-s', device.serial, 'shell', 'pm', 'list', 'packages', EXPO_GO).includes(EXPO_GO)) {
    const cache = join(homedir(), '.expo/android-apk-cache');
    const apk = existsSync(cache) && readdirSync(cache).filter((f) => f.endsWith('.apk')).sort().pop();
    if (!apk) fail('Expo Go is not installed on the device. Press a in the Expo output above to install it once, then run this again.');
    step(`Installing Expo Go on the device (${apk})`);
    adb('-s', device.serial, 'install', '-r', join(cache, apk));
  }

  // Open the project in Expo Go on exactly this device (Expo's own "press a"
  // opens the first device it finds, which may not be the one you chose).
  // The two flags are the ones Expo itself adds: no developer-menu intro and no
  // floating gear button – cleaner for an audience. (⌘M still opens the menu.)
  step(`Opening the app on ${device.avd ?? device.serial}`);
  const url = `exp://127.0.0.1:${METRO_PORT}?__expo_disable_onboarding=1&__expo_disable_fab=1`;
  adb('-s', device.serial, 'shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', `'${url}'`);
  console.log('\n  Ready. Press r here to reload the app, Ctrl+C to stop the backend and Expo.\n');
}

// ── Clean shutdown ───────────────────────────────────────────────────────────
function stop() {
  backend.kill();
  expo.kill();
  console.log('\nStopped the backend and Expo. Emulators are still running.');
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
expo.on('exit', stop);
