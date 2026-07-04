using AutoMapper;
using Domain.Models;
using Shared.DTO.Report;

namespace Services.Mapping
{
    public class ReportMappingProfile : Profile
    {
        public ReportMappingProfile()
        {
            CreateMap<Report, ReportDto>()
                .ForMember(dest => dest.PatientName,
                    opt => opt.MapFrom(src => $"{src.Patient.FirstName} {src.Patient.LastName}"))
                .ForMember(dest => dest.DoctorName,
                    opt => opt.MapFrom(src => $"{src.Doctor.FirstName} {src.Doctor.LastName}"));

            CreateMap<CreateReportDto, Report>()
                .ForMember(dest => dest.ReportId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Patient, opt => opt.Ignore())
                .ForMember(dest => dest.Doctor, opt => opt.Ignore());
        }
    }
}