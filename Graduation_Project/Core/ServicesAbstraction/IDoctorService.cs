using Shared.DTO.Doctor;

namespace ServicesAbstraction
{
    public interface IDoctorService
    {
        Task<IEnumerable<DoctorDto>> GetAllDoctorsAsync();
        Task<IEnumerable<DoctorDto>> GetAvailableDoctorsAsync();
        Task<DoctorDto?> GetDoctorByIdAsync(int doctorId);
        Task<DoctorDto?> GetDoctorByUserIdAsync(string userId);
        Task<DoctorDto> CreateDoctorAsync(CreateDoctorDto createDoctorDto, string userId);
        Task<DoctorDto?> UpdateDoctorAsync(UpdateDoctorDto updateDoctorDto);
        Task<bool> DeleteDoctorAsync(int doctorId);
        Task<bool> UpdateAvailabilityAsync(int doctorId, bool isAvailable);
        Task<bool> UpdateRatingAsync(int doctorId, double newRating);
        Task<bool> DoctorExistsAsync(int doctorId);
        Task<bool> DoctorExistsByEmailAsync(string email);
        Task<bool> DoctorExistsByLicenceAsync(string licenceNum);
    }
}