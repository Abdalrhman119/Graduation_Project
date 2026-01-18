using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Models
{
    public class Report
    {
        [Key]
        public int ReportId { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(200)]
        public string Diagnosis { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Notes { get; set; } = string.Empty;

        [MaxLength(100)]
        public string MedicationName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Dosage { get; set; } = string.Empty;

        public int? Frequency { get; set; }

        [MaxLength(100)]
        public string Duration { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Instructions { get; set; } = string.Empty;

        //fk
        [Required]
        public int PatientId { get; set; }
        [ForeignKey("PatientId")]
        public Patient Patient { get; set; } = null!;

        
        [Required]
        public int DoctorId { get; set; }
        [ForeignKey("DoctorId")]
        public Doctor Doctor { get; set; } = null!;
    }
    }
