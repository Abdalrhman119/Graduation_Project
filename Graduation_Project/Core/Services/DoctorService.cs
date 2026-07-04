using AutoMapper;
using Domain.Contracts;
using Domain.Models;
using ServicesAbstraction;
using Shared.DTO.Doctor;

namespace Services
{
    public class DoctorService : IDoctorService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public DoctorService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<IEnumerable<DoctorDto>> GetAllDoctorsAsync()
        {
            var doctors = await _unitOfWork.Doctors.GetAllAsync();
            return _mapper.Map<IEnumerable<DoctorDto>>(doctors);
        }

        public async Task<IEnumerable<DoctorDto>> GetAvailableDoctorsAsync()
        {
            var doctors = await _unitOfWork.Doctors.GetAllAsync();
            var availableDoctors = doctors.Where(d => d.IsAvailable);
            return _mapper.Map<IEnumerable<DoctorDto>>(availableDoctors);
        }

        public async Task<DoctorDto?> GetDoctorByIdAsync(int doctorId)
        {
            var doctor = await _unitOfWork.Doctors.GetByIdAsync(doctorId);

            if (doctor == null)
                return null;

            return _mapper.Map<DoctorDto>(doctor);
        }

        public async Task<DoctorDto?> GetDoctorByUserIdAsync(string userId)
        {
            var doctors = await _unitOfWork.Doctors.GetAllAsync();
            var doctor = doctors.FirstOrDefault(d => d.UserId == userId);

            if (doctor == null)
                return null;

            return _mapper.Map<DoctorDto>(doctor);
        }

        public async Task<DoctorDto> CreateDoctorAsync(CreateDoctorDto createDoctorDto, string userId)
        {
            if (await DoctorExistsByEmailAsync(createDoctorDto.Email))
                throw new Exception("A doctor with this email already exists");

            if (await DoctorExistsByLicenceAsync(createDoctorDto.LicenceNum))
                throw new Exception("A doctor with this licence number already exists");

            var doctor = _mapper.Map<Doctor>(createDoctorDto);
            doctor.UserId = userId;
            doctor.Rating = 0;
            doctor.IsAvailable = true;

            var today = DateOnly.FromDateTime(DateTime.Today);
            int age = today.Year - doctor.BirthDate.Year;
            if (doctor.BirthDate > today.AddYears(-age)) age--;
            doctor.Age = age;

            await _unitOfWork.Doctors.AddAsync(doctor);
            await _unitOfWork.CompleteAsync();

            return _mapper.Map<DoctorDto>(doctor);
        }

        public async Task<DoctorDto?> UpdateDoctorAsync(UpdateDoctorDto updateDoctorDto)
        {
            var existingDoctor = await _unitOfWork.Doctors.GetByIdAsync(updateDoctorDto.DoctorId);

            if (existingDoctor == null)
                return null;

            _mapper.Map(updateDoctorDto, existingDoctor);

            if (updateDoctorDto.BirthDate.HasValue)
            {
                var today = DateOnly.FromDateTime(DateTime.Today);
                int age = today.Year - existingDoctor.BirthDate.Year;
                if (existingDoctor.BirthDate > today.AddYears(-age)) age--;
                existingDoctor.Age = age;
            }

            _unitOfWork.Doctors.Update(existingDoctor);
            await _unitOfWork.CompleteAsync();

            return _mapper.Map<DoctorDto>(existingDoctor);
        }

        public async Task<bool> DeleteDoctorAsync(int doctorId)
        {
            var doctor = await _unitOfWork.Doctors.GetByIdAsync(doctorId);

            if (doctor == null)
                return false;

            _unitOfWork.Doctors.Delete(doctor);
            await _unitOfWork.CompleteAsync();

            return true;
        }

        public async Task<bool> UpdateAvailabilityAsync(int doctorId, bool isAvailable)
        {
            var doctor = await _unitOfWork.Doctors.GetByIdAsync(doctorId);

            if (doctor == null)
                return false;

            doctor.IsAvailable = isAvailable;
            _unitOfWork.Doctors.Update(doctor);
            await _unitOfWork.CompleteAsync();

            return true;
        }

        public async Task<bool> UpdateRatingAsync(int doctorId, double newRating)
        {
            var doctor = await _unitOfWork.Doctors.GetByIdAsync(doctorId);

            if (doctor == null)
                return false;

            if (newRating < 0 || newRating > 5)
                throw new Exception("Rating must be between 0 and 5");

            // Calculate cumulative average: newAvg = (oldAvg * count + newRating) / (count + 1)
            doctor.Rating = (doctor.Rating * doctor.RatingCount + newRating) / (doctor.RatingCount + 1);
            doctor.RatingCount += 1;

            _unitOfWork.Doctors.Update(doctor);
            await _unitOfWork.CompleteAsync();

            return true;
        }

        public async Task<bool> DoctorExistsAsync(int doctorId)
        {
            var doctor = await _unitOfWork.Doctors.GetByIdAsync(doctorId);
            return doctor != null;
        }

        public async Task<bool> DoctorExistsByEmailAsync(string email)
        {
            var doctors = await _unitOfWork.Doctors.GetAllAsync();
            return doctors.Any(d => d.Email.ToLower() == email.ToLower());
        }

        public async Task<bool> DoctorExistsByLicenceAsync(string licenceNum)
        {
            var doctors = await _unitOfWork.Doctors.GetAllAsync();
            return doctors.Any(d => d.LicenceNum == licenceNum);
        }
    }
}