using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class Message
    {
        [Key]
        public int MessageId { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Content { get; set; } = string.Empty;

        [Required]
        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        public bool IsRead { get; set; } = false;

        public int ChatId { get; set; }
        [ForeignKey("ChatId")]
        public Chat Chat { get; set; } = null!;

        
        [Required]
        public string SenderId { get; set; } = string.Empty; 

        [Required]
        [MaxLength(20)]
        public string SenderType { get; set; } = string.Empty; 
    }
}