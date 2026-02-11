using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;

namespace Services;

public class AzureDevOpsClient(HttpClient client, IConfiguration configuration) : IRepositoryClient
{
  private readonly HttpClient _client = client;
  private readonly string _organization = configuration["AzureDevOps:Organization"]
    ?? throw new InvalidOperationException("AzureDevOps:Organization configuration is required");

  public async Task<IEnumerable<RepositorySummary>> GetRepositoriesAsync()
  {
    string url = $"https://dev.azure.com/{_organization}/Software/_apis/git/repositories";

    HttpResponseMessage response = await _client.GetAsync(url);
    response.EnsureSuccessStatusCode();

    string content = await response.Content.ReadAsStringAsync();
    RepositoriesResponse allRepositories = JsonConvert.DeserializeObject<RepositoriesResponse>(content)!;
    return allRepositories.Value.Where(r => !r.IsDisabled);
  }

  public async Task<string> GetRepositoryInfoAsync(string repositoryName)
  {
    string url = $"https://dev.azure.com/{_organization}/Software/_apis/git/repositories/{repositoryName}?api-version=6.0";

    HttpResponseMessage response = await _client.GetAsync(url);
    response.EnsureSuccessStatusCode();

    string content = await response.Content.ReadAsStringAsync();
    return content;
  }

  public async Task<string> GetRepositoryFilesAsync(string repositoryName)
  {
    string url = $"https://dev.azure.com/{_organization}/Software/_apis/git/repositories/{repositoryName}/items?recursionLevel=Full&includeContentMetadata=true&api-version=7.0";
    HttpResponseMessage response = await _client.GetAsync(url);

    response.EnsureSuccessStatusCode();

    string content = await response.Content.ReadAsStringAsync();
    return content;
  }

  public async Task<string> GetRepositoryFileContentAsync(
    string repositoryName,
    string filePath
  )
  {
    string url = $"https://dev.azure.com/{_organization}/Software/_apis/git/repositories/{repositoryName}/items?path={filePath}&api-version=6.0";
    HttpResponseMessage response = await _client.GetAsync(url);

    response.EnsureSuccessStatusCode();

    string content = await response.Content.ReadAsStringAsync();
    return content;
  }
}
