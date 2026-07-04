using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.DTO.AIResult
{
    public class ReviewAIResultDto
    {
        [Required(ErrorMessage = "Result ID is required")]
        public int ResultId { get; set; }

        [Required(ErrorMessage = "Doctor ID is required")]
        public int DoctorId { get; set; }

        [Required(ErrorMessage = "Doctor notes are required")]
        [MaxLength(1000)]
        public string DoctorNotes { get; set; } = string.Empty;
    }
}
