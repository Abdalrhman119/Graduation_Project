using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.DTO.MedicalRecord
{
    public class UpdateMedicalRecordDto
    {
        [Required]
        public int RecId { get; set; }

        [MaxLength(1000)]
        public string? CurrentMedicine { get; set; }

        [MaxLength(1000)]
        public string? ChronicDisease { get; set; }

        [MaxLength(1000)]
        public string? PreviousSurgeries { get; set; }
    }
}
