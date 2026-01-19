using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.DTO.Doctor
{
    public class UpdateDoctorDto
    {
        [Required]
        public int DoctorId { get; set; }

        [MaxLength(50)]
        public string? FirstName { get; set; }

        [MaxLength(50)]
        public string? LastName { get; set; }

        public DateOnly? BirthDate { get; set; }

        [RegularExpression("^(Male|Female)$", ErrorMessage = "Gender must be Male or Female")]
        public string? Gender { get; set; }

        [EmailAddress(ErrorMessage = "Invalid email format")]
        [MaxLength(100)]
        public string? Email { get; set; }

        [Phone(ErrorMessage = "Invalid phone number")]
        [MaxLength(20)]
        public string? PhoneNum { get; set; }

        [Range(0, 70, ErrorMessage = "Years of experience must be between 0 and 70")]
        public int? YearsOfExperience { get; set; }

        public string? ProfilePhoto { get; set; }

        [MaxLength(1000)]
        public string? About { get; set; }

        [MaxLength(100)]
        public string? Specialization { get; set; }

        public bool? IsAvailable { get; set; }
    }
}
