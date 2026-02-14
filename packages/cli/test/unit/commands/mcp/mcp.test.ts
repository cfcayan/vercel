import { beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'child_process';
import mcp from '../../../../src/commands/mcp/mcp';

vi.mock('child_process', () => ({
  execFileSync: vi.fn(),
}));

vi.mock('../../../../src/util/projects/link', () => ({
  getLinkedProject: vi.fn(),
}));

vi.mock('../../../../src/output-manager', () => ({
  default: {
    print: vi.fn(),
  },
}));

describe('mcp command hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses argv-based execution for project-specific claude setup', async () => {
    const { getLinkedProject } = await import(
      '../../../../src/util/projects/link'
    );

    vi.mocked(getLinkedProject).mockResolvedValue({
      status: 'linked',
      org: { slug: 'team-name' },
      project: { name: 'proj;echo-injected' },
    } as any);

    vi.mocked(execFileSync).mockReturnValue('ok' as any);

    const client = {
      argv: ['mcp', '--project'],
      input: {
        checkbox: vi.fn().mockResolvedValue(['Claude Code']),
      },
    } as any;

    const exitCode = await mcp(client);

    expect(exitCode).toBe(0);
    expect(execFileSync).toHaveBeenCalledWith(
      'claude',
      [
        'mcp',
        'add',
        '--transport',
        'http',
        'vercel-proj;echo-injected',
        'https://mcp.vercel.com/team-name/proj;echo-injected',
      ],
      expect.objectContaining({
        encoding: 'utf8',
        stdio: 'pipe',
      })
    );
  });
});
