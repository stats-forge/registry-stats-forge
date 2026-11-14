import type { DailyDownloads } from '../../common/downloads.ts';

/** The slice of a version's manifest the card reads. */
export interface LatestManifest {
  version: string;
  description?: string;
  license?: string | { type?: string };
  dependencies?: Record<string, string>;
  dist?: { unpackedSize?: number };
}

/** `GET downloads/range/{start}:{end}/{name}`: one entry per day. */
export interface DownloadsRange {
  downloads?: Array<DailyDownloads>;
}

/** What the npm card draws from: the latest version and the weeks of downloads before today. */
export interface NpmPackageData {
  name: string;
  /** The version the `latest` tag points at. */
  version: string;
  description: string | undefined;
  /** The SPDX expression, when the package declares one. */
  license: string | undefined;
  /** How many runtime dependencies the latest version declares. */
  dependencies: number;
  /** Bytes the latest version unpacks to, when the registry reports it. */
  unpackedSize: number | undefined;
  /** Downloads in the last seven days npm has counted. */
  weeklyDownloads: number;
  /** Downloads per week, oldest first; the last is `weeklyDownloads`. */
  weeks: Array<number>;
}
