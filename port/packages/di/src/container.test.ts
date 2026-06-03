import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ContainerBuilder,
  Container,
  Definition,
  Reference,
  Parameter,
  TaggedIteratorArgument,
  ServiceNotFoundException,
  ParameterNotFoundException,
  ServiceCircularReferenceException,
  RuntimeException,
  InvalidArgumentException,
  EXCEPTION_ON_INVALID_REFERENCE,
  NULL_ON_INVALID_REFERENCE,
  type CompilerPassInterface,
} from './index.js';

// --- Test collaborators ----------------------------------------------------

class Logger {
  public messages: string[] = [];
  log(msg: string): void {
    this.messages.push(msg);
  }
}

class Mailer {
  constructor(
    public readonly logger: Logger,
    public readonly transport: string,
  ) {}
}

class Counter {
  static instances = 0;
  constructor() {
    Counter.instances++;
  }
}

// ---------------------------------------------------------------------------

describe('Definition', () => {
  it('records class, arguments, factory, tags and flags', () => {
    const def = new Definition(Logger)
      .setArguments(['a', 'b'])
      .addTag('handler', { priority: 10 })
      .setShared(false);

    expect(def.getClass()).toBe(Logger);
    expect(def.getArguments()).toEqual(['a', 'b']);
    expect(def.getTag('handler')).toEqual([{ priority: 10 }]);
    expect(def.hasTag('handler')).toBe(true);
    expect(def.isShared()).toBe(false);
  });

  it('is shared and non-synthetic by default', () => {
    const def = new Definition(Logger);
    expect(def.isShared()).toBe(true);
    expect(def.isSynthetic()).toBe(false);
  });

  it('marks synthetic definitions', () => {
    const def = new Definition().setSynthetic(true);
    expect(def.isSynthetic()).toBe(true);
  });

  it('supports a factory function', () => {
    const factory = () => new Logger();
    const def = new Definition().setFactory(factory);
    expect(def.getFactory()).toBe(factory);
  });

  it('addArgument appends to the argument list', () => {
    const def = new Definition(Logger).addArgument('x').addArgument('y');
    expect(def.getArguments()).toEqual(['x', 'y']);
  });
});

describe('ContainerBuilder — registration & parameters', () => {
  let builder: ContainerBuilder;

  beforeEach(() => {
    builder = new ContainerBuilder();
  });

  it('register() returns a public Definition and stores it', () => {
    const def = builder.register('logger', Logger);
    expect(def).toBeInstanceOf(Definition);
    expect(builder.getDefinition('logger')).toBe(def);
    expect(builder.hasDefinition('logger')).toBe(true);
  });

  it('rejects uppercase parameter names', () => {
    expect(() => builder.setParameter('Foo', 'bar')).toThrow(InvalidArgumentException);
  });

  it('stores and retrieves parameters', () => {
    builder.setParameter('mail.transport', 'smtp');
    expect(builder.getParameter('mail.transport')).toBe('smtp');
    expect(builder.hasParameter('mail.transport')).toBe(true);
  });

  it('setAlias maps one id to another', () => {
    builder.register('logger', Logger);
    builder.setAlias('log', 'logger');
    expect(builder.hasAlias('log')).toBe(true);
  });
});

