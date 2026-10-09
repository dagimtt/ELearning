using System.Security.Cryptography;

namespace ELearning.Infrastructure.Services;

public static class CertificateCodeGenerator
{
    // Base32 without ambiguous characters: no 0/O, 1/I/L
    private const string Alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

    public static string Generate()
    {
        var year = DateTime.UtcNow.Year;
        var bytes = RandomNumberGenerator.GetBytes(8);
        var chars = new char[8];

        for (var i = 0; i < 8; i++)
            chars[i] = Alphabet[bytes[i] % Alphabet.Length];

        return $"EL-{year}-{new string(chars)}";
    }
}