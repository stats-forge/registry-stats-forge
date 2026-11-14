/** The slice of `GET /crates/{name}?include=default_version,downloads` the card reads. */
export interface CrateResponse {
  crate: {
    name: string;
    description: string | null;
    downloads: number;
    recent_downloads: number | null;
    num_versions: number;
    default_version: string;
  };
  versions?: Array<{
    num: string;
    license: string | null;
    rust_version: string | null;
  }>;
}

/** `GET /crates/{name}/downloads`: the top versions' days, and the rest summed per day. */
export interface CrateDownloadsResponse {
  version_downloads?: Array<{ date: string; downloads: number }>;
  meta?: { extra_downloads?: Array<{ date: string; downloads: number }> };
}

/** What the crate card draws from: the default version and the last ninety days of downloads. */
export interface CrateData {
  name: string;
  /** The version crates.io shows by default: the highest stable one, unless none is. */
  version: string;
  description: string | undefined;
  /** The SPDX expression the default version declares. */
  license: string | undefined;
  /** Downloads of every version, ever. */
  downloads: number;
  /** Downloads of every version in the last ninety days. */
  recentDownloads: number;
  /** How many versions were published, yanked ones included. */
  versions: number;
  /** The default version's `rust-version`, the oldest toolchain it builds with. */
  msrv: string | undefined;
  /** Downloads per week, oldest first. */
  weeks: Array<number>;
}