describe('Container — service instantiation', () => {
  let builder: ContainerBuilder;

  beforeEach(() => {
    Counter.instances = 0;
    builder = new ContainerBuilder();
  });

  it('instantiates a class service with no arguments', () => {
    builder.register('logger', Logger);
    const container = builder.compile();
    expect(container.get('logger')).toBeInstanceOf(Logger);
  });

  it('returns the same instance for shared services (singleton)', () => {
    builder.register('counter', Counter);
    const container = builder.compile();
    const a = container.get('counter');
    const b = container.get('counter');
    expect(a).toBe(b);
    expect(Counter.instances).toBe(1);
  });

  it('returns a fresh instance each time when shared=false', () => {
    builder.register('counter', Counter).setShared(false);
    const container = builder.compile();
    const a = container.get('counter');
    const b = container.get('counter');
    expect(a).not.toBe(b);
    expect(Counter.instances).toBe(2);
  });

  it('resolves Reference arguments to other services', () => {
    builder.register('logger', Logger);
    builder
      .register('mailer', Mailer)
      .setArguments([new Reference('logger'), 'smtp']);
    const container = builder.compile();
    const mailer = container.get<Mailer>('mailer')!;
    expect(mailer.logger).toBe(container.get('logger'));
    expect(mailer.transport).toBe('smtp');
  });

  it('resolves %parameter% placeholders in string arguments', () => {
    builder.setParameter('mail.transport', 'sendmail');
    builder.register('logger', Logger);
    builder
      .register('mailer', Mailer)
      .setArguments([new Reference('logger'), '%mail.transport%']);
    const container = builder.compile();
    expect(container.get<Mailer>('mailer')!.transport).toBe('sendmail');
  });

  it('resolves a Parameter argument object', () => {
    builder.setParameter('mail.transport', 'pop');
    builder.register('logger', Logger);
    builder
      .register('mailer', Mailer)
      .setArguments([new Reference('logger'), new Parameter('mail.transport')]);
    const container = builder.compile();
    expect(container.get<Mailer>('mailer')!.transport).toBe('pop');
  });

  it('invokes a factory function instead of constructing the class', () => {
    const factory = vi.fn(() => new Logger());
    builder.register('logger', Logger).setFactory(factory);
    const container = builder.compile();
    const logger = container.get('logger');
    expect(factory).toHaveBeenCalledOnce();
    expect(logger).toBeInstanceOf(Logger);
  });

  it('passes resolved arguments to the factory', () => {
    const factory = vi.fn((transport: string) => ({ transport }));
    builder.setParameter('mail.transport', 'smtp');
    builder.register('cfg').setFactory(factory).setArguments(['%mail.transport%']);
    const container = builder.compile();
    expect(container.get('cfg')).toEqual({ transport: 'smtp' });
    expect(factory).toHaveBeenCalledWith('smtp');
  });

  it('returns the container itself for service_container', () => {
    const container = builder.compile();
    expect(container.get('service_container')).toBe(container);
  });

  it('resolves aliases on get()', () => {
    builder.register('logger', Logger);
    builder.setAlias('log', 'logger');
    const container = builder.compile();
    expect(container.get('log')).toBe(container.get('logger'));
  });
});

describe('Container — synthetic services', () => {
  let builder: ContainerBuilder;

  beforeEach(() => {
    builder = new ContainerBuilder();
  });

  it('throws when getting a synthetic service before it is set', () => {
    builder.register('kernel').setSynthetic(true);
    const container = builder.compile();
    expect(() => container.get('kernel')).toThrow(RuntimeException);
  });

  it('returns the externally set instance for a synthetic service', () => {
    builder.register('kernel').setSynthetic(true);
    const container = builder.compile();
    const instance = new Logger();
    container.set('kernel', instance);
    expect(container.get('kernel')).toBe(instance);
  });
});

