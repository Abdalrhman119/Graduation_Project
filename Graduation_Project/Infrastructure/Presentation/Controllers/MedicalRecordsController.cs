using Microsoft.AspNetCore.Mvc;
using ServicesAbstraction;
using Shared.DTO.MedicalRecord;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MedicalRecordsController : ControllerBase
    {
        private readonly IMedicalRecordService _medicalRecordService;

        public MedicalRecordsController(IMedicalRecordService medicalRecordService)
        {
            _medicalRecordService = medicalRecordService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetMedicalRecordById(int id)
        {
            var record = await _medicalRecordService.GetMedicalRecordByIdAsync(id);
            if (record == null)
                return NotFound($"Medical record with ID {id} not found");

            return Ok(record);
        }

        [HttpGet("patient/{patientId}")]
        public async Task<IActionResult> GetMedicalRecordByPatientId(int patientId)
        {
            var record = await _medicalRecordService.GetMedicalRecordByPatientIdAsync(patientId);
            if (record == null)
                return NotFound($"Medical record for patient ID {patientId} not found");

            return Ok(record);
        }

        [HttpPost]
        public async Task<IActionResult> CreateMedicalRecord([FromBody] CreateMedicalRecordDto createDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var record = await _medicalRecordService.CreateMedicalRecordAsync(createDto);
                return CreatedAtAction(nameof(GetMedicalRecordById), new { id = record.RecId }, record);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateMedicalRecord([FromBody] UpdateMedicalRecordDto updateDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var record = await _medicalRecordService.UpdateMedicalRecordAsync(updateDto);
            if (record == null)
                return NotFound($"Medical record with ID {updateDto.RecId} not found");

            return Ok(record);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMedicalRecord(int id)
        {
            var deleted = await _medicalRecordService.DeleteMedicalRecordAsync(id);
            if (!deleted)
                return NotFound($"Medical record with ID {id} not found");

            return Ok(new { message = "Medical record deleted successfully" });
        }
    }
}