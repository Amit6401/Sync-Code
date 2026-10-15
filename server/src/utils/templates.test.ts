import { describe, it, expect } from 'vitest';
import { getTemplate, listTemplates, TEMPLATES } from './templates';

describe('templates', () => {
  it('falls back to blank for unknown or missing id', () => {
    expect(getTemplate().id).toBe('blank');
    expect(getTemplate('does-not-exist').id).toBe('blank');
    expect(getTemplate(undefined).id).toBe('blank');
  });

  it('returns the requested template', () => {
    expect(getTemplate('node').id).toBe('node');
    expect(getTemplate('react').id).toBe('react');
    expect(getTemplate('python').id).toBe('python');
  });

  it('listTemplates exposes id + label for every template', () => {
    const list = listTemplates();
    expect(list.length).toBe(Object.keys(TEMPLATES).length);
    for (const t of list) {
      expect(typeof t.id).toBe('string');
      expect(typeof t.label).toBe('string');
      expect(t.label.length).toBeGreaterThan(0);
    }
  });

  it('every template has at least one file with a name and content', () => {
    for (const t of Object.values(TEMPLATES)) {
      expect(t.files.length).toBeGreaterThan(0);
      for (const f of t.files) {
        expect(f.name.length).toBeGreaterThan(0);
        expect(typeof f.content).toBe('string');
        expect(typeof f.language).toBe('string');
      }
    }
  });

  it('blank template contains a README', () => {
    expect(getTemplate('blank').files.some((f) => f.name === 'README.md')).toBe(true);
  });
});
