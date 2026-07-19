import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider } from '../../contexts/AppContext';
import UpdateAvailableModal from '../../components/UpdateAvailableModal';

jest.mock('../../services/gemini.service');

function renderModal(previewBullets: any = null) {
  const props = { onUpdate: jest.fn(), onIgnore: jest.fn(), onClose: jest.fn() };
  render(
    <AppProvider>
      <UpdateAvailableModal version="1.8.0" previewBullets={previewBullets} {...props} />
    </AppProvider>
  );
  return props;
}

describe('UpdateAvailableModal', () => {
  it('renders the localized title and message with the version', async () => {
    renderModal();
    expect(await screen.findByText('Update Available')).toBeInTheDocument();
    expect(screen.getByText('A new version of Screen Translator is available: v1.8.0.')).toBeInTheDocument();
  });

  it('fires onUpdate when Update is clicked', async () => {
    const { onUpdate } = renderModal();
    await userEvent.click(await screen.findByText('Update'));
    expect(onUpdate).toHaveBeenCalled();
  });

  it('fires onIgnore when "Ignore this release" is clicked', async () => {
    const { onIgnore } = renderModal();
    await userEvent.click(await screen.findByText('Ignore this release'));
    expect(onIgnore).toHaveBeenCalled();
  });

  it('fires onClose when × is clicked', async () => {
    const { onClose } = renderModal();
    await userEvent.click(await screen.findByText('×'));
    expect(onClose).toHaveBeenCalled();
  });
});
