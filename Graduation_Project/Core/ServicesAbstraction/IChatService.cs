using Shared.DTO.Chat;

namespace ServicesAbstraction
{
    public interface IChatService
    {
        Task<IEnumerable<ChatDto>> GetAllChatsAsync();
        Task<IEnumerable<ChatDto>> GetChatsByPatientIdAsync(int patientId);
        Task<IEnumerable<ChatDto>> GetChatsByDoctorIdAsync(int doctorId);
        Task<ChatDto?> GetChatByIdAsync(int chatId);
        Task<ChatDto?> GetChatByPatientAndDoctorAsync(int patientId, int doctorId);
        Task<ChatDto> CreateChatAsync(CreateChatDto createChatDto);
        Task<bool> DeleteChatAsync(int chatId);
        Task<bool> ChatExistsAsync(int chatId);
        Task<bool> ChatExistsBetweenAsync(int patientId, int doctorId);
    }
}