using Shared.DTO.Report;

namespace ServicesAbstraction
{
    public interface IReportService
    {
        Task<IEnumerable<ReportDto>> GetAllReportsAsync();
        Task<IEnumerable<ReportDto>> GetReportsByPatientIdAsync(int patientId);
        Task<IEnumerable<ReportDto>> GetReportsByDoctorIdAsync(int doctorId);
        Task<ReportDto?> GetReportByIdAsync(int reportId);
        Task<ReportDto> CreateReportAsync(CreateReportDto createReportDto);
        Task<bool> DeleteReportAsync(int reportId);
        Task<bool> ReportExistsAsync(int reportId);
    }
}