import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AliasPathProcessor } from './path-processor.js';
import type { AliasManagerInterface } from './types.js';

function mockManager(): AliasManagerInterface {
  return {
    getPathByAlias: vi.fn((alias: string) => alias),
    getAliasByPath: vi.fn((path: string) => path),
    cacheClear: vi.fn(),
  };
}

describe('AliasPathProcessor', () => {
  let manager: AliasManagerInterface;
  let processor: AliasPathProcessor;

  beforeEach(() => {
    manager = mockManager();
    processor = new AliasPathProcessor(manager);
  });

  describe('processInbound', () => {
    it('resolves the alias to a system path via the manager', () => {
      vi.mocked(manager.getPathByAlias).mockReturnValue('/node/1');
      expect(processor.processInbound('/about', {})).toBe('/node/1');
      expect(manager.getPathByAlias).toHaveBeenCalledWith('/about');
    });
  });

  describe('processOutbound', () => {
    it('resolves the path to an alias via the manager', () => {
      vi.mocked(manager.getAliasByPath).mockReturnValue('/about');
      expect(processor.processOutbound('/node/1')).toBe('/about');
      expect(manager.getAliasByPath).toHaveBeenCalledWith('/node/1', null);
    });

    it('passes the language id from options to the manager', () => {
      processor.processOutbound('/node/1', { language: { getId: () => 'de' } });
      expect(manager.getAliasByPath).toHaveBeenCalledWith('/node/1', 'de');
    });

    it('leaves the path untouched when options.alias is set', () => {
      const result = processor.processOutbound('/already-alias', { alias: true });
      expect(result).toBe('/already-alias');
      expect(manager.getAliasByPath).not.toHaveBeenCalled();
    });

    it('collapses a leading "//" to a single slash to prevent protocol-relative URLs', () => {
      vi.mocked(manager.getAliasByPath).mockReturnValue('//example.com');
      expect(processor.processOutbound('/node/1')).toBe('/example.com');
    });
  });
});
