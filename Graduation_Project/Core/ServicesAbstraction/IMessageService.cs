using Shared.DTO.Message;

namespace ServicesAbstraction
{
    public interface IMessageService
    {
        Task<IEnumerable<MessageDto>> GetMessagesByChatIdAsync(int chatId);
        Task<MessageDto?> GetMessageByIdAsync(int messageId);
        Task<MessageDto> SendMessageAsync(SendMessageDto sendMessageDto);
        Task<bool> MarkMessageAsReadAsync(int messageId);
        Task<bool> DeleteMessageAsync(int messageId);
        Task<int> GetUnreadMessageCountAsync(int chatId, string userId, string? senderType = null);
    }
}