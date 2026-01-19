using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.DTO.AIResult
{
    public class AIResultDto
    {
        public int ResultId { get; set; }
        public string ImagePath { get; set; } = string.Empty;
        public string DiseaseName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public string Recommendations { get; set; } = string.Empty;
        public DateTime AnalyzedAt { get; set; }
        public bool IsReviewedByDoctor { get; set; }
        public string DoctorNotes { get; set; } = string.Empty;
        public DateTime? ReviewedAt { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public int? DoctorId { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public int ModelId { get; set; }
        public string ModelName { get; set; } = string.Empty;
    }
}
