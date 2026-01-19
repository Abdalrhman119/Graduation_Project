using AutoMapper;
using Domain.Models;
using Shared.DTO.MedicalRecord;

namespace Services.Mapping
{
    public class MedicalRecordMappingProfile : Profile
    {
        public MedicalRecordMappingProfile()
        {
            CreateMap<MedicalRecord, MedicalRecordDto>()
                .ForMember(dest => dest.PatientName,
                    opt => opt.MapFrom(src => $"{src.Patient.FirstName} {src.Patient.LastName}"));

            CreateMap<CreateMedicalRecordDto, MedicalRecord>()
                .ForMember(dest => dest.RecId, opt => opt.Ignore())
                .ForMember(dest => dest.Patient, opt => opt.Ignore());

            CreateMap<UpdateMedicalRecordDto, MedicalRecord>()
                .ForMember(dest => dest.PatientId, opt => opt.Ignore())
                .ForMember(dest => dest.Patient, opt => opt.Ignore())
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}