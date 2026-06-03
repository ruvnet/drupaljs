import { describe, it, expect, vi } from 'vitest';
import { FileRepository } from './file-repository.js';
import { FileExists } from './types.js';
import { File } from './entity/file.js';

function makeDeps() {
  const stored: File[] = [];
  const fileSystem = {
    saveData: vi.fn((_data: string, destination: string, _fe: FileExists) => destination),
    copy: vi.fn((_source: string, destination: string, _fe: FileExists) => destination),
    move: vi.fn((_source: string, destination: string, _fe: FileExists) => destination),
  };
  const storage = {
    create: vi.fn((values: Record<string, unknown>) => new File(values)),
    save: vi.fn((file: File) => {
      if (file.id === null) file.id = stored.length + 1;
      stored.push(file);
    }),
    loadByUri: vi.fn((uri: string) => stored.find((f) => f.getFileUri() === uri) ?? null),
  };
  return { fileSystem, storage, stored };
}

describe('FileRepository', () => {
  it('writeData saves data and creates a permanent file entity', () => {
    const { fileSystem, storage } = makeDeps();
    const repo = new FileRepository(fileSystem, storage, 1);

    const file = repo.writeData('hello', 'public://greeting.txt');

    expect(fileSystem.saveData).toHaveBeenCalledWith('hello', 'public://greeting.txt', FileExists.Rename);
    expect(storage.save).toHaveBeenCalledWith(file);
    expect(file.getFileUri()).toBe('public://greeting.txt');
    expect(file.getFilename()).toBe('greeting.txt');
    expect(file.isPermanent()).toBe(true);
    expect(file.getOwnerId()).toBe(1);
  });

  it('writeData updates the existing entity when one already exists for the uri', () => {
    const { fileSystem, storage } = makeDeps();
    const repo = new FileRepository(fileSystem, storage, 1);
    const first = repo.writeData('a', 'public://f.txt');

    const second = repo.writeData('b', 'public://f.txt', FileExists.Replace);

    expect(second.id).toBe(first.id);
    expect(storage.create).toHaveBeenCalledTimes(1);
  });

  it('copy writes to the new destination and creates a new entity', () => {
    const { fileSystem, storage } = makeDeps();
    const repo = new FileRepository(fileSystem, storage, 5);
    const source = new File({ uri: 'public://src.txt', filename: 'src.txt' });
    source.id = 9;
    source.setPermanent();

    const copy = repo.copy(source, 'public://dest.txt');

    expect(fileSystem.copy).toHaveBeenCalledWith('public://src.txt', 'public://dest.txt', FileExists.Rename);
    expect(copy.id).not.toBe(source.id);
    expect(copy.getFileUri()).toBe('public://dest.txt');
    expect(copy.getFilename()).toBe('dest.txt');
  });

  it('a copy of a temporary source stays temporary', () => {
    const { fileSystem, storage } = makeDeps();
    const repo = new FileRepository(fileSystem, storage, 5);
    const source = new File({ uri: 'public://src.txt' });
    source.id = 9; // temporary by default

    const copy = repo.copy(source, 'public://dest.txt');
    expect(copy.isTemporary()).toBe(true);
  });

  it('move relocates the file and keeps the same entity id', () => {
    const { fileSystem, storage } = makeDeps();
    const repo = new FileRepository(fileSystem, storage, 5);
    const source = new File({ uri: 'public://src.txt', filename: 'src.txt' });
    source.id = 9;

    const moved = repo.move(source, 'public://moved.txt');

    expect(fileSystem.move).toHaveBeenCalledWith('public://src.txt', 'public://moved.txt', FileExists.Rename);
    expect(moved.id).toBe(9);
    expect(moved.getFileUri()).toBe('public://moved.txt');
  });

  it('loadByUri delegates to storage', () => {
    const { fileSystem, storage } = makeDeps();
    const repo = new FileRepository(fileSystem, storage, 1);
    repo.writeData('x', 'public://here.txt');
    expect(repo.loadByUri('public://here.txt')?.getFileUri()).toBe('public://here.txt');
    expect(repo.loadByUri('public://nope.txt')).toBeNull();
  });
});
