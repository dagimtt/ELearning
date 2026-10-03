using ELearning.Domain.Entities;

namespace ELearning.Application.Interfaces;

public interface IJwtTokenService
{
    string CreateAccessToken(AppUser user, IEnumerable<string> roles);
    string CreateRefreshToken();
}