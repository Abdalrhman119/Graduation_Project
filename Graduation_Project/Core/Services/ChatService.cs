using AutoMapper;
using Domain.Contracts;
using Domain.Models;
using ServicesAbstraction;
using Shared.DTO.Chat;

namespace Services
{
    public class ChatService : IChatService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ChatService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<IEnumerable<ChatDto>> GetAllChatsAsync()
        {
            var chats = await _unitOfWork.Chats.GetAllAsync();
            return _mapper.Map<IEnumerable<ChatDto>>(chats);
        }

        public async Task<IEnumerable<ChatDto>> GetChatsByPatientIdAsync(int patientId)
        {
            var chats = await _unitOfWork.Chats.GetAllAsync();
            var patientChats = chats.Where(c => c.PatientId == patientId);
            return _mapper.Map<IEnumerable<ChatDto>>(patientChats);
        }

        public async Task<IEnumerable<ChatDto>> GetChatsByDoctorIdAsync(int doctorId)
        {
            var chats = await _unitOfWork.Chats.GetAllAsync();
            var doctorChats = chats.Where(c => c.DoctorId == doctorId);
            return _mapper.Map<IEnumerable<ChatDto>>(doctorChats);
        }

        public async Task<ChatDto?> GetChatByIdAsync(int chatId)
        {
            var chat = await _unitOfWork.Chats.GetByIdAsync(chatId);

            if (chat == null)
                return null;

            return _mapper.Map<ChatDto>(chat);
        }

        public async Task<ChatDto?> GetChatByPatientAndDoctorAsync(int patientId, int doctorId)
        {
            var chats = await _unitOfWork.Chats.GetAllAsync();
            var chat = chats.FirstOrDefault(c => c.PatientId == patientId && c.DoctorId == doctorId);

            if (chat == null)
                return null;

            return _mapper.Map<ChatDto>(chat);
        }

        public async Task<ChatDto> CreateChatAsync(CreateChatDto createChatDto)
        {
            var patient = await _unitOfWork.Patients.GetByIdAsync(createChatDto.PatientId);
            if (patient == null)
                throw new Exception("Patient not found");

            var doctor = await _unitOfWork.Doctors.GetByIdAsync(createChatDto.DoctorId);
            if (doctor == null)
                throw new Exception("Doctor not found");

            if (await ChatExistsBetweenAsync(createChatDto.PatientId, createChatDto.DoctorId))
                throw new Exception("Chat already exists between this patient and doctor");

            var chat = _mapper.Map<Chat>(createChatDto);

            await _unitOfWork.Chats.AddAsync(chat);
            await _unitOfWork.CompleteAsync();

            return _mapper.Map<ChatDto>(chat);
        }

        public async Task<bool> DeleteChatAsync(int chatId)
        {
            var chat = await _unitOfWork.Chats.GetByIdAsync(chatId);

            if (chat == null)
                return false;

            _unitOfWork.Chats.Delete(chat);
            await _unitOfWork.CompleteAsync();

            return true;
        }

        public async Task<bool> ChatExistsAsync(int chatId)
        {
            var chat = await _unitOfWork.Chats.GetByIdAsync(chatId);
            return chat != null;
        }

        public async Task<bool> ChatExistsBetweenAsync(int patientId, int doctorId)
        {
            var chats = await _unitOfWork.Chats.GetAllAsync();
            return chats.Any(c => c.PatientId == patientId && c.DoctorId == doctorId);
        }
    }
}