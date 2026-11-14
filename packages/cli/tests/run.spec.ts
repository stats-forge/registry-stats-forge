import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { CardConfig } from '@stats-forge/registry-stats-forge-core/api';
import type { FetchLike, Logger } from '@stats-forge/registry-stats-forge-core/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EXIT_RETRYABLE, run } from '../src/run.ts';
import type { Io } from '../src/run.ts';

const API = 'https://crates.io/api/v1/crates';

/** The slice of crates.io's answer the crate card reads. */
const SERDE = {
  crate: {
    name: 'serde',
    description: 'Serialization',
    downloads: 1,
    recent_downloads: 1,
    num_versions: 1,
    default_version: '1.0.0',
  },
};

/** @returns crates.io answering for serde alone, with no download history, or `status` for all. */
const cratesIo = (status = 200): FetchLike =>
  vi.fn<FetchLike>(async (input) => {
    if (input === `${API}/serde?include=default_version,downloads`) {
      return Promise.resolve(Response.json(SERDE, { status }));
    }
    return Promise.resolve(Response.json({}, { status: status === 200 ? 404 : status }));
  });

let cwd: string;
let out: Array<string>;
let err: Array<string>;

/** @returns The command's exit code, run in `cwd` against `fetch`. */
const runWith = async (argv: Array<string>, fetch: FetchLike = cratesIo()): Promise<number> => {
  const logger: Logger = { log: vi.fn<Logger['log']>(), error: vi.fn<Logger['error']>() };
  const io: Io = {
    config: new CardConfig({ fetch, logger }),
    cwd,
    stdout: (text) => {
      out.push(text);
    },
    stderr: (text) => {
      err.push(text);
    },
    version: '1.2.3',
  };
  return run(argv, io);
};

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'registry-cli-'));
  out = [];
  err = [];
});

afterEach(async () => {
  await rm(cwd, { recursive: true, force: true });
});

describe(run, () => {
  it('writes the card named after what it draws', async () => {
    await expect(runWith(['--card', 'crate', '--options', 'crate=serde'])).resolves.toBe(0);

    await expect(readFile(join(cwd, 'crate-serde.svg'), 'utf8')).resolves.toContain('<svg');
    expect(out).toStrictEqual(['Wrote crate-serde.svg\n']);
  });

  it('takes the options off a card URL, and writes where --out says, making its folders', async () => {
    const code = await runWith([
      '-c',
      'crate',
      '--options',
      'https://cards.example/api/crate?crate=serde&theme=ember_dark',
      '-o',
      'cards/serde.svg',
    ]);

    expect(code).toBe(0);
    await expect(readFile(join(cwd, 'cards/serde.svg'), 'utf8')).resolves.toContain('serde');
  });

  it('names a scoped npm package without its @ or slash', async () => {
    const npm = vi.fn<FetchLike>(async (input) => {
      if (input === 'https://registry.npmjs.org/@types%2Fnode/latest') {
        return Promise.resolve(Response.json({ version: '26.6.6' }));
      }
      return Promise.resolve(Response.json({}, { status: 404 }));
    });

    await expect(runWith(['--card', 'npm', '--options', 'package=@types/node'], npm)).resolves.toBe(
      0,
    );
    expect(out).toStrictEqual(['Wrote npm-types-node.svg\n']);
  });

  it('exits 1 on a failure no retry can fix, saying why', async () => {
    await expect(runWith(['--card', 'crate', '--options', 'crate=nope'])).resolves.toBe(1);

    expect(err.join('')).toContain('code: not_found');
  });

  it('exits 75 on a failure a later run may not repeat', async () => {
    await expect(
      runWith(['--card', 'crate', '--options', 'crate=serde'], cratesIo(429)),
    ).resolves.toBe(EXIT_RETRYABLE);

    expect(err.join('')).toContain('This one may work on a retry.');
  });

  it('checks a committed card without writing it', async () => {
    const file = join(cwd, 'serde.svg');
    await runWith(['--card', 'crate', '--options', 'crate=serde', '--out', file]);

    await expect(
      runWith(['--card', 'crate', '--options', 'crate=serde', '--out', file, '--check']),
    ).resolves.toBe(0);

    await writeFile(file, 'stale');

    await expect(
      runWith(['--card', 'crate', '--options', 'crate=serde', '--out', file, '--check']),
    ).resolves.toBe(1);
    await expect(readFile(file, 'utf8')).resolves.toBe('stale');
  });

  it('fails a check of a card never written', async () => {
    await expect(runWith(['--card', 'crate', '--options', 'crate=serde', '--check'])).resolves.toBe(
      1,
    );

    expect(err).toStrictEqual([
      'crate-serde.svg is out of date; run again without --check to redraw it\n',
    ]);
  });

  it('refuses a card it does not have, and a flag it does not know', async () => {
    await expect(runWith(['--card', 'pypi'])).resolves.toBe(1);
    await expect(runWith(['--nope'])).resolves.toBe(1);

    expect(err[0]).toContain('--card must be one of: npm, crate');
    expect(err[1]).toContain("Unknown option '--nope'");
  });

  it('shows its help and version', async () => {
    await expect(runWith(['--help'])).resolves.toBe(0);
    await expect(runWith(['-v'])).resolves.toBe(0);

    expect(out[0]).toContain('Usage');
    expect(out[1]).toBe('1.2.3\n');
  });
});
