import React, { useEffect, useRef, useState } from 'react';
import {
  IconChartHistogram,
  IconCheck,
  IconCode,
  IconCopy,
  IconMaximize,
  IconZoomIn,
  IconZoomOut,
} from '@tabler/icons-react';
import mermaid from 'mermaid';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { ActionIcon, Button, CopyButton, useMantineColorScheme } from '@mantine/core';
import styles from './MarkdownRenderer.module.css';

interface MarkdownRendererProps {
  text: string;
}

const languageMap: { [key: string]: string } = {
  js: 'javascript',
  jsx: 'javascript (jsx)',
  ts: 'typescript',
  tsx: 'typescript (tsx)',
  cpp: 'c++',
  csharp: 'c#',
  // Add more mappings as needed
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text }) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'diagram' | 'code'>('diagram');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const mermaidConfig = {
      startOnLoad: true,
      theme: isDark ? 'dark' : ('default' as 'dark' | 'default'),
    };

    mermaid.initialize(mermaidConfig);
  }, [isDark]);

  useEffect(() => {
    mermaid.contentLoaded();
  }, [text]);

  useEffect(() => {
    if (mermaidRef.current) {
      const svg = mermaidRef.current.querySelector('svg');
      if (svg) {
        svg.style.width = '100%';
        svg.style.height = 'auto';
        svg.removeAttribute('style');
      }
    }
  }, [text]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      mermaidRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const zoomIn = () => {
    setZoomLevel((prevZoomLevel) => Math.min(prevZoomLevel + 0.1, 2));
  };

  const zoomOut = () => {
    setZoomLevel((prevZoomLevel) => Math.max(prevZoomLevel - 0.1, 0.5));
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: ({ node, ...props }) => (
          <h1
            style={{
              color: 'var(--ai-text-color)',
              fontWeight: 600,
              margin: '0.5em 0',
            }}
            {...props}
          >
            {props.children}
          </h1>
        ),
        h2: ({ node, ...props }) => (
          <h2
            style={{
              color: 'var(--ai-text-color)',
              fontWeight: 600,
              margin: '0.5em 0',
            }}
            {...props}
          >
            {props.children}
          </h2>
        ),
        h3: ({ node, ...props }) => (
          <h3
            style={{
              color: 'var(--ai-text-color)',
              fontWeight: 600,
              margin: '0.5em 0',
              letterSpacing: '0.5px',
            }}
            {...props}
          >
            {props.children}
          </h3>
        ),
        h4: ({ node, ...props }) => (
          <h4
            style={{
              color: 'var(--ai-text-color)',
              fontWeight: 600,
              margin: '0.5em 0',
              letterSpacing: '0.5px',
            }}
            {...props}
          >
            {props.children}
          </h4>
        ),
        p: ({ node, ...props }) => <p style={{ color: 'var(--ai-text-color)' }} {...props} />,
        strong: ({ node, ...props }) => (
          <strong style={{ fontWeight: 500, letterSpacing: '0.5px' }} {...props} />
        ),
        code: ({ node, inline, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? languageMap[match[1]] || match[1] : '';

          if (language === 'mermaid') {
            const toggleViewMode = () => {
              setViewMode(viewMode === 'diagram' ? 'code' : 'diagram');
            };

            useEffect(() => {
              if (viewMode === 'diagram') {
                mermaid.contentLoaded();
              }
            }, [viewMode]);

            useEffect(() => {
              const handleFullscreenChange = () => {
                if (!document.fullscreenElement) {
                  setIsFullScreen(false);
                }
              };

              document.addEventListener('fullscreenchange', handleFullscreenChange);
              return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
            }, []);

            return (
              <div
                className={`${styles.mermaidContainer} ${isFullScreen ? styles.fullscreen : ''}`}
                ref={mermaidRef}
              >
                <div className={styles.codeBlockHeader}>
                  <span>mermaid</span>
                  <div className={styles.headerButtons}>
                    <Button
                      variant="transparent"
                      color="var(--code-block-header-text-color)"
                      size="compact-xs"
                      radius="md"
                      leftSection={
                        viewMode === 'diagram' ? (
                          <IconCode size={14} style={{ marginRight: -3 }} />
                        ) : (
                          <IconChartHistogram size={14} style={{ marginRight: -3 }} />
                        )
                      }
                      onClick={toggleViewMode}
                      className={styles.toggleViewButton}
                    >
                      {viewMode === 'diagram' ? 'View Code' : 'View Diagram'}
                    </Button>
                    {viewMode === 'diagram' && (
                      <>
                        <ActionIcon
                          variant="transparent"
                          color="var(--code-block-header-text-color)"
                          size="sm"
                          radius="md"
                          onClick={zoomIn}
                          className={styles.toggleViewButton}
                        >
                          <IconZoomIn size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="transparent"
                          color="var(--code-block-header-text-color)"
                          size="sm"
                          radius="md"
                          onClick={zoomOut}
                          className={styles.toggleViewButton}
                        >
                          <IconZoomOut size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="transparent"
                          color="var(--code-block-header-text-color)"
                          size="sm"
                          radius="md"
                          onClick={toggleFullScreen}
                          className={styles.toggleViewButton}
                        >
                          <IconMaximize size={16} />
                        </ActionIcon>
                      </>
                    )}
                  </div>
                </div>

                <CopyButton value={String(children).replace(/\n$/, '')} timeout={2000}>
                  {({ copy, copied }) => (
                    <Button
                      variant="transparent"
                      color="var(--code-block-header-text-color)"
                      size="compact-xs"
                      radius="md"
                      leftSection={
                        copied ? (
                          <IconCheck size={14} style={{ marginRight: -3 }} />
                        ) : (
                          <IconCopy size={14} style={{ marginRight: -3 }} />
                        )
                      }
                      onClick={copy}
                      className={`${styles.copyCodeButton} ${styles.stickyCopyButton} ${
                        styles.copyButtonMermaid
                      }`}
                    >
                      {copied ? 'Copied!' : 'Copy code'}
                    </Button>
                  )}
                </CopyButton>

                {viewMode === 'diagram' ? (
                  <div
                    className={`${styles.mermaid} mermaid`}
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'center',
                    }}
                  >
                    {String(children).replace(/\n$/, '')}
                  </div>
                ) : (
                  <div className={`${styles.codeBlockContainer} ${styles.noBorder}`}>
                    <SyntaxHighlighter
                      {...(props as any)}
                      style={isDark ? oneDark : oneLight}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        fontSize: '0.8rem',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        width: '100%',
                      }}
                      language="mermaid"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                )}
              </div>
            );
          }

          return !inline && match ? (
            <div className={styles.codeBlockContainer}>
              <div className={styles.codeBlockHeader}>
                <span>{language}</span>
              </div>
              <CopyButton value={String(children).replace(/\n$/, '')} timeout={2000}>
                {({ copy, copied }) => (
                  <Button
                    variant="subtle"
                    color={copied ? 'teal' : 'gray'} // Text color for "Copy" and "Copied!"
                    size="compact-xs"
                    onClick={copy}
                    className={styles.codeBlockStickyCopyButton}
                    leftSection={
                      copied ? (
                        <IconCheck size={14} style={{ marginRight: -2 }} />
                      ) : (
                        <IconCopy size={14} style={{ marginRight: -2 }} />
                      )
                    }
                    styles={{
                      root: { userSelect: 'none' },
                      label: { lineHeight: '1' },
                    }}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                )}
              </CopyButton>
              <SyntaxHighlighter
                {...(props as any)}
                style={isDark ? oneDark : oneLight}
                PreTag="div"
                wrapLongLines
                lineProps={{ style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' } }}
                customStyle={{
                  margin: 0,
                  fontSize: '0.8rem',
                  padding: '1rem',
                  borderRadius: 0,
                  width: '100%',
                }}
                language={match[1]}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code
              style={{
                backgroundColor: isDark ? '#333' : '#f5f5f5',
                padding: '0px 4px',
                borderRadius: '4px',
                display: 'inline-block',
                fontSize: '0.8em',
                color: isDark ? '#f8f8f2' : '#333',
                maxWidth: '100%',
                overflow: 'auto',
                verticalAlign: 'middle',
              }}
              {...props}
            >
              {children}
            </code>
          );
        },
        pre: ({ node, ...props }) => (
          <pre
            style={{
              borderRadius: '0.5rem',
              overflow: 'visible',
              color: isDark ? '#f8f8f2' : '#333',
              maxWidth: '100%',
            }}
            {...props}
          />
        ),
        li: ({ node, ...props }) => (
          <li style={{ color: 'var(--ai-text-color)' }} {...props}>
            {props.children}
          </li>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
};

export default React.memo(MarkdownRenderer);
