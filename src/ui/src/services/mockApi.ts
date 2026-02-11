// services/mockApi.ts
interface Repository {
  name: string;
  // Add other repository fields as needed
}

interface File {
  content: string;
  name: string;
  // Add other file content fields as needed
}

interface FileContent {
  content: string;
  name: string;
  // Add other file fields as needed
}

interface ReadmeResponse {
  content: string;
  name: string;
}

export const getMockRepositories = async () => {
  return new Promise<{ data: Repository[] }>((resolve) => {
    setTimeout(() => {
      resolve({
        data: [{ name: 'mock-repo-1' }, { name: 'mock-repo-2' }, { name: 'mock-repo-3' }],
      });
    }, 500); // Simulate network delay
  });
};

export const getMockRepositoryReadme = async (_repoName: string) => {
  return new Promise<{ data: ReadmeResponse }>((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          content: 'This is a mock README content.',
          name: 'README.md',
        },
      });
    }, 500); // Simulate network delay
  });
};

export const getMockRepositoryFiles = async (_repoName: string) => {
  return new Promise<{ data: File[] }>((resolve) => {
    setTimeout(() => {
      resolve({
        data: [
          { name: 'mock-file-1', content: 'Mock content 1' },
          { name: 'mock-file-2', content: 'Mock content 2' },
          { name: 'mock-file-3', content: 'Mock content 3' },
        ],
      });
    }, 500); // Simulate network delay
  });
};

export const getMockFileContent = async (_repoName: string, filePath: string) => {
  return new Promise<{ data: FileContent }>((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          content: 'This is mock file content.',
          name: filePath,
        },
      });
    }, 500); // Simulate network delay
  });
};
