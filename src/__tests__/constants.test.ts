import * as fs from 'fs';
import * as path from 'path';
import { COMPACT_LAYOUT_BREAKPOINT_PX } from '../constants';

describe('COMPACT_LAYOUT_BREAKPOINT_PX', () => {
  it('matches the compact-layout media query breakpoint in styles.css', () => {
    const css = fs.readFileSync(path.join(__dirname, '../styles.css'), 'utf8');
    // Anchor on the plain-ASCII word "compact" in the section comment (avoids depending on
    // the exact Unicode dash characters used for decoration around it) and take the first
    // `max-width: NNNpx` that follows — that's the media query the comment introduces.
    const match = css.match(/compact[^]*?max-width:\s*(\d+)px/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBe(COMPACT_LAYOUT_BREAKPOINT_PX);
  });
});