describe('Container — error behavior', () => {
  let builder: ContainerBuilder;

  beforeEach(() => {
    builder = new ContainerBuilder();
  });

  it('throws ServiceNotFoundException for unknown service (default behavior)', () => {
    const container = builder.compile();
    expect(() => container.get('missing')).toThrow(ServiceNotFoundException);
  });

  it('returns null for unknown service with NULL_ON_INVALID_REFERENCE', () => {
    const container = builder.compile();
    expect(container.get('missing', NULL_ON_INVALID_REFERENCE)).toBeNull();
  });

  it('null-behavior reference resolves to null instead of throwing', () => {
    builder
      .register('mailer', Mailer)
      .setArguments([new Reference('logger', NULL_ON_INVALID_REFERENCE), 'smtp']);
    const container = builder.compile();
    expect(container.get<Mailer>('mailer')!.logger).toBeNull();
  });

  it('throws ParameterNotFoundException for unknown parameter', () => {
    const container = builder.compile();
    expect(() => container.getParameter('nope')).toThrow(ParameterNotFoundException);
  });

  it('throws ServiceCircularReferenceException on a dependency cycle', () => {
    builder.register('a', Mailer).setArguments([new Reference('b')]);
    builder.register('b', Mailer).setArguments([new Reference('a')]);
    const container = builder.compile();
    expect(() => container.get('a')).toThrow(ServiceCircularReferenceException);
  });

  it('has() reflects definitions, aliases and the container itself', () => {
    builder.register('logger', Logger);
    builder.setAlias('log', 'logger');
    const container = builder.compile();
    expect(container.has('logger')).toBe(true);
    expect(container.has('log')).toBe(true);
    expect(container.has('service_container')).toBe(true);
    expect(container.has('missing')).toBe(false);
  });
});

describe('Container — tagged service collection', () => {
  let builder: ContainerBuilder;

  beforeEach(() => {
    builder = new ContainerBuilder();
  });

  it('findTaggedServiceIds returns ids with their tag attributes', () => {
    builder.register('h1', Logger).addTag('breadcrumb_builder', { priority: 5 });
    builder.register('h2', Logger).addTag('breadcrumb_builder', { priority: 10 });
    builder.register('other', Logger);
    const ids = builder.findTaggedServiceIds('breadcrumb_builder');
    expect(ids).toEqual({
      h1: [{ priority: 5 }],
      h2: [{ priority: 10 }],
    });
  });

  it('resolves a TaggedIteratorArgument into instances ordered by priority', () => {
    builder.register('h1', Logger).addTag('chain', { priority: 5 });
    builder.register('h2', Logger).addTag('chain', { priority: 10 });
    builder
      .register('chain_consumer')
      .setFactory((handlers: Logger[]) => handlers)
      .setArguments([new TaggedIteratorArgument('chain')]);
    const container = builder.compile();
    const handlers = container.get<Logger[]>('chain_consumer')!;
    expect(handlers).toHaveLength(2);
    // Highest priority first.
    expect(handlers[0]).toBe(container.get('h2'));
    expect(handlers[1]).toBe(container.get('h1'));
  });
});

describe('ContainerBuilder — compiler passes', () => {
  it('runs registered compiler passes during compile()', () => {
    const builder = new ContainerBuilder();
    const pass: CompilerPassInterface = { process: vi.fn() };
    builder.addCompilerPass(pass);
    builder.compile();
    expect(pass.process).toHaveBeenCalledOnce();
    expect(pass.process).toHaveBeenCalledWith(builder);
  });

  it('a compiler pass can mutate definitions before compilation', () => {
    const builder = new ContainerBuilder();
    builder.register('logger', Logger);
    const pass: CompilerPassInterface = {
      process(b) {
        // Collect tagged handlers and wire them as an argument (TaggedHandlersPass style).
        b.register('rerouted', Logger).addArgument('injected-by-pass');
      },
    };
    builder.addCompilerPass(pass);
    const container = builder.compile();
    expect(container.has('rerouted')).toBe(true);
  });

  it('freezes the builder after compile so synthetic services can still be set', () => {
    const builder = new ContainerBuilder();
    builder.register('kernel').setSynthetic(true);
    const container = builder.compile();
    expect(builder.isCompiled()).toBe(true);
    // Synthetic services are still settable on the compiled container.
    const k = new Logger();
    container.set('kernel', k);
    expect(container.get('kernel')).toBe(k);
  });
});

describe('Container — serialization guard', () => {
  it('refuses to be JSON-serialized', () => {
    const builder = new ContainerBuilder();
    const container = builder.compile();
    expect(() => JSON.stringify(container)).toThrow();
  });
});
