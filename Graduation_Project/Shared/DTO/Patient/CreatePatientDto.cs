using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.DTO.Patient
{
    public class CreatePatientDto
    {
        [Required(ErrorMessage = "First name is required")]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;
        [Required(ErrorMessage = "Last name is required")]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;
       
        [Required(ErrorMessage = "Birth date is required")]
        public DateOnly BirthDate { get; set; }
        public int Age { get; set; }

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

        [Range(0, 500, ErrorMessage = "Weight must be between 0 and 500 kg")]
        public double Weight { get; set; }

        [Range(0, 300, ErrorMessage = "Height must be between 0 and 300 cm")]
        public double Height { get; set; }
        
        [MaxLength(5)]
        public string BloodType { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string Allergies { get; set; } = string.Empty;
        public string ProfilePhoto { get; set; } = string.Empty;
    }
}