using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServicesAbstraction;
using Shared.DTO.Patient;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PatientsController : ControllerBase
    {
        private readonly IPatientService _patientService;

        public PatientsController(IPatientService patientService)
        {
            _patientService = patientService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllPatients()
        {
            var patients = await _patientService.GetAllPatientsAsync();
            return Ok(patients);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPatientById(int id)
        {
            var patient = await _patientService.GetPatientByIdAsync(id);
            if (patient == null)
                return NotFound($"Patient with ID {id} not found");

            return Ok(patient);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetPatientByUserId(string userId)
        {
            var patient = await _patientService.GetPatientByUserIdAsync(userId);
            if (patient == null)
                return NotFound($"Patient with User ID {userId} not found");

            return Ok(patient);
        }

        [HttpPut]
        public async Task<IActionResult> UpdatePatient([FromBody] UpdatePatientDto updatePatientDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var patient = await _patientService.UpdatePatientAsync(updatePatientDto);
            if (patient == null)
                return NotFound($"Patient with ID {updatePatientDto.PatientId} not found");

            return Ok(patient);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePatient(int id)
        {
            var deleted = await _patientService.DeletePatientAsync(id);
            if (!deleted)
                return NotFound($"Patient with ID {id} not found");

            return Ok(new { message = "Patient deleted successfully" });
        }
    }
}