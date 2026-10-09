namespace ELearning.Application.DTOs.Admin;

public record AdminStatsDto(
    int TotalUsers,
    int Admins,
    int Instructors,
    int Learners,
    int TotalCourses,
    int PublishedCourses,
    int DraftCourses,
    int TotalEnrollments,
    int TotalLessons);