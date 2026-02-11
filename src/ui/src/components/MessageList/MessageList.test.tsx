import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import MessageList from './MessageList';

// Update Message mock to handle all required props
vi.mock('../Message/Message', () => ({
  default: ({ message }: { message: any; isCurrentUser: boolean; userName: string }) => (
    <div data-testid="mock-message" data-sender={message.sender} data-id={message.id}>
      {message.content}
    </div>
  ),
}));

const mockSetAiResponse = vi.fn();
const mockMessages = [
  { id: '1', content: 'Hello', sender: 'user' },
  { id: '2', content: 'Hi there!', sender: 'assistant' },
];

const mockUseChatContext = {
  chatMessages: mockMessages,
  isAiTyping: false,
  currentChatId: '1',
  aiResponse: null,
  setAiResponse: mockSetAiResponse,
};

const mockUser = {
  id: 'user123',
  name: 'Test User',
};

vi.mock('../../contexts/UserContext', () => ({
  useUserContext: () => ({ user: mockUser }),
}));

vi.mock('../../contexts/ChatContext', () => ({
  useChatContext: () => mockUseChatContext,
}));

describe('MessageList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset mock context
    mockUseChatContext.chatMessages = [...mockMessages];
    mockUseChatContext.currentChatId = '1';
    mockUseChatContext.isAiTyping = false;
  });

  test('renders without crashing', () => {
    const { container } = render(
      <MantineProvider>
        <MessageList isSending={false} />
      </MantineProvider>
    );

    // Check if the ScrollArea viewport is rendered
    expect(container.querySelector('.mantine-ScrollArea-viewport')).toBeInTheDocument();
  });

  test('displays messages correctly', () => {
    render(
      <MantineProvider>
        <MessageList isSending={false} />
      </MantineProvider>
    );

    const messages = screen.getAllByTestId('mock-message');
    expect(messages).toHaveLength(mockMessages.length);

    messages.forEach((message) => {
      const id = message.getAttribute('data-id');
      const mockMessage = mockMessages.find((m) => m.id === id);
      expect(mockMessage).toBeDefined();
      expect(message).toHaveTextContent(mockMessage!.content);
      expect(message).toHaveAttribute('data-sender', mockMessage!.sender);
    });
  });

  test('scrolls to bottom when new message is added', () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    const { rerender } = render(
      <MantineProvider>
        <MessageList isSending={false} />
      </MantineProvider>
    );

    // Verify initial messages are rendered
    expect(screen.getAllByTestId('mock-message')).toHaveLength(2);

    mockUseChatContext.chatMessages = [
      ...mockMessages,
      { id: '3', content: 'New message', sender: 'user' },
    ];

    rerender(
      <MantineProvider>
        <MessageList isSending={false} />
      </MantineProvider>
    );

    // Verify new message is rendered
    expect(screen.getAllByTestId('mock-message')).toHaveLength(3);
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  test('shows "Scroll to Bottom" button when scrolled up', async () => {
    const { container } = render(
      <MantineProvider>
        <MessageList isSending={false} />
      </MantineProvider>
    );

    const scrollArea = container.querySelector('.mantine-ScrollArea-viewport') as HTMLElement;

    // Mock scroll position that will trigger the button
    Object.defineProperty(scrollArea, 'scrollHeight', { value: 1000 });
    Object.defineProperty(scrollArea, 'clientHeight', { value: 300 });
    Object.defineProperty(scrollArea, 'scrollTop', { value: 0 });

    // Trigger scroll event
    await act(async () => {
      fireEvent.wheel(scrollArea);
    });

    expect(screen.getByTestId('scroll-to-bottom-button')).toBeInTheDocument();
  });

  test('hides "Scroll to Bottom" button when at bottom', async () => {
    const { container } = render(
      <MantineProvider>
        <MessageList isSending={false} />
      </MantineProvider>
    );

    const scrollArea = container.querySelector('.mantine-ScrollArea-viewport') as HTMLElement;

    const scrollHeight = 1000;
    const clientHeight = 300;
    const scrollTop = scrollHeight - clientHeight;

    Object.defineProperties(scrollArea, {
      scrollHeight: { get: () => scrollHeight },
      clientHeight: { get: () => clientHeight },
      scrollTop: { get: () => scrollTop },
    });

    await act(async () => {
      const scrollEvent = new Event('scroll');
      scrollArea.dispatchEvent(scrollEvent);
    });

    expect(screen.queryByTestId('scroll-to-bottom-button')).not.toBeInTheDocument();
  });

  test('restores scroll position from localStorage on initial load', () => {
    const scrollPosition = '150';
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(scrollPosition);

    const { container } = render(
      <MantineProvider>
        <MessageList isSending={false} />
      </MantineProvider>
    );

    const scrollArea = container.querySelector('.mantine-ScrollArea-viewport') as HTMLElement;
    expect(scrollArea.scrollTop).toBe(parseInt(scrollPosition, 10));
  });

  test('saves scroll position to localStorage before unload', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    const { container } = render(
      <MantineProvider>
        <MessageList isSending={false} />
      </MantineProvider>
    );

    const scrollArea = container.querySelector('.mantine-ScrollArea-viewport') as HTMLElement;
    Object.defineProperty(scrollArea, 'scrollTop', { value: 200 });

    act(() => {
      window.dispatchEvent(new Event('beforeunload'));
    });

    expect(setItemSpy).toHaveBeenCalledWith('chatScrollPosition', '200');
  });

  test('auto-scrolls to bottom when AI is typing unless user is scrolling', async () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    const { rerender } = render(
      <MantineProvider>
        <MessageList isSending={false} />
      </MantineProvider>
    );

    // Simulate AI typing
    mockUseChatContext.isAiTyping = true;

    await act(async () => {
      rerender(
        <MantineProvider>
          <MessageList isSending={false} />
        </MantineProvider>
      );
    });

    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  test('resets AI response when switching chats', () => {
    const { rerender } = render(
      <MantineProvider>
        <MessageList isSending={false} />
      </MantineProvider>
    );

    mockUseChatContext.currentChatId = '2';

    rerender(
      <MantineProvider>
        <MessageList isSending={false} />
      </MantineProvider>
    );

    expect(mockSetAiResponse).toHaveBeenCalledWith(null);
  });

  test('handles user scrolling', async () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    const { container } = render(
      <MantineProvider>
        <MessageList isSending={false} />
      </MantineProvider>
    );

    // Clear any initial scroll calls
    scrollIntoViewMock.mockClear();

    const scrollArea = container.querySelector('.mantine-ScrollArea-viewport') as HTMLElement;

    // Mock scroll values
    Object.defineProperties(scrollArea, {
      scrollHeight: { value: 1000 },
      clientHeight: { value: 300 },
      scrollTop: { value: 100 },
    });

    // Simulate user scrolling
    await act(async () => {
      fireEvent.wheel(scrollArea);
    });

    // Simulate AI typing after user scroll
    mockUseChatContext.isAiTyping = true;
    await act(async () => {
      fireEvent.wheel(scrollArea);
    });

    // Should not auto-scroll while user is scrolling
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });
});
