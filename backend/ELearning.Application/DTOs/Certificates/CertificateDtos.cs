namespace ELearning.Application.DTOs.Certificates;

public record CertificateDto(
    Guid Id,
    string Code,
    Guid CourseId,
    string CourseTitle,
    Guid LearnerId,
    string LearnerName,
    Guid IssuedByInstructorId,
    string InstructorName,
    DateTime IssuedAt,
    string Title,
    string? Message,
    DateTime? RevokedAt,
    string? RevokedReason,
    bool IsActive);

public record PublicCertificateDto(
    string Code,
    string CourseTitle,
    string LearnerName,
    string InstructorName,
    DateTime IssuedAt,
    string Title,
    bool IsValid);

public record IssueCertificateRequest(
    string? Title,
    string? Message);

public record RevokeCertificateRequest(string Reason);