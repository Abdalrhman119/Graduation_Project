using Shared.DTO.MedicalRecord;

namespace ServicesAbstraction
{
    public interface IMedicalRecordService
    {
        Task<MedicalRecordDto?> GetMedicalRecordByIdAsync(int recordId);
        Task<MedicalRecordDto?> GetMedicalRecordByPatientIdAsync(int patientId);
        Task<MedicalRecordDto> CreateMedicalRecordAsync(CreateMedicalRecordDto createMedicalRecordDto);
        Task<MedicalRecordDto?> UpdateMedicalRecordAsync(UpdateMedicalRecordDto updateMedicalRecordDto);
        Task<bool> DeleteMedicalRecordAsync(int recordId);
        Task<bool> MedicalRecordExistsAsync(int recordId);
        Task<bool> PatientHasMedicalRecordAsync(int patientId);
    }
}