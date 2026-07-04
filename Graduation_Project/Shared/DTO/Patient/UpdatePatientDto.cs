using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.DTO.Patient
{
    public class UpdatePatientDto
    {
        [Required]
        public int PatientId { get; set; }

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

        [Range(0, 500, ErrorMessage = "Weight must be between 0 and 500 kg")]
        public double Weight { get; set; }

        [Range(0, 300, ErrorMessage = "Height must be between 0 and 300 cm")]
        public double Height { get; set; }

        [MaxLength(5)]
        public string? BloodType { get; set; }

        [MaxLength(500)]
        public string? Allergies { get; set; }

        public string? ProfilePhoto { get; set; }

        public string? ChronicDiseases { get; set; }
        public string? DietType { get; set; }
        public string? FamilyHistory { get; set; }
        public string? PastSurgeries { get; set; }
        public bool? IsSmoker { get; set; }
    }
}