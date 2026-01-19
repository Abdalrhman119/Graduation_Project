using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.DTO.Message
{
    public class SendMessageDto
    {
        [Required(ErrorMessage = "Chat ID is required")]
        public int ChatId { get; set; }

        [Required(ErrorMessage = "Message content is required")]
        [MaxLength(2000)]
        public string Content { get; set; } = string.Empty;

        [Required(ErrorMessage = "Sender ID is required")]
        public string SenderId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Sender type is required")]
        [RegularExpression("^(Patient|Doctor)$", ErrorMessage = "Sender type must be Patient or Doctor")]
        public string SenderType { get; set; } = string.Empty;
    }
}
