using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.DTO.Report
{
    public class CreateReportDto
    {
        [Required(ErrorMessage = "Patient ID is required")]
        public int PatientId { get; set; }

        [Required(ErrorMessage = "Doctor ID is required")]
        public int DoctorId { get; set; }

        [MaxLength(200)]
        public string? Diagnosis { get; set; }

        [MaxLength(2000)]
        public string? Notes { get; set; }

        [MaxLength(100)]
        public string? MedicationName { get; set; }

        [MaxLength(100)]
        public string? Dosage { get; set; }

        [Range(1, 10, ErrorMessage = "Frequency must be between 1 and 10 times per day")]
        public int? Frequency { get; set; }

        [MaxLength(100)]
        public string? Duration { get; set; }

        [MaxLength(500)]
        public string? Instructions { get; set; }
    }
}
