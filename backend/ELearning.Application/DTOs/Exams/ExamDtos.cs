namespace ELearning.Application.DTOs.Exams;

// A single option within a question
public record ExamOptionDto(string Id, string Text);

// Instructor view — includes correct answer
public record ExamQuestionInstructorDto(
    Guid Id,
    int OrderIndex,
    string QuestionText,
    IEnumerable<ExamOptionDto> Options,
    string CorrectOptionId,
    int Points);

// Learner view — no correct answer
public record ExamQuestionLearnerDto(
    Guid Id,
    int OrderIndex,
    string QuestionText,
    IEnumerable<ExamOptionDto> Options,
    int Points);

// Instructor payload for creating/updating a question
public record UpsertExamQuestionRequest(
    string QuestionText,
    IEnumerable<ExamOptionDto> Options,
    string CorrectOptionId,
    int Points);

public record ReorderExamQuestionsRequest(IReadOnlyList<Guid> QuestionIds);

// Instructor: full exam detail
public record ExamInstructorDto(
    Guid LessonId,
    Guid CourseId,
    string Title,
    string? Description,
    int PassScore,
    int? MaxAttempts,
    IEnumerable<ExamQuestionInstructorDto> Questions);

// Learner: exam payload for taking
public record ExamLearnerDto(
    Guid LessonId,
    Guid CourseId,
    Guid EnrollmentId,
    string Title,
    string? Description,
    int PassScore,
    int? MaxAttempts,
    int AttemptCount,
    int? BestScore,
    bool AlreadyPassed,
    IEnumerable<ExamQuestionLearnerDto> Questions);

// Learner: one past attempt
public record ExamAttemptSummaryDto(
    Guid Id,
    DateTime StartedAt,
    DateTime? SubmittedAt,
    int Score,
    bool Passed,
    int PassScoreRequired);

// Learner: submit answers
public record SubmitExamRequest(IReadOnlyList<ExamAnswerDto> Answers);
public record ExamAnswerDto(Guid QuestionId, string SelectedOptionId);

// Result of submitting
public record ExamResultDto(
    Guid AttemptId,
    int Score,
    int PassScoreRequired,
    bool Passed,
    int CorrectCount,
    int TotalCount,
    IEnumerable<ExamQuestionResultDto> QuestionResults,
    bool LessonMarkedComplete);

public record ExamQuestionResultDto(Guid QuestionId, bool IsCorrect);