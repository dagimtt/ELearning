using ELearning.Application.DTOs.Certificates;

namespace ELearning.Application.Interfaces;

public interface ICertificateService
{
    Task<CertificateDto> IssueAsync(Guid courseId, Guid learnerId, IssueCertificateRequest request, CancellationToken ct = default);
    Task<CertificateDto> RevokeAsync(Guid certificateId, RevokeCertificateRequest request, CancellationToken ct = default);
    Task<IEnumerable<CertificateDto>> GetMineAsync(CancellationToken ct = default);
    Task<CertificateDto> GetByIdAsync(Guid certificateId, CancellationToken ct = default);
    Task<PublicCertificateDto> VerifyByCodeAsync(string code, CancellationToken ct = default);
    Task<(byte[] PdfBytes, string FileName)> GeneratePdfAsync(Guid certificateId, CancellationToken ct = default);
    Task<IEnumerable<CertificateDto>> GetByCourseAsync(Guid courseId, CancellationToken ct = default);
}