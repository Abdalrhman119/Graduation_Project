using AutoMapper;
using Domain.Contracts;
using Domain.Models;
using ServicesAbstraction;
using Shared.DTO.MedicalRecord;

namespace Services
{
    public class MedicalRecordService : IMedicalRecordService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public MedicalRecordService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<MedicalRecordDto?> GetMedicalRecordByIdAsync(int recordId)
        {
            var record = await _unitOfWork.MedicalRecords.GetByIdAsync(recordId);

            if (record == null)
                return null;

            return _mapper.Map<MedicalRecordDto>(record);
        }

        public async Task<MedicalRecordDto?> GetMedicalRecordByPatientIdAsync(int patientId)
        {
            var records = await _unitOfWork.MedicalRecords.GetAllAsync();
            var record = records.FirstOrDefault(r => r.PatientId == patientId);

            if (record == null)
                return null;

            return _mapper.Map<MedicalRecordDto>(record);
        }

        public async Task<MedicalRecordDto> CreateMedicalRecordAsync(CreateMedicalRecordDto createMedicalRecordDto)
        {
            var patient = await _unitOfWork.Patients.GetByIdAsync(createMedicalRecordDto.PatientId);
            if (patient == null)
                throw new Exception("Patient not found");

            if (await PatientHasMedicalRecordAsync(createMedicalRecordDto.PatientId))
                throw new Exception("Patient already has a medical record");

            var record = _mapper.Map<MedicalRecord>(createMedicalRecordDto);

            await _unitOfWork.MedicalRecords.AddAsync(record);
            await _unitOfWork.CompleteAsync();

            return _mapper.Map<MedicalRecordDto>(record);
        }

        public async Task<MedicalRecordDto?> UpdateMedicalRecordAsync(UpdateMedicalRecordDto updateMedicalRecordDto)
        {
            var existingRecord = await _unitOfWork.MedicalRecords.GetByIdAsync(updateMedicalRecordDto.RecId);

            if (existingRecord == null)
                return null;

            _mapper.Map(updateMedicalRecordDto, existingRecord);

            _unitOfWork.MedicalRecords.Update(existingRecord);
            await _unitOfWork.CompleteAsync();

            return _mapper.Map<MedicalRecordDto>(existingRecord);
        }

        public async Task<bool> DeleteMedicalRecordAsync(int recordId)
        {
            var record = await _unitOfWork.MedicalRecords.GetByIdAsync(recordId);

            if (record == null)
                return false;

            _unitOfWork.MedicalRecords.Delete(record);
            await _unitOfWork.CompleteAsync();

            return true;
        }

        public async Task<bool> MedicalRecordExistsAsync(int recordId)
        {
            var record = await _unitOfWork.MedicalRecords.GetByIdAsync(recordId);
            return record != null;
        }

        public async Task<bool> PatientHasMedicalRecordAsync(int patientId)
        {
            var records = await _unitOfWork.MedicalRecords.GetAllAsync();
            return records.Any(r => r.PatientId == patientId);
        }
    }
}