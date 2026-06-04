import { describe, it, expect } from 'vitest';
import { File, FileStatus } from './file.js';

describe('File entity', () => {
  describe('status', () => {
    it('STATUS_PERMANENT mirrors Drupal (1)', () => {
      expect(File.STATUS_PERMANENT).toBe(1);
      expect(FileStatus.PERMANENT).toBe(1);
      expect(FileStatus.TEMPORARY).toBe(0);
    });

    it('a new file is temporary by default', () => {
      const file = new File({ uri: 'public://a.txt' });
      expect(file.isTemporary()).toBe(true);
      expect(file.isPermanent()).toBe(false);
    });

    it('setPermanent / setTemporary flip the status', () => {
      const file = new File({ uri: 'public://a.txt' });
      file.setPermanent();
      expect(file.isPermanent()).toBe(true);
      expect(file.isTemporary()).toBe(false);
      file.setTemporary();
      expect(file.isTemporary()).toBe(true);
    });
  });

  describe('field accessors', () => {
    it('round-trips filename, uri, mime, size', () => {
      const file = new File({ uri: 'public://x.jpg' });
      file.setFilename('renamed.jpg');
      file.setFileUri('public://dir/x.jpg');
      file.setMimeType('image/jpeg');
      file.setSize(2048);
      expect(file.getFilename()).toBe('renamed.jpg');
      expect(file.getFileUri()).toBe('public://dir/x.jpg');
      expect(file.getMimeType()).toBe('image/jpeg');
      expect(file.getSize()).toBe(2048);
    });

    it('getSize returns a number or null (never a string)', () => {
      const file = new File({ uri: 'public://x' });
      expect(file.getSize()).toBeNull();
      file.setSize(10);
      expect(file.getSize()).toBe(10);
    });

    it('exposes owner (uid) and created timestamp', () => {
      const file = new File({ uri: 'public://x', uid: 42, created: 1000 });
      expect(file.getOwnerId()).toBe(42);
      expect(file.getCreatedTime()).toBe(1000);
    });
  });

  describe('preCreate', () => {
    it('derives filename from the uri basename when not set', () => {
      const values: Record<string, unknown> = { uri: 'public://folder/photo.png' };
      File.preCreate(values);
      expect(values['filename']).toBe('photo.png');
    });

    it('does not overwrite an explicit filename', () => {
      const values: Record<string, unknown> = { uri: 'public://folder/photo.png', filename: 'keep.png' };
      File.preCreate(values);
      expect(values['filename']).toBe('keep.png');
    });
  });

  describe('getDownloadHeaders', () => {
    it('returns Content-Type, Content-Length and private Cache-Control', () => {
      const file = new File({ uri: 'public://x.bin' });
      file.setMimeType('application/octet-stream');
      file.setSize(123);
      expect(file.getDownloadHeaders()).toEqual({
        'Content-Type': 'application/octet-stream',
        'Content-Length': 123,
        'Cache-Control': 'private',
      });
    });
  });

  it('reports its entity type id as "file"', () => {
    expect(File.ENTITY_TYPE_ID).toBe('file');
  });
});
