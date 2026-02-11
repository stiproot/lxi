namespace Abstractions;

public interface IUserService
{
  Task<IEnumerable<UserInfo>> GetAllUsersAsync();
  Task<UserInfo?> TryGetUserByIdAsync(string userId);
  Task CreateUserAsync(UserInfo user);
  Task UpdateUserAsync(UserInfo user);
  Task<bool> DeleteUserAsync(string userId);
  Task<IEnumerable<UserInfo>> SearchUsersAsync(string query);
}