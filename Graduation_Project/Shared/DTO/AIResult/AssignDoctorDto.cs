using System.ComponentModel.DataAnnotations;

namespace Shared.DTO.AIResult
{
    public class AssignDoctorDto
    {
        [Required(ErrorMessage = "Result ID is required")]
        public int ResultId { get; set; }

        [Required(ErrorMessage = "Doctor ID is required")]
        public int DoctorId { get; set; }
    }
}
