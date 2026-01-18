using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Models
{
    public class AIResult
    {
        [Key]
        public int ResultId { get; set; }

        [Required]
        [MaxLength(255)]
        public string ImagePath { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string DiseaseName { get; set; } = string.Empty; 

        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        [Range(0, 100)]
        public double Confidence { get; set; } 

        [MaxLength(1000)]
        public string Recommendations { get; set; } = string.Empty;

        public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;

        public bool IsReviewedByDoctor { get; set; } = false;

        [MaxLength(1000)]
        public string DoctorNotes { get; set; } = string.Empty;

        public DateTime? ReviewedAt { get; set; }
        //fk
        [Required]
        public int PatientId { get; set; }
        [ForeignKey("PatientId")]
        public Patient Patient { get; set; } = null!;
        public int? DoctorId { get; set; }
        [ForeignKey("DoctorId")]
        public Doctor? Doctor { get; set; }

        [Required]
        public int ModelId { get; set; }
        [ForeignKey("ModelId")]
        public AIModel AIModel { get; set; } = null!;
    }
}
