using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
namespace Shared.DTO.AIResult
{
    public class UploadImageDto
    {
        [Required(ErrorMessage = "Patient ID is required")]
        public int PatientId { get; set; }

        [Required(ErrorMessage = "Image file is required")]
        public IFormFile Image { get; set; } = null!;

        // هنا هنحط البيانات اللي هترجع من الـ AI Model لما يبقى جاهز
        // دلوقتي الـ API هتخزن الصورة وتحط Placeholder Data
    }
}
