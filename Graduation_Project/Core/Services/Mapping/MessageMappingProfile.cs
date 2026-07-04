using AutoMapper;
using Domain.Models;
using Shared.DTO.Message;

namespace Services.Mapping
{
    public class MessageMappingProfile : Profile
    {
        public MessageMappingProfile()
        {
            CreateMap<Message, MessageDto>()
                .ForMember(dest => dest.SenderName, opt => opt.Ignore()); 

            CreateMap<SendMessageDto, Message>()
                .ForMember(dest => dest.MessageId, opt => opt.Ignore())
                .ForMember(dest => dest.SentAt, opt => opt.Ignore())
                .ForMember(dest => dest.IsRead, opt => opt.Ignore())
                .ForMember(dest => dest.Chat, opt => opt.Ignore());
        }
    }
}