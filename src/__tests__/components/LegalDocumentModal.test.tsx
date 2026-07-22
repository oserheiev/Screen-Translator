import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider } from '../../contexts/AppContext';
import LegalDocumentModal from '../../components/LegalDocumentModal';

jest.mock('../../services/gemini.service');

describe('LegalDocumentModal', () => {
  it('renders the given title and markdown content', async () => {
    render(
      <AppProvider>
        <LegalDocumentModal title="Privacy Policy" content="# Heading\n\nSome body text." onClose={jest.fn()} />
      </AppProvider>
    );

    expect(await screen.findByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText(/Some body text/)).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = jest.fn();
    render(
      <AppProvider>
        <LegalDocumentModal title="Terms of Use" content="Body." onClose={onClose} />
      </AppProvider>
    );

    await userEvent.click(await screen.findByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
