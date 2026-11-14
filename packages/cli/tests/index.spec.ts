import { afterEach, describe, expect, it, vi } from 'vitest';

import packageJson from '../package.json' with { type: 'json' };

const { argv } = process;

afterEach(() => {
  process.argv = argv;
  process.exitCode = undefined;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  // each test runs the entry afresh
  vi.resetModules();
});

describe('the bin entry', () => {
  it('runs the command against this process, reading the version off the package', async () => {
    process.argv = ['node', 'registry-stats-forge', '--version'];
    // the version is the result, so it goes to stdout, which the test keeps quiet
    const write = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    await import('../src/index.ts');

    expect(write).toHaveBeenCalledWith(`${packageJson.version}\n`);
    expect(process.exitCode).toBe(0);
  });

  it('sends a failure and the diagnostics to stderr, and exits as the failure says', async () => {
    process.argv = ['node', 'registry-stats-forge', '--card', 'crate', '--options', 'crate=serde'];
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 503 })),
    );
    // what the test provokes is asserted, not shown
    const write = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    await import('../src/index.ts');

    expect(write).toHaveBeenCalledWith(expect.stringContaining('crates.io answered 503'));
    expect(write).toHaveBeenCalledWith(expect.stringContaining('Could not render the crate card.'));
    expect(process.exitCode).toBe(75);
  });
});
