using Shared.DTO.Patient;

namespace ServicesAbstraction
{
    public interface IPatientService
    {
        Task<IEnumerable<PatientDto>> GetAllPatientsAsync();
        Task<PatientDto?> GetPatientByIdAsync(int patientId);
        Task<PatientDto?> GetPatientByUserIdAsync(string userId);
        Task<PatientDto> CreatePatientAsync(CreatePatientDto createPatientDto, string userId);
        Task<PatientDto?> UpdatePatientAsync(UpdatePatientDto updatePatientDto);
        Task<bool> DeletePatientAsync(int patientId);
        Task<bool> PatientExistsAsync(int patientId);
        Task<bool> PatientExistsByEmailAsync(string email);
    }
}