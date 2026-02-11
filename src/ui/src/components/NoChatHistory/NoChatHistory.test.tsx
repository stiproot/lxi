import { fireEvent, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import NoChatHistory from './NoChatHistory';

describe('NoChatHistory Component', () => {
  test('renders the component with initial content', () => {
    render(
      <MantineProvider>
        <NoChatHistory />
      </MantineProvider>
    );

    // Check if the logo is rendered using getByLabelText
    expect(screen.getByLabelText(/lxi-name-logo/i)).toBeInTheDocument();

    // Check if the introductory text is rendered
    expect(
      screen.getByText(/Hi there! I'm Lxi, your friendly guide to exploring Git repositories./i)
    ).toBeInTheDocument();

    // Check if the segmented control is rendered with default value 'capabilities'
    expect(screen.getByText(/Capabilities/i)).toBeInTheDocument();

    // Check if the capabilities content is displayed
    expect(screen.getByText(/Displays code info in a simple format./i)).toBeInTheDocument();
  });

  test('changes content when segmented control is clicked', () => {
    render(
      <MantineProvider>
        <NoChatHistory />
      </MantineProvider>
    );

    // Click on the 'Examples' segment
    fireEvent.click(screen.getByText(/Examples/i));

    // Check if the examples content is displayed
    expect(
      screen.getByText((content) => content.includes('What framework is used in this repository?'))
    ).toBeInTheDocument();

    // Click on the 'Limitations' segment
    fireEvent.click(screen.getByText(/Limitations/i));

    // Check if the limitations content is displayed
    expect(screen.getByText(/No commit\/branch\/pull request info./i)).toBeInTheDocument();
  });
});
