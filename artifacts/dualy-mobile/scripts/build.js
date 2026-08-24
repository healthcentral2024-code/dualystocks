const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const staticRoot = path.join(projectRoot, 'static-build');
const basePath = (process.env.BASE_PATH || '/').replace(/\/+$/, '');
const metroPort = Number(process.env.METRO_BUILD_PORT || 8081);
let metroProcess = null;

function stripProtocol(value) {
  const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return new URL(normalized).host;
}

function getPublicDomain() {
  const candidate =
    process.env.REPLIT_INTERNAL_APP_DOMAIN ||
    process.env.REPLIT_DOMAINS?.split(',')[0] ||
    process.env.REPLIT_DEV_DOMAIN ||
    process.env.EXPO_PUBLIC_DOMAIN;

  if (!candidate) {
    throw new Error('No deployment domain is available for the Expo build');
  }

  return stripProtocol(candidate);
}

function publicUrl(domain, relativePath) {
  const cleanRelative = relativePath.replace(/^\/+/, '');
  return `https://${domain}${basePath}/${cleanRelative}`.replace(/([^:]\/)\/+/g, '$1');
}

async function waitForMetro() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://localhost:${metroPort}/status`, {
        signal: AbortSignal.timeout(2_000),
      });
      if (response.ok) return;
    } catch {
      // Metro is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error('Metro did not become ready within 60 seconds');
}

async function startMetro(env) {
  metroProcess = spawn(
    'pnpm',
    ['exec', 'expo', 'start', '--no-dev', '--minify', '--localhost', '--port', String(metroPort)],
    {
      cwd: projectRoot,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  metroProcess.stdout.on('data', (chunk) => process.stdout.write(`[Metro] ${chunk}`));
  metroProcess.stderr.on('data', (chunk) => process.stderr.write(`[Metro] ${chunk}`));
  await waitForMetro();
}

function localizeMetroUrl(rawUrl) {
  const url = new URL(rawUrl);
  url.protocol = 'http:';
  url.hostname = 'localhost';
  url.port = String(metroPort);
  return url.toString();
}

function extensionFor(asset, contentType) {
  if (asset.fileExtension) {
    return asset.fileExtension.startsWith('.') ? asset.fileExtension : `.${asset.fileExtension}`;
  }

  const byContentType = {
    'application/javascript': '.js',
    'application/json': '.json',
    'application/wasm': '.wasm',
    'font/otf': '.otf',
    'font/ttf': '.ttf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/svg+xml': '.svg',
    'image/webp': '.webp',
  };
  return byContentType[contentType?.split(';')[0]] || '';
}

async function persistAsset(asset, platform, index, domain, kind) {
  const sourceUrl = localizeMetroUrl(asset.url);
  const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(300_000) });
  if (!response.ok) {
    throw new Error(`Failed to download ${kind} for ${platform}: HTTP ${response.status}`);
  }

  const contentType = asset.contentType || response.headers.get('content-type') || '';
  const extension = extensionFor(asset, contentType);
  const digest = crypto.createHash('sha256').update(asset.url).digest('hex').slice(0, 24);
  const relativePath =
    kind === 'bundle'
      ? `bundles/${platform}${extension || '.js'}`
      : `assets/${asset.key || digest}-${index}${extension}`;
  const outputPath = path.join(staticRoot, relativePath);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()));

  return {
    ...asset,
    contentType,
    url: publicUrl(domain, relativePath),
  };
}

async function fetchManifest(platform) {
  const response = await fetch(`http://localhost:${metroPort}/`, {
    headers: {
      accept: 'application/json',
      'expo-platform': platform,
      'expo-protocol-version': '1',
    },
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${platform} manifest: HTTP ${response.status}`);
  }
  return response.json();
}

async function buildPlatform(platform, domain) {
  console.log(`Building ${platform} manifest...`);
  const manifest = await fetchManifest(platform);

  if (!manifest.launchAsset?.url) {
    throw new Error(`${platform} manifest did not include a launch asset`);
  }

  manifest.launchAsset = await persistAsset(
    manifest.launchAsset,
    platform,
    0,
    domain,
    'bundle',
  );
  manifest.assets = await Promise.all(
    (manifest.assets || []).map((asset, index) =>
      persistAsset(asset, platform, index, domain, 'asset'),
    ),
  );

  if (manifest.extra?.expoClient) {
    manifest.extra.expoClient.hostUri = `${domain}${basePath}`;
  }

  const platformDir = path.join(staticRoot, platform);
  fs.mkdirSync(platformDir, { recursive: true });
  fs.writeFileSync(
    path.join(platformDir, 'manifest.json'),
    JSON.stringify(manifest),
  );
}

async function main() {
  const domain = getPublicDomain();
  const clerkProxyUrl = process.env.CLERK_PROXY_URL
    ? `https://${domain}${process.env.CLERK_PROXY_URL}`
    : '';
  const env = {
    ...process.env,
    EXPO_PUBLIC_DOMAIN: domain,
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || '',
    EXPO_PUBLIC_CLERK_PROXY_URL: clerkProxyUrl,
  };

  fs.rmSync(staticRoot, { recursive: true, force: true });
  fs.mkdirSync(staticRoot, { recursive: true });

  await startMetro(env);
  await Promise.all([
    buildPlatform('ios', domain),
    buildPlatform('android', domain),
  ]);
  console.log('Expo production build complete.');
}

function stopMetro() {
  if (metroProcess && !metroProcess.killed) metroProcess.kill('SIGTERM');
}

process.on('SIGINT', () => {
  stopMetro();
  process.exit(130);
});
process.on('SIGTERM', () => {
  stopMetro();
  process.exit(143);
});

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(stopMetro);