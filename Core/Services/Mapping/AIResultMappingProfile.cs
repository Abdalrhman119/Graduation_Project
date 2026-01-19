using AutoMapper;
using Domain.Models;
using Shared.DTO.AIResult;

namespace Services.Mapping
{
    public class AIResultMappingProfile : Profile
    {
        public AIResultMappingProfile()
        {
            CreateMap<AIResult, AIResultDto>()
                .ForMember(dest => dest.PatientName,
                    opt => opt.MapFrom(src => $"{src.Patient.FirstName} {src.Patient.LastName}"))
                .ForMember(dest => dest.DoctorName,
                    opt => opt.MapFrom(src => src.Doctor != null ? $"{src.Doctor.FirstName} {src.Doctor.LastName}" : ""))
                .ForMember(dest => dest.ModelName,
                    opt => opt.MapFrom(src => src.AIModel.ModelName));

            CreateMap<ReviewAIResultDto, AIResult>()
                .ForMember(dest => dest.IsReviewedByDoctor, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.ReviewedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}