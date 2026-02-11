import { useEffect, useRef, useState } from 'react';

type TypingMode = 'character' | 'word';

export const useTypewriter = (
  text: string,
  speed: number,
  mode: TypingMode = 'character',
  stopTyping: boolean
) => {
  const [displayText, setDisplayText] = useState('');
  const idx = useRef(0);
  const displayTextRef = useRef('');

  useEffect(() => {
    if (stopTyping) {
      setDisplayText(text); // Show the full text immediately
      return;
    }

    // Reset state when new text is provided
    setDisplayText('');
    displayTextRef.current = '';
    idx.current = 0;

    // Calculate dynamic speed based on text length
    // For longer texts, we'll type faster
    let dynamicSpeed = speed;
    if (text.length > 100) {
      // For longer texts, decrease typing delay (faster typing)
      dynamicSpeed = Math.max(5, speed - Math.floor(text.length / 100));
    }

    // For very long texts like stories, consider skipping characters
    const skipFactor = text.length > 500 ? 3 : 1; // Skip characters for very long texts

    const typingInterval = setInterval(async () => {
      if (mode === 'character') {
        if (idx.current < text.length) {
          // Add multiple characters at once for very long texts
          for (let i = 0; i < skipFactor && idx.current < text.length; i++) {
            displayTextRef.current += text.charAt(idx.current);
            idx.current += 1;
          }
          setDisplayText(displayTextRef.current);
        } else {
          clearInterval(typingInterval);
        }
      } else if (mode === 'word') {
        const words = text.split(' ');
        // Adjust word count based on text length and complxity
        const wordsToAddAtOnce =
          text.length > 2000 ? 5 : text.length > 1000 ? 3 : text.length > 500 ? 2 : 1;

        // Add pause factor for periods and paragraph breaks
        const currentWord = words[idx.current] || '';
        const shouldPause =
          currentWord.endsWith('.') || currentWord.endsWith('?') || currentWord.endsWith('!');

        if (idx.current < words.length) {
          const wordsToAdd = shouldPause ? 1 : wordsToAddAtOnce;

          for (let i = 0; i < wordsToAdd && idx.current < words.length; i++) {
            displayTextRef.current += (displayTextRef.current ? ' ' : '') + words[idx.current];
            idx.current += 1;
          }
          setDisplayText(displayTextRef.current);

          // Add slight delay after punctuation
          if (shouldPause) {
            await new Promise((r) => setTimeout(r, 100));
          }
        } else {
          clearInterval(typingInterval);
        }
      }
    }, dynamicSpeed);

    return () => {
      clearInterval(typingInterval);
    };
  }, [text, speed, mode, stopTyping]);

  return displayText;
};
