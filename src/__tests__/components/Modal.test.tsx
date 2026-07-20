import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../../components/Modal';

describe('Modal', () => {
  it('renders the title and children', () => {
    render(
      <Modal title="Test Title" onClose={jest.fn()} closeLabel="Close">
        <p>Body content</p>
      </Modal>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('has dialog semantics linking the title', () => {
    render(
      <Modal title="Test Title" onClose={jest.fn()} closeLabel="Close">
        <p>Body</p>
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const titleId = dialog.getAttribute('aria-labelledby');
    expect(document.getElementById(titleId!)).toHaveTextContent('Test Title');
  });

  it('renders a labeled close button by default and calls onClose when clicked', () => {
    const onClose = jest.fn();
    render(
      <Modal title="T" onClose={onClose} closeLabel="Close dialog">
        <p>Body</p>
      </Modal>
    );
    const closeBtn = screen.getByRole('button', { name: 'Close dialog' });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('hides the close button when showCloseButton is false', () => {
    render(
      <Modal title="T" onClose={jest.fn()} closeLabel="Close" showCloseButton={false}>
        <p>Body</p>
      </Modal>
    );
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('renders the footer when provided', () => {
    render(
      <Modal title="T" onClose={jest.fn()} closeLabel="Close" footer={<button>Save</button>}>
        <p>Body</p>
      </Modal>
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = jest.fn();
    render(
      <Modal title="T" onClose={onClose} closeLabel="Close">
        <p>Body</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('focuses the first focusable element on mount', () => {
    // showCloseButton is false here so the assertion is unambiguous — with it true (the
    // default), the close button itself (rendered in the header, before the body) would
    // legitimately be "the first focusable element" and this test would need to expect that
    // instead of "First".
    render(
      <Modal title="T" onClose={jest.fn()} closeLabel="Close" showCloseButton={false}>
        <button>First</button>
        <button>Second</button>
      </Modal>
    );
    expect(screen.getByText('First')).toHaveFocus();
  });

  it('wraps Tab from the last focusable element back to the first', () => {
    render(
      <Modal title="T" onClose={jest.fn()} closeLabel="Close">
        <button>Only</button>
      </Modal>
    );
    const only = screen.getByText('Only');
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    // DOM focusable order is [closeBtn, only] (close button is in the header, before the body).
    // "Only" is the LAST focusable element, so Tab from there should wrap to the FIRST (closeBtn).
    only.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(closeBtn).toHaveFocus();
  });

  it('wraps Shift+Tab from the first focusable element to the last', () => {
    render(
      <Modal title="T" onClose={jest.fn()} closeLabel="Close">
        <button>Only</button>
      </Modal>
    );
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    closeBtn.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(screen.getByText('Only')).toHaveFocus();
  });

  it('applies the extra className to modal-content', () => {
    render(
      <Modal title="T" onClose={jest.fn()} closeLabel="Close" className="permission-modal">
        <p>Body</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveClass('modal-content', 'permission-modal');
  });
});
