using ELearning.Application.DTOs.Lessons;

namespace ELearning.Application.Interfaces;

public interface ILessonService
{
    Task<IEnumerable<PublicLessonDto>> GetPublicByCourseAsync(Guid courseId, CancellationToken ct = default);
    Task<LessonDto> GetByIdAsync(Guid lessonId, CancellationToken ct = default);
    Task<LessonDto> CreateAsync(Guid courseId, CreateLessonRequest request, CancellationToken ct = default);
    Task<LessonDto> UpdateAsync(Guid lessonId, UpdateLessonRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid lessonId, CancellationToken ct = default);
    Task<IEnumerable<LessonDto>> ReorderAsync(Guid courseId, ReorderLessonsRequest request, CancellationToken ct = default);
}