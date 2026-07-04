using Microsoft.AspNetCore.Mvc;
using ServicesAbstraction;
using Shared.DTO.Report;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllReports()
        {
            var reports = await _reportService.GetAllReportsAsync();
            return Ok(reports);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetReportById(int id)
        {
            var report = await _reportService.GetReportByIdAsync(id);
            if (report == null)
                return NotFound($"Report with ID {id} not found");

            return Ok(report);
        }

        [HttpGet("patient/{patientId}")]
        public async Task<IActionResult> GetReportsByPatientId(int patientId)
        {
            var reports = await _reportService.GetReportsByPatientIdAsync(patientId);
            return Ok(reports);
        }

        [HttpGet("doctor/{doctorId}")]
        public async Task<IActionResult> GetReportsByDoctorId(int doctorId)
        {
            var reports = await _reportService.GetReportsByDoctorIdAsync(doctorId);
            return Ok(reports);
        }

        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportDto createDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var report = await _reportService.CreateReportAsync(createDto);
                return CreatedAtAction(nameof(GetReportById), new { id = report.ReportId }, report);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReport(int id)
        {
            var deleted = await _reportService.DeleteReportAsync(id);
            if (!deleted)
                return NotFound($"Report with ID {id} not found");

            return Ok(new { message = "Report deleted successfully" });
        }
    }
}