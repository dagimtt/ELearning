using ELearning.Application.DTOs.Exams;

namespace ELearning.Application.Interfaces;

public interface IExamService
{
    // Instructor
    Task<ExamInstructorDto> GetForInstructorAsync(Guid lessonId, CancellationToken ct = default);
    Task<ExamQuestionInstructorDto> AddQuestionAsync(Guid lessonId, UpsertExamQuestionRequest request, CancellationToken ct = default);
    Task<ExamQuestionInstructorDto> UpdateQuestionAsync(Guid questionId, UpsertExamQuestionRequest request, CancellationToken ct = default);
    Task DeleteQuestionAsync(Guid questionId, CancellationToken ct = default);
    Task<IEnumerable<ExamQuestionInstructorDto>> ReorderQuestionsAsync(Guid lessonId, ReorderExamQuestionsRequest request, CancellationToken ct = default);

    // Learner
    Task<ExamLearnerDto> GetForLearnerAsync(Guid enrollmentId, Guid lessonId, CancellationToken ct = default);
    Task<ExamResultDto> SubmitAsync(Guid enrollmentId, Guid lessonId, SubmitExamRequest request, CancellationToken ct = default);
    Task<IEnumerable<ExamAttemptSummaryDto>> GetAttemptsAsync(Guid enrollmentId, Guid lessonId, CancellationToken ct = default);
}