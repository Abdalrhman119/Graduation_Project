using Microsoft.AspNetCore.Mvc;
using ServicesAbstraction;
using Shared.DTO.Chat;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatsController : ControllerBase
    {
        private readonly IChatService _chatService;

        public ChatsController(IChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllChats()
        {
            var chats = await _chatService.GetAllChatsAsync();
            return Ok(chats);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetChatById(int id)
        {
            var chat = await _chatService.GetChatByIdAsync(id);
            if (chat == null)
                return NotFound($"Chat with ID {id} not found");

            return Ok(chat);
        }

        [HttpGet("patient/{patientId}")]
        public async Task<IActionResult> GetChatsByPatientId(int patientId)
        {
            var chats = await _chatService.GetChatsByPatientIdAsync(patientId);
            return Ok(chats);
        }

        [HttpGet("doctor/{doctorId}")]
        public async Task<IActionResult> GetChatsByDoctorId(int doctorId)
        {
            var chats = await _chatService.GetChatsByDoctorIdAsync(doctorId);
            return Ok(chats);
        }

        [HttpPost]
        public async Task<IActionResult> CreateChat([FromBody] CreateChatDto createDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var chat = await _chatService.CreateChatAsync(createDto);
                return CreatedAtAction(nameof(GetChatById), new { id = chat.ChatId }, chat);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteChat(int id)
        {
            var deleted = await _chatService.DeleteChatAsync(id);
            if (!deleted)
                return NotFound($"Chat with ID {id} not found");

            return Ok(new { message = "Chat deleted successfully" });
        }
    }
}