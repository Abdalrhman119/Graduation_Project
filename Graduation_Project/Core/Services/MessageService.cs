using AutoMapper;
using Domain.Contracts;
using Domain.Models;
using ServicesAbstraction;
using Shared.DTO.Message;

namespace Services
{
    public class MessageService : IMessageService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public MessageService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<IEnumerable<MessageDto>> GetMessagesByChatIdAsync(int chatId)
        {
            var messages = await _unitOfWork.Messages.GetAllAsync();
            var chatMessages = messages.Where(m => m.ChatId == chatId).OrderBy(m => m.SentAt);

            var messageDtos = new List<MessageDto>();
            foreach (var message in chatMessages)
            {
                var messageDto = _mapper.Map<MessageDto>(message);

                // Set sender name based on sender type
                if (message.SenderType == "Patient")
                {
                    if (int.TryParse(message.SenderId, out int pId))
                    {
                        var patient = await _unitOfWork.Patients.GetByIdAsync(pId);
                        messageDto.SenderName = patient != null ? $"{patient.FirstName} {patient.LastName}" : "Unknown";
                    }
                }
                else if (message.SenderType == "Doctor")
                {
                    if (int.TryParse(message.SenderId, out int dId))
                    {
                        var doctor = await _unitOfWork.Doctors.GetByIdAsync(dId);
                        messageDto.SenderName = doctor != null ? $"{doctor.FirstName} {doctor.LastName}" : "Unknown";
                    }
                }

                messageDtos.Add(messageDto);
            }

            return messageDtos;
        }

        public async Task<MessageDto?> GetMessageByIdAsync(int messageId)
        {
            var message = await _unitOfWork.Messages.GetByIdAsync(messageId);

            if (message == null)
                return null;

            var messageDto = _mapper.Map<MessageDto>(message);

            // Set sender name
            if (message.SenderType == "Patient")
            {
                if (int.TryParse(message.SenderId, out int pId))
                {
                    var patient = await _unitOfWork.Patients.GetByIdAsync(pId);
                    messageDto.SenderName = patient != null ? $"{patient.FirstName} {patient.LastName}" : "Unknown";
                }
            }
            else if (message.SenderType == "Doctor")
            {
                if (int.TryParse(message.SenderId, out int dId))
                {
                    var doctor = await _unitOfWork.Doctors.GetByIdAsync(dId);
                    messageDto.SenderName = doctor != null ? $"{doctor.FirstName} {doctor.LastName}" : "Unknown";
                }
            }

            return messageDto;
        }

        public async Task<MessageDto> SendMessageAsync(SendMessageDto sendMessageDto)
        {
            // Validate chat exists
            var chat = await _unitOfWork.Chats.GetByIdAsync(sendMessageDto.ChatId);
            if (chat == null)
                throw new Exception("Chat not found");

            // Validate sender exists
            if (sendMessageDto.SenderType == "Patient")
            {
                if (int.TryParse(sendMessageDto.SenderId, out int pId))
                {
                    var patient = await _unitOfWork.Patients.GetByIdAsync(pId);
                    if (patient == null)
                        throw new Exception("Patient not found");
                }
                else throw new Exception("Invalid Patient ID");
            }
            else if (sendMessageDto.SenderType == "Doctor")
            {
                if (int.TryParse(sendMessageDto.SenderId, out int dId))
                {
                    var doctor = await _unitOfWork.Doctors.GetByIdAsync(dId);
                    if (doctor == null)
                        throw new Exception("Doctor not found");
                }
                else throw new Exception("Invalid Doctor ID");
            }

            // Map DTO to Entity
            var message = _mapper.Map<Message>(sendMessageDto);
            message.SentAt = DateTime.UtcNow;
            message.IsRead = false;

            // Add to database
            await _unitOfWork.Messages.AddAsync(message);
            await _unitOfWork.CompleteAsync();

            // Return with sender name
            var messageDto = await GetMessageByIdAsync(message.MessageId);
            return messageDto!;
        }

        public async Task<bool> MarkMessageAsReadAsync(int messageId)
        {
            var message = await _unitOfWork.Messages.GetByIdAsync(messageId);

            if (message == null)
                return false;

            message.IsRead = true;
            _unitOfWork.Messages.Update(message);
            await _unitOfWork.CompleteAsync();

            return true;
        }

        public async Task<bool> DeleteMessageAsync(int messageId)
        {
            var message = await _unitOfWork.Messages.GetByIdAsync(messageId);

            if (message == null)
                return false;

            _unitOfWork.Messages.Delete(message);
            await _unitOfWork.CompleteAsync();

            return true;
        }

        public async Task<int> GetUnreadMessageCountAsync(int chatId, string userId, string? senderType = null)
        {
            var messages = await _unitOfWork.Messages.GetAllAsync();
            if (string.IsNullOrEmpty(senderType))
            {
                return messages.Count(m => m.ChatId == chatId && m.SenderId != userId && !m.IsRead);
            }
            return messages.Count(m => m.ChatId == chatId && !(m.SenderId == userId && m.SenderType == senderType) && !m.IsRead);
        }
    }
}