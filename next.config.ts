import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { readFileSync } from "node:fs";
import path from "node:path";

type LobbyStackManifest = {
  pages: Array<{ route: string; file: string }>;
  endpoints: Array<{ route: string; file: string }>;
  assetPrefixes: string[];
  topLevelFiles: string[];
};

function readLobbyStackManifest(): LobbyStackManifest {
  try {
    return JSON.parse(
      readFileSync(path.join(process.cwd(), "public", "_lobbystack-route-manifest.json"), "utf8")
    ) as LobbyStackManifest;
  } catch {
    return { pages: [], endpoints: [], assetPrefixes: [], topLevelFiles: [] };
  }
}

// Read after each dev-server configuration reload so newly generated public aliases are included.
const lobbyStackManifest = readLobbyStackManifest();

const sectorRedirects = [
  ["/solutions/ai-receptionist-for-appliance-repair", "/solutions/evaluation-techniciens-reparation"],
  ["/solutions/ai-receptionist-for-dental-offices", "/solutions/evaluation-professionnels-sante"],
  ["/solutions/ai-receptionist-for-electricians", "/solutions/evaluation-electriciens"],
  ["/solutions/ai-receptionist-for-garage-door-repair", "/solutions/evaluation-techniciens-maintenance"],
  ["/solutions/ai-receptionist-for-home-services", "/solutions/evaluation-metiers-services"],
  ["/solutions/ai-receptionist-for-hvac", "/solutions/evaluation-techniciens-cvc"],
  ["/solutions/ai-receptionist-for-locksmiths", "/solutions/evaluation-metiers-securite"],
  ["/solutions/ai-receptionist-for-plumbers", "/solutions/evaluation-plombiers"],
  ["/solutions/ai-receptionist-for-restoration-companies", "/solutions/evaluation-intervention-apres-sinistre"],
  ["/solutions/ai-receptionist-for-salons-and-spas", "/solutions/evaluation-relation-client"],
  ["/solutions/property-management-answering-service", "/solutions/evaluation-gestion-immobiliere"],
  ["/solutions/roofing-answering-service", "/solutions/evaluation-metiers-btp"],
  ["/solutions/after-hours-answering-service-for-contractors", "/solutions/evaluation-equipes-terrain"],
] as const;

const nextConfig: NextConfig = {
  // Keep development assets separate from production builds. Running `next build`
  // while the local server is open otherwise replaces its CSS/chunks and can leave
  // pages rendered as unstyled HTML until the server is restarted.
  distDir:
    process.env.NEXT_DIST_DIR ??
    (process.env.NODE_ENV === "development" ? ".next-dev" : ".next"),
  experimental: {},
  serverExternalPackages: ["pdfkit", "pdf-parse", "pdfjs-dist", "mammoth"],
  async redirects() {
    return ["", "/fr", "/es", "/sr"].flatMap((locale) =>
      sectorRedirects.map(([source, destination]) => ({
        source: `${locale}${source}`,
        destination: `${locale}${destination}`,
        permanent: true,
      }))
    );
  },
  async rewrites() {
    const assetRewrites = lobbyStackManifest.assetPrefixes.map((prefix) => ({
      source: `/${prefix}/:path*`,
      destination: `/_lobbystack/${prefix}/:path*`,
    }));
    const fileRewrites = lobbyStackManifest.topLevelFiles.map((file) => ({
      source: `/${file}`,
      destination: `/_lobbystack/${file}`,
    }));
    const endpointRewrites = lobbyStackManifest.endpoints.map(({ route, file }) => ({
      source: route,
      destination: `/_lobbystack/${file}`,
    }));
    const pageRewrites = lobbyStackManifest.pages.flatMap(({ route, file }) => {
      const destination = `/_lobbystack/${file}`;
      if (route === "/") return [{ source: route, destination }];
      const withoutTrailingSlash = route.endsWith("/") ? route.slice(0, -1) : route;
      return [
        { source: withoutTrailingSlash, destination },
        { source: `${withoutTrailingSlash}/`, destination },
      ];
    });

    return {
      beforeFiles: [...assetRewrites, ...fileRewrites, ...endpointRewrites, ...pageRewrites],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      {
        source: "/_astro/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  tunnelRoute: "/monitoring",
});
