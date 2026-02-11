import React, { useEffect, useRef, useState } from 'react';
import { IconPlayerSkipForwardFilled, IconSend } from '@tabler/icons-react/';
import { ActionIcon, Group, Stack, Textarea, useMantineColorScheme } from '@mantine/core';
import { useChatContext } from '../../contexts/ChatContext';
import RepoSpotlight from '../RepoSpotlight/RepoSpotlight';
import classes from './MessageInput.module.css';

interface MessageInputProps {
  handleSend: (input: string) => void;
  isSending: boolean;
  selectedRepo: string;
  setSelectedRepo: (value: string) => void;
}

const SendButton: React.FC<{ handleSendMessage: () => void; disabled: boolean }> = ({
  handleSendMessage,
  disabled,
}) => (
  <ActionIcon
    variant="transparent"
    aria-label="Send"
    size="xs"
    mt={2}
    onClick={handleSendMessage}
    disabled={disabled}
    style={{
      background: 'rgba(255, 255, 255, 0)',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  >
    <IconSend />
  </ActionIcon>
);

const SkipButton: React.FC<{ handleSkip: () => void }> = ({ handleSkip }) => (
  <ActionIcon
    variant="transparent"
    aria-label="Skip"
    size="xs"
    mt={2}
    onClick={handleSkip}
    style={{
      background: 'rgba(255, 255, 255, 0)',
      cursor: 'pointer',
    }}
  >
    <IconPlayerSkipForwardFilled />
  </ActionIcon>
);

const MessageInput: React.FC<MessageInputProps> = ({
  handleSend,
  isSending,
  selectedRepo,
  setSelectedRepo,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const { skipTyping, isActivelyTyping } = useChatContext();
  const [input, setInput] = useState<string>('');
  const [isGlowing, setIsGlowing] = useState(false);

  const handleSendMessage = () => {
    if (input.trim() === '') {
      return;
    }

    setIsGlowing(true);
    handleSend(input);
    setInput('');
    setTimeout(() => {
      setIsGlowing(false);
    }, 1000); // Duration of the glow-outwards animation
  };

  const handleKeyPressWithGlow = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (!isSending && inputRef.current) {
      inputRef.current.focus(); // Set focus back to the input field after sending
    }
  }, [isSending]);

  const shouldGlow = !selectedRepo || isSending;
  const shouldRotate = isSending;

  // Simplified button logic: only Send and Skip buttons
  const canSendMessage = input.trim() !== '' && !isSending && selectedRepo;
  const canShowSkipButton = isActivelyTyping && !isSending;

  const renderActionButton = () => {
    if (canShowSkipButton) {
      return <SkipButton handleSkip={skipTyping} />;
    }
    return <SendButton handleSendMessage={handleSendMessage} disabled={!canSendMessage} />;
  };

  return (
    <Stack
      gap={0}
      className={`${classes.stack} ${shouldGlow ? classes.glow : ''} ${shouldRotate ? classes.rotate : ''} ${isGlowing ? classes['glow-outwards'] : ''}`}
      data-theme={isDark ? 'dark' : 'light'}
    >
      <Group className={classes.inputGroup}>
        <Textarea
          ref={inputRef}
          value={input} // Allow typing while AI is responding
          variant="unstyled"
          size="md"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPressWithGlow}
          placeholder={selectedRepo ? 'Ask me anything...' : 'Select a repository'}
          // Prevent input while sending, but allow during AI typing
          disabled={isSending}
          autosize
          minRows={1}
          maxRows={10}
          styles={() => ({
            input: {
              backgroundColor: 'var(--input-bg)',
              '&:disabled': {
                backgroundColor: 'var(--input-bg)',
              },
              marginTop: '2px',
              '&:focus': {
                outline: 'none', // Remove focus outline
              },
            },
            wrapper: {
              '&:focus': {
                outline: 'none', // Remove focus outline
              },
            },
            root: {
              '&:focus': {
                outline: 'none', // Remove focus outline
              },
            },
          })}
          className={classes.textInput}
          style={{
            opacity: isSending ? 0.5 : 1,
          }}
        />
        <Group mt={2} gap={0}>
          {renderActionButton()}
        </Group>
      </Group>
      <Group className={classes.actionGroup}>
        <RepoSpotlight selectedRepo={selectedRepo} setSelectedRepo={setSelectedRepo} />
      </Group>
    </Stack>
  );
};

export default MessageInput;
