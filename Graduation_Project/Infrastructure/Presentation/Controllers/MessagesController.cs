using Microsoft.AspNetCore.Mvc;
using ServicesAbstraction;
using Shared.DTO.Message;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _messageService;

        public MessagesController(IMessageService messageService)
        {
            _messageService = messageService;
        }

        [HttpGet("chat/{chatId}")]
        public async Task<IActionResult> GetMessagesByChatId(int chatId)
        {
            var messages = await _messageService.GetMessagesByChatIdAsync(chatId);
            return Ok(messages);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetMessageById(int id)
        {
            var message = await _messageService.GetMessageByIdAsync(id);
            if (message == null)
                return NotFound($"Message with ID {id} not found");

            return Ok(message);
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto sendDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var message = await _messageService.SendMessageAsync(sendDto);
                return CreatedAtAction(nameof(GetMessageById), new { id = message.MessageId }, message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var updated = await _messageService.MarkMessageAsReadAsync(id);
            if (!updated)
                return NotFound($"Message with ID {id} not found");

            return Ok(new { message = "Message marked as read" });
        }

        [HttpGet("chat/{chatId}/unread/{userId}")]
        public async Task<IActionResult> GetUnreadMessageCount(int chatId, string userId, [FromQuery] string? senderType = null)
        {
            var count = await _messageService.GetUnreadMessageCountAsync(chatId, userId, senderType);
            return Ok(new { unreadCount = count });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMessage(int id)
        {
            var deleted = await _messageService.DeleteMessageAsync(id);
            if (!deleted)
                return NotFound($"Message with ID {id} not found");

            return Ok(new { message = "Message deleted successfully" });
        }
    }
}