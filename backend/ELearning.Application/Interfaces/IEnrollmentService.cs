using ELearning.Application.DTOs.Enrollments;

namespace ELearning.Application.Interfaces;

public interface IEnrollmentService
{
    Task<EnrollmentSummaryDto> EnrollAsync(Guid courseId, CancellationToken ct = default);
    Task<IEnumerable<EnrollmentSummaryDto>> GetMyEnrollmentsAsync(CancellationToken ct = default);
    Task<EnrollmentDetailDto> GetDetailAsync(Guid enrollmentId, CancellationToken ct = default);
    Task<LessonContentDto> GetLessonContentAsync(Guid enrollmentId, Guid lessonId, CancellationToken ct = default);
    Task<EnrolledLessonDto> MarkCompleteAsync(Guid enrollmentId, Guid lessonId, CancellationToken ct = default);
    Task<EnrolledLessonDto> UnmarkCompleteAsync(Guid enrollmentId, Guid lessonId, CancellationToken ct = default);
}