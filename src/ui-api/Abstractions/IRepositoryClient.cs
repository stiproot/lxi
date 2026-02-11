namespace Abstractions;

public interface IRepositoryClient
{
  Task<IEnumerable<RepositorySummary>> GetRepositoriesAsync();
  Task<string> GetRepositoryInfoAsync(string repositoryName);
  Task<string> GetRepositoryFilesAsync(string repositoryName);
  Task<string> GetRepositoryFileContentAsync(string repositoryName, string filePath);
}

