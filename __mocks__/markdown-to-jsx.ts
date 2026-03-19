// Minimal mock for markdown-to-jsx — renders children as plain text in tests.
import React from 'react';

const Markdown = ({ children }: { children: string }) =>
  React.createElement('div', { 'data-testid': 'markdown' }, children);

export default Markdown;
