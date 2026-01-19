using AutoMapper;
using Domain.Models;
using Shared.DTO.Chat;

namespace Services.Mapping
{
    public class ChatMappingProfile : Profile
    {
        public ChatMappingProfile()
        {
            _ = CreateMap<Chat, ChatDto>()
                .ForMember(dest => dest.PatientName,
                    opt => opt.MapFrom(src => $"{src.Patient.FirstName} {src.Patient.LastName}"))
                .ForMember(dest => dest.DoctorName,
                    opt => opt.MapFrom(src => $"{src.Doctor.FirstName} {src.Doctor.LastName}"))
                .ForMember(dest => dest.LastMessage,
                    opt => opt.MapFrom(src => src.Messages.OrderByDescending(m => m.SentAt).FirstOrDefault().Content ?? ""))
                .ForMember(dest => dest.LastMessageAt,
                    opt => opt.MapFrom(src => src.Messages.OrderByDescending(m => m.SentAt).FirstOrDefault().SentAt));

            CreateMap<CreateChatDto, Chat>()
                .ForMember(dest => dest.ChatId, opt => opt.Ignore())
                .ForMember(dest => dest.Patient, opt => opt.Ignore())
                .ForMember(dest => dest.Doctor, opt => opt.Ignore())
                .ForMember(dest => dest.Messages, opt => opt.Ignore());
        }
    }
}