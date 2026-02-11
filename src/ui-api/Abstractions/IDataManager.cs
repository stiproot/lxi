namespace Abstractions;

public interface IDataManager
{
  Task EmbedRepositoryAsync(
    RepositorySummary repository,
    CancellationToken cancellationToken
  );
}
