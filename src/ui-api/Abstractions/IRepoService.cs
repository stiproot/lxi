namespace Abstractions;

public interface IRepoService
{
  Task<IDictionary<string, RepositorySummary>> GetRepositoriesAsync();
  Task<RepositorySummary> GetRepositoryAsync(string repositoryName);
  Task UpdateRepositoryAsync(RepositorySummary repository);
  Task UpdateRepositoryStatusAsync(
    string repoName,
    string embeddingStatus
  );
  Task AddReposAsync(IDictionary<string, RepositorySummary> keyValuePairs);
}