using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.DTO.Chat
{
    public class ChatDto
    {
        public int ChatId { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public int DoctorId { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public DateTime? LastMessageAt { get; set; }
        public string LastMessage { get; set; } = string.Empty;
    }
}
