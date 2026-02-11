export interface File {
  content: string;
  name: string;
}

export interface FileContent extends File {}

export interface ReadmeResponse extends File {}
