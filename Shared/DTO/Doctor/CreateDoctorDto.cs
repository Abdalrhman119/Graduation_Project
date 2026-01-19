using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.DTO.Doctor
{
    public class CreateDoctorDto
    {
        [Required(ErrorMessage = "First name is required")]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Birth date is required")]
        public DateOnly BirthDate { get; set; }

        [Required(ErrorMessage = "Gender is required")]
        [RegularExpression("^(Male|Female)$", ErrorMessage = "Gender must be Male or Female")]
        public string Gender { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required")]
        [Phone(ErrorMessage = "Invalid phone number")]
        [MaxLength(20)]
        public string PhoneNum { get; set; } = string.Empty;

        [Range(0, 70, ErrorMessage = "Years of experience must be between 0 and 70")]
        public int YearsOfExperience { get; set; }

        [Required(ErrorMessage = "Licence number is required")]
        [MaxLength(50)]
        public string LicenceNum { get; set; } = string.Empty;

        public string? ProfilePhoto { get; set; }

        [MaxLength(1000)]
        public string? About { get; set; }

        [MaxLength(100)]
        public string? Specialization { get; set; }
    }
}
