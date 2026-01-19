using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.DTO.MedicalRecord
{
    public class CreateMedicalRecordDto
    {
        [Required(ErrorMessage = "Patient ID is required")]
        public int PatientId { get; set; }

        [MaxLength(1000)]
        public string? CurrentMedicine { get; set; }

        [MaxLength(1000)]
        public string? ChronicDisease { get; set; }

        [MaxLength(1000)]
        public string? PreviousSurgeries { get; set; }
    }
}
