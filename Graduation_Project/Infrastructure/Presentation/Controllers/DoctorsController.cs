using Microsoft.AspNetCore.Mvc;
using ServicesAbstraction;
using Shared.DTO.Doctor;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DoctorsController : ControllerBase
    {
        private readonly IDoctorService _doctorService;

        public DoctorsController(IDoctorService doctorService)
        {
            _doctorService = doctorService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllDoctors()
        {
            var doctors = await _doctorService.GetAllDoctorsAsync();
            return Ok(doctors);
        }

        [HttpGet("available")]
        public async Task<IActionResult> GetAvailableDoctors()
        {
            var doctors = await _doctorService.GetAvailableDoctorsAsync();
            return Ok(doctors);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDoctorById(int id)
        {
            var doctor = await _doctorService.GetDoctorByIdAsync(id);
            if (doctor == null)
                return NotFound($"Doctor with ID {id} not found");

            return Ok(doctor);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetDoctorByUserId(string userId)
        {
            var doctor = await _doctorService.GetDoctorByUserIdAsync(userId);
            if (doctor == null)
                return NotFound($"Doctor with User ID {userId} not found");

            return Ok(doctor);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateDoctor([FromBody] UpdateDoctorDto updateDoctorDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var doctor = await _doctorService.UpdateDoctorAsync(updateDoctorDto);
            if (doctor == null)
                return NotFound($"Doctor with ID {updateDoctorDto.DoctorId} not found");

            return Ok(doctor);
        }

        [HttpPatch("{id}/availability")]
        public async Task<IActionResult> UpdateAvailability(int id, [FromBody] bool isAvailable)
        {
            var updated = await _doctorService.UpdateAvailabilityAsync(id, isAvailable);
            if (!updated)
                return NotFound($"Doctor with ID {id} not found");

            return Ok(new { message = "Availability updated successfully" });
        }

        [HttpPatch("{id}/rating")]
        public async Task<IActionResult> UpdateRating(int id, [FromBody] double rating)
        {
            try
            {
                var updated = await _doctorService.UpdateRatingAsync(id, rating);
                if (!updated)
                    return NotFound($"Doctor with ID {id} not found");

                return Ok(new { message = "Rating updated successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDoctor(int id)
        {
            var deleted = await _doctorService.DeleteDoctorAsync(id);
            if (!deleted)
                return NotFound($"Doctor with ID {id} not found");

            return Ok(new { message = "Doctor deleted successfully" });
        }
    }
}