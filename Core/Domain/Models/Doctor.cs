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
    public class Doctor
    {
        [Key]
        public int DoctorId { get; set; }
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
        [Range(0, 70)]
        public int YearsOfExperience { get; set; }
       
        [Range(0, 5)]
        public double Rating { get; set; }

        [Required]
        [MaxLength(50)]
        public string LicenceNum { get; set; } = string.Empty;

        [MaxLength(255)]
        public string ProfilePhoto { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string About { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Specialization { get; set; } = string.Empty;
        public bool IsAvailable { get; set; } = true;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        [ForeignKey("UserId")]
        public ApplicationUser User { get; set; } = null!;
        public ICollection<Report> CreatedReports { get; set; } = null!;    // 1:M
        public ICollection<Chat> Chats { get; set; } = null!;               // M:M 
        public ICollection<AIResult> ReviewedAIResults { get; set; } = null!; // 1:M
    }
}
