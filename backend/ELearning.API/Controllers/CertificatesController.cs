using ELearning.Application.DTOs.Certificates;
using ELearning.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ELearning.API.Controllers;

[ApiController]
public class CertificatesController : ControllerBase
{
    private readonly ICertificateService _certificates;
    public CertificatesController(ICertificateService certificates) => _certificates = certificates;

    // ---------- Instructor ----------

    [HttpPost("api/courses/{courseId:guid}/certificates/issue/{learnerId:guid}")]
    [Authorize(Roles = "Instructor")]
    public async Task<ActionResult<CertificateDto>> Issue(
        Guid courseId, Guid learnerId, IssueCertificateRequest request, CancellationToken ct)
    {
        var cert = await _certificates.IssueAsync(courseId, learnerId, request, ct);
        return Ok(cert);
    }

    [HttpGet("api/courses/{courseId:guid}/certificates")]
    [Authorize(Roles = "Instructor")]
public async Task<ActionResult<IEnumerable<CertificateDto>>> GetByCourse(Guid courseId, CancellationToken ct)
    => Ok(await _certificates.GetByCourseAsync(courseId, ct));

    [HttpPost("api/certificates/{id:guid}/revoke")]
    [Authorize(Roles = "Instructor")]
    public async Task<ActionResult<CertificateDto>> Revoke(
        Guid id, RevokeCertificateRequest request, CancellationToken ct)
        => Ok(await _certificates.RevokeAsync(id, request, ct));

    // ---------- Learner ----------

    [HttpGet("api/learner/certificates")]
    [Authorize(Roles = "Learner")]
    public async Task<ActionResult<IEnumerable<CertificateDto>>> GetMine(CancellationToken ct)
        => Ok(await _certificates.GetMineAsync(ct));

    [HttpGet("api/certificates/{id:guid}")]
    [Authorize]
    public async Task<ActionResult<CertificateDto>> GetById(Guid id, CancellationToken ct)
        => Ok(await _certificates.GetByIdAsync(id, ct));

    [HttpGet("api/certificates/{id:guid}/pdf")]
    [Authorize]
    public async Task<IActionResult> DownloadPdf(Guid id, CancellationToken ct)
    {
        var (bytes, fileName) = await _certificates.GeneratePdfAsync(id, ct);
        return File(bytes, "application/pdf", fileName);
    }

    // ---------- Public ----------

    [HttpGet("api/certificates/verify/{code}")]
    [AllowAnonymous]
    public async Task<ActionResult<PublicCertificateDto>> Verify(string code, CancellationToken ct)
        => Ok(await _certificates.VerifyByCodeAsync(code, ct));
}