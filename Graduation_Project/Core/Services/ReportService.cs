using AutoMapper;
using Domain.Contracts;
using Domain.Models;
using ServicesAbstraction;
using Shared.DTO.Report;

namespace Services
{
    public class ReportService : IReportService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ReportService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<IEnumerable<ReportDto>> GetAllReportsAsync()
        {
            var reports = await _unitOfWork.Reports.GetAllAsync();
            return _mapper.Map<IEnumerable<ReportDto>>(reports);
        }

        public async Task<IEnumerable<ReportDto>> GetReportsByPatientIdAsync(int patientId)
        {
            var reports = await _unitOfWork.Reports.GetAllAsync();
            var patientReports = reports.Where(r => r.PatientId == patientId);
            return _mapper.Map<IEnumerable<ReportDto>>(patientReports);
        }

        public async Task<IEnumerable<ReportDto>> GetReportsByDoctorIdAsync(int doctorId)
        {
            var reports = await _unitOfWork.Reports.GetAllAsync();
            var doctorReports = reports.Where(r => r.DoctorId == doctorId);
            return _mapper.Map<IEnumerable<ReportDto>>(doctorReports);
        }

        public async Task<ReportDto?> GetReportByIdAsync(int reportId)
        {
            var report = await _unitOfWork.Reports.GetByIdAsync(reportId);

            if (report == null)
                return null;

            return _mapper.Map<ReportDto>(report);
        }

        public async Task<ReportDto> CreateReportAsync(CreateReportDto createReportDto)
        {
            var patient = await _unitOfWork.Patients.GetByIdAsync(createReportDto.PatientId);
            if (patient == null)
                throw new Exception("Patient not found");

            var doctor = await _unitOfWork.Doctors.GetByIdAsync(createReportDto.DoctorId);
            if (doctor == null)
                throw new Exception("Doctor not found");

            var report = _mapper.Map<Report>(createReportDto);
            report.CreatedAt = DateTime.UtcNow;

            await _unitOfWork.Reports.AddAsync(report);
            await _unitOfWork.CompleteAsync();

            return _mapper.Map<ReportDto>(report);
        }

        public async Task<bool> DeleteReportAsync(int reportId)
        {
            var report = await _unitOfWork.Reports.GetByIdAsync(reportId);

            if (report == null)
                return false;

            _unitOfWork.Reports.Delete(report);
            await _unitOfWork.CompleteAsync();

            return true;
        }

        public async Task<bool> ReportExistsAsync(int reportId)
        {
            var report = await _unitOfWork.Reports.GetByIdAsync(reportId);
            return report != null;
        }
    }
}