import { describe, expect, test } from 'vitest';
import { promptForJob } from '@/generation/prompts';

const brief = {
  productDescription: 'Sunburst AI',
  iconSubject: 'a glowing sunburst mark',
  style: 'minimal',
  primaryColor: '#7a5cff',
  background: 'solid #111111',
  avoid: 'photorealism',
};

describe('generation prompts', () => {
  test('grid prompt forbids rounded plates and pins a 2x2 midline split', () => {
    const prompt = promptForJob(
      { operation: 'grid' },
      { brief: JSON.stringify(brief) }
    );
    expect(prompt).toContain('x=512 and y=512');
    expect(prompt).toContain('rounded rectangle');
    expect(prompt).toContain('optically centered');
    expect(prompt).toContain('including all four sharp corners');
    expect(prompt).toContain('Sunburst AI');
    expect(prompt).toContain('a glowing sunburst mark');
    expect(prompt).not.toContain('noddi concept sheet');
  });

  test('transparent backgrounds keep corners empty instead of a plate', () => {
    const prompt = promptForJob(
      { operation: 'grid' },
      {
        brief: JSON.stringify({
          ...brief,
          background: 'transparent',
        }),
      }
    );
    expect(prompt).toContain('fully transparent square');
    expect(prompt).toContain('Corners must stay transparent');
  });

  test('final and hd prompts also reject a rounded plate', () => {
    const project = { brief: JSON.stringify(brief) };
    expect(
      promptForJob({ operation: 'final', candidate: 'A' }, project)
    ).toContain('no rounded plate');
    expect(promptForJob({ operation: 'hd_master' }, project)).toContain(
      'rounded plate'
    );
  });
});
