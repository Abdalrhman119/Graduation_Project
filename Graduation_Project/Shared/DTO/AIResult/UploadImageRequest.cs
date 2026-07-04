using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Shared.DTO.AIResult
{
    public class UploadImageRequest
    {
        [Required(ErrorMessage = "Patient ID is required")]
        public int PatientId { get; set; }

        [Required(ErrorMessage = "Image file is required")]
        public IFormFile Image { get; set; } = null!;
    }
}