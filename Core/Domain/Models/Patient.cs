using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Domain.Models.Identity;

namespace Domain.Models
{
    public class Patient 
    {
        [Key]
        public int PatientId { get; set; }
       
        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        public DateOnly BirthDate { get; set; }
        public int Age { get; set; }

        [Required]
        [MaxLength(10)]
        public string Gender { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Phone]
        [MaxLength(20)]
        public string PhoneNum { get; set; } = string.Empty;

        [Range(0, 500)]
        public double Weight { get; set; }

        [Range(0, 300)]
        public double Height { get; set; }

        [MaxLength(5)]
        public string BloodType { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Allergies { get; set; } = string.Empty;

        [MaxLength(255)]
        public string ProfilePhoto { get; set; } = string.Empty;

        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [ForeignKey("UserId")]
        public ApplicationUser User { get; set; } = null!;
        public MedicalRecord MedicalRecord { get; set; } = null!;         // 1:1
        public ICollection<Report> Reports { get; set; } = null!;        // 1:M
        public ICollection<Chat> Chats { get; set; } = null!;            // M:M 
        public ICollection<AIResult> AIResults { get; set; } = null!;      // 1:M
    }
}
