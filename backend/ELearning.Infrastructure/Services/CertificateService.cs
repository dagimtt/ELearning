using ELearning.Application.DTOs.Certificates;
using ELearning.Application.Interfaces;
using ELearning.Domain.Entities;
using ELearning.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Infrastructure.Services;

public class CertificateService : ICertificateService
{
    private const string DefaultTitle = "Certificate of Completion";

    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly CertificatePdfService _pdf;

    public CertificateService(AppDbContext db, ICurrentUserService currentUser, CertificatePdfService pdf)
    {
        _db = db;
        _currentUser = currentUser;
        _pdf = pdf;
    }

    public async Task<CertificateDto> IssueAsync(
        Guid courseId, Guid learnerId, IssueCertificateRequest request, CancellationToken ct = default)
    {
        var instructorId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("Not authenticated.");

        var course = await _db.Courses
            .FirstOrDefaultAsync(c => c.Id == courseId, ct)
            ?? throw new KeyNotFoundException("Course not found.");

        if (course.InstructorId != instructorId && !_currentUser.IsInRole("Admin"))
            throw new UnauthorizedAccessException("You do not own this course.");

        // Find the learner's enrollment
        var enrollment = await _db.Enrollments
            .Include(e => e.ProgressRecords)
            .FirstOrDefaultAsync(e => e.CourseId == courseId && e.LearnerId == learnerId, ct)
            ?? throw new InvalidOperationException("This learner is not enrolled in this course.");

        // Verify completion: all lessons marked complete
        var totalLessons = await _db.Lessons
            .Where(l => l.CourseId == courseId)
            .CountAsync(ct);

        if (totalLessons == 0)
            throw new InvalidOperationException("Cannot issue a certificate for a course with no lessons.");

        if (enrollment.ProgressRecords.Count < totalLessons)
            throw new InvalidOperationException(
                $"Learner has only completed {enrollment.ProgressRecords.Count} of {totalLessons} lessons.");

        // Prevent duplicate active certificate
        var existingActive = await _db.Certificates
            .AnyAsync(c => c.LearnerId == learnerId
                        && c.CourseId == courseId
                        && c.RevokedAt == null, ct);

        if (existingActive)
            throw new InvalidOperationException("An active certificate already exists for this learner and course.");

        var certificate = new Certificate
        {
            Code = CertificateCodeGenerator.Generate(),
            EnrollmentId = enrollment.Id,
            CourseId = courseId,
            LearnerId = learnerId,
            IssuedByInstructorId = instructorId,
            IssuedAt = DateTime.UtcNow,
            Title = string.IsNullOrWhiteSpace(request.Title) ? DefaultTitle : request.Title,
            Message = request.Message
        };

        _db.Certificates.Add(certificate);
        await _db.SaveChangesAsync(ct);

        return await LoadDtoAsync(certificate.Id, ct);
    }

    public async Task<CertificateDto> RevokeAsync(
        Guid certificateId, RevokeCertificateRequest request, CancellationToken ct = default)
    {
        var instructorId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("Not authenticated.");

        var cert = await _db.Certificates
            .Include(c => c.Course)
            .FirstOrDefaultAsync(c => c.Id == certificateId, ct)
            ?? throw new KeyNotFoundException("Certificate not found.");

        if (cert.IssuedByInstructorId != instructorId
            && cert.Course.InstructorId != instructorId
            && !_currentUser.IsInRole("Admin"))
            throw new UnauthorizedAccessException("You cannot revoke this certificate.");

        if (cert.RevokedAt is not null)
            throw new InvalidOperationException("This certificate is already revoked.");

        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new InvalidOperationException("A reason is required to revoke a certificate.");

        cert.RevokedAt = DateTime.UtcNow;
        cert.RevokedReason = request.Reason;
        cert.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return await LoadDtoAsync(certificateId, ct);
    }

