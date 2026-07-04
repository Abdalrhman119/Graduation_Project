using AutoMapper;
using Domain.Contracts;
using Domain.Models;
using Microsoft.EntityFrameworkCore;
using ServicesAbstraction;
using Shared.DTO.Patient;

namespace Services
{
    public class PatientService : IPatientService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public PatientService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<IEnumerable<PatientDto>> GetAllPatientsAsync()
        {
            var patients = await _unitOfWork.Patients.GetAllAsync();
            return _mapper.Map<IEnumerable<PatientDto>>(patients);
        }

        public async Task<PatientDto?> GetPatientByIdAsync(int patientId)
        {
            var patient = await _unitOfWork.Patients.GetByIdAsync(patientId);

            if (patient == null)
                return null;

            return _mapper.Map<PatientDto>(patient);
        }

        public async Task<PatientDto?> GetPatientByUserIdAsync(string userId)
        {
            var patients = await _unitOfWork.Patients.GetAllAsync();
            var patient = patients.FirstOrDefault(p => p.UserId == userId);

            if (patient == null)
                return null;

            return _mapper.Map<PatientDto>(patient);
        }

        public async Task<PatientDto> CreatePatientAsync(CreatePatientDto createPatientDto, string userId)
        {
            if (await PatientExistsByEmailAsync(createPatientDto.Email))
                throw new Exception("A patient with this email already exists");

            var patient = _mapper.Map<Patient>(createPatientDto);
            patient.UserId = userId;

            var today = DateOnly.FromDateTime(DateTime.Today);
            int age = today.Year - patient.BirthDate.Year;
            if (patient.BirthDate > today.AddYears(-age)) age--;
            patient.Age = age;

            await _unitOfWork.Patients.AddAsync(patient);
            await _unitOfWork.CompleteAsync();

            return _mapper.Map<PatientDto>(patient);
        }

        public async Task<PatientDto?> UpdatePatientAsync(UpdatePatientDto updatePatientDto)
        {
            var existingPatient = await _unitOfWork.Patients.GetByIdAsync(updatePatientDto.PatientId);

            if (existingPatient == null)
                return null;

            _mapper.Map(updatePatientDto, existingPatient);

            if (updatePatientDto.BirthDate.HasValue)
            {
                var today = DateOnly.FromDateTime(DateTime.Today);
                int age = today.Year - existingPatient.BirthDate.Year;
                if (existingPatient.BirthDate > today.AddYears(-age)) age--;
                existingPatient.Age = age;
            }

            _unitOfWork.Patients.Update(existingPatient);
            await _unitOfWork.CompleteAsync();

            return _mapper.Map<PatientDto>(existingPatient);
        }

        public async Task<bool> DeletePatientAsync(int patientId)
        {
            var patient = await _unitOfWork.Patients.GetByIdAsync(patientId);
            if (patient == null)
                return false;

            _unitOfWork.Patients.Delete(patient);
            await _unitOfWork.CompleteAsync();
            return true;
        }

        public async Task<bool> PatientExistsAsync(int patientId)
        {
            var patient = await _unitOfWork.Patients.GetByIdAsync(patientId);
            return patient != null;
        }

        public async Task<bool> PatientExistsByEmailAsync(string email)
        {
            var patients = await _unitOfWork.Patients.GetAllAsync();
            return patients.Any(p => p.Email.ToLower() == email.ToLower());
        }
    }
}