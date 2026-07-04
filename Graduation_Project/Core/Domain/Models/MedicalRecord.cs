using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Models
{
    public class MedicalRecord
    {
        [Key]
        public int RecId { get; set; }

        [MaxLength(1000)]
        public string CurrentMedicine { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string ChronicDisease { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string PreviousSurgeries { get; set; } = string.Empty;


        //fk
        [Required]
        public int PatientId { get; set; }
        [ForeignKey("PatientId")]
        public Patient Patient { get; set; } = null!;
    }
}
