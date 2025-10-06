import { render, screen, fireEvent } from '@testing-library/react';
import APIModal from '@/components/APIModal';

describe('APIModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <APIModal
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
        currentApiKey=""
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(
      <APIModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        currentApiKey=""
      />
    );

    expect(screen.getByText('API Key')).toBeInTheDocument();
    expect(screen.getByLabelText('OpenAI API Key')).toBeInTheDocument();
  });

  it('should display current API key', () => {
    const testKey = 'sk-test-key-123';
    render(
      <APIModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        currentApiKey={testKey}
      />
    );

    const input = screen.getByLabelText('OpenAI API Key') as HTMLInputElement;
    expect(input.value).toBe(testKey);
  });

  it('should call onSave and onClose when form is submitted', () => {
    render(
      <APIModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        currentApiKey=""
      />
    );

    const input = screen.getByLabelText('OpenAI API Key');
    const saveButton = screen.getByText('Save');

    fireEvent.change(input, { target: { value: 'sk-new-key' } });
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith('sk-new-key');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <APIModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        currentApiKey=""
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should clear API key when clear button is clicked', () => {
    render(
      <APIModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        currentApiKey="sk-test-key"
      />
    );

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    const input = screen.getByLabelText('OpenAI API Key') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('should call onClose when X button is clicked', () => {
    render(
      <APIModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        currentApiKey=""
      />
    );

    const closeButton = screen.getByLabelText('Close API settings');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
