using Microsoft.AspNetCore.Http;
using Shared.DTO.AIResult;

namespace ServicesAbstraction
{
    public interface IAIResultService
    {
        Task<IEnumerable<AIResultDto>> GetAllResultsAsync();
        Task<IEnumerable<AIResultDto>> GetResultsByPatientIdAsync(int patientId);
        Task<IEnumerable<AIResultDto>> GetResultsByDoctorIdAsync(int doctorId);
        Task<IEnumerable<AIResultDto>> GetUnreviewedResultsAsync();
        Task<AIResultDto?> GetResultByIdAsync(int resultId);
        Task<AIResultDto> UploadAndAnalyzeImageAsync(int patientId, IFormFile image);
        Task<AIResultDto> AnalyzeImageDirectlyAsync(IFormFile image);
        Task<AIResultDto?> AssignDoctorAsync(AssignDoctorDto assignDto);
        Task<AIResultDto?> ReviewResultAsync(ReviewAIResultDto reviewDto);
        Task<bool> DeleteResultAsync(int resultId);
    }
}