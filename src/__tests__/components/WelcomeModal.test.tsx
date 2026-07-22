import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider } from '../../contexts/AppContext';
import WelcomeModal from '../../components/WelcomeModal';

jest.mock('../../services/gemini.service');

describe('WelcomeModal', () => {
  it('shows the "new" mode title and starts with the checkbox pre-checked', async () => {
    render(
      <AppProvider>
        <WelcomeModal mode="new" initialConsent={true} onComplete={jest.fn()} />
      </AppProvider>
    );

    expect(await screen.findByText('Help us improve Screen Translator')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('shows the "update" mode title', async () => {
    render(
      <AppProvider>
        <WelcomeModal mode="update" initialConsent={true} onComplete={jest.fn()} />
      </AppProvider>
    );

    expect(await screen.findByText('Before you continue')).toBeInTheDocument();
  });

  it('shows the "docs-updated" mode title and respects a false initialConsent', async () => {
    render(
      <AppProvider>
        <WelcomeModal mode="docs-updated" initialConsent={false} onComplete={jest.fn()} />
      </AppProvider>
    );

    expect(await screen.findByText('Our policy has changed')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('calls onComplete with the current checkbox value when Continue is clicked', async () => {
    const onComplete = jest.fn();
    render(
      <AppProvider>
        <WelcomeModal mode="new" initialConsent={true} onComplete={onComplete} />
      </AppProvider>
    );

    await userEvent.click(await screen.findByRole('checkbox'));
    await userEvent.click(screen.getByText('Continue'));
    expect(onComplete).toHaveBeenCalledWith(false);
  });

  it('opens the Privacy Policy as a nested modal when clicked', async () => {
    render(
      <AppProvider>
        <WelcomeModal mode="new" initialConsent={true} onComplete={jest.fn()} />
      </AppProvider>
    );

    await userEvent.click(await screen.findByText('Privacy Policy'));
    expect(await screen.findByRole('dialog', { name: /Privacy Policy/ })).toBeInTheDocument();
  });
});