    public async Task<IEnumerable<CertificateDto>> GetMineAsync(CancellationToken ct = default)
    {
        var learnerId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("Not authenticated.");

        var certs = await _db.Certificates
            .Where(c => c.LearnerId == learnerId)
            .Include(c => c.Course)
            .Include(c => c.Learner)
            .Include(c => c.IssuedByInstructor)
            .OrderByDescending(c => c.IssuedAt)
            .ToListAsync(ct);

        return certs.Select(Map);
    }

    public async Task<CertificateDto> GetByIdAsync(Guid certificateId, CancellationToken ct = default)
    {
        var cert = await LoadOwnedOrIssuedAsync(certificateId, ct);
        return Map(cert);
    }

    public async Task<PublicCertificateDto> VerifyByCodeAsync(string code, CancellationToken ct = default)
    {
        var cert = await _db.Certificates
            .Include(c => c.Course)
            .Include(c => c.Learner)
            .Include(c => c.IssuedByInstructor)
            .FirstOrDefaultAsync(c => c.Code == code, ct)
            ?? throw new KeyNotFoundException("Certificate not found.");

        return new PublicCertificateDto(
            cert.Code,
            cert.Course.Title,
            cert.Learner.FullName,
            cert.IssuedByInstructor.FullName,
            cert.IssuedAt,
            cert.Title,
            cert.IsActive);
    }

    public async Task<(byte[] PdfBytes, string FileName)> GeneratePdfAsync(
        Guid certificateId, CancellationToken ct = default)
    {
        var cert = await LoadOwnedOrIssuedAsync(certificateId, ct);

        var baseUrl = "https://your-domain.com"; // TODO: move to config
        return await _pdf.GenerateAsync(cert.Id, baseUrl, ct);
    }

    // ----- helpers -----

    private async Task<Certificate> LoadOwnedOrIssuedAsync(Guid certificateId, CancellationToken ct)
    {
        var userId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("Not authenticated.");

        var cert = await _db.Certificates
            .Include(c => c.Course)
            .Include(c => c.Learner)
            .Include(c => c.IssuedByInstructor)
            .FirstOrDefaultAsync(c => c.Id == certificateId, ct)
            ?? throw new KeyNotFoundException("Certificate not found.");

        var isLearner = cert.LearnerId == userId;
        var isInstructor = cert.IssuedByInstructorId == userId
                        || cert.Course.InstructorId == userId;
        var isAdmin = _currentUser.IsInRole("Admin");

        if (!isLearner && !isInstructor && !isAdmin)
            throw new UnauthorizedAccessException("You cannot view this certificate.");

        return cert;
    }

    private async Task<CertificateDto> LoadDtoAsync(Guid certificateId, CancellationToken ct)
    {
        var cert = await _db.Certificates
            .Include(c => c.Course)
            .Include(c => c.Learner)
            .Include(c => c.IssuedByInstructor)
            .FirstAsync(c => c.Id == certificateId, ct);

        return Map(cert);
    }
    public async Task<IEnumerable<CertificateDto>> GetByCourseAsync(Guid courseId, CancellationToken ct = default)
{
    var instructorId = _currentUser.UserId
        ?? throw new UnauthorizedAccessException("Not authenticated.");

    var course = await _db.Courses
        .FirstOrDefaultAsync(c => c.Id == courseId, ct)
        ?? throw new KeyNotFoundException("Course not found.");

    if (course.InstructorId != instructorId && !_currentUser.IsInRole("Admin"))
        throw new UnauthorizedAccessException("You do not own this course.");

    var certs = await _db.Certificates
        .Where(c => c.CourseId == courseId)
        .Include(c => c.Course)
        .Include(c => c.Learner)
        .Include(c => c.IssuedByInstructor)
        .OrderByDescending(c => c.IssuedAt)
        .ToListAsync(ct);

    return certs.Select(Map);
}

    private static CertificateDto Map(Certificate c) => new(
        c.Id,
        c.Code,
        c.CourseId,
        c.Course.Title,
        c.LearnerId,
        c.Learner.FullName,
        c.IssuedByInstructorId,
        c.IssuedByInstructor.FullName,
        c.IssuedAt,
        c.Title,
        c.Message,
        c.RevokedAt,
        c.RevokedReason,
        c.IsActive);
}