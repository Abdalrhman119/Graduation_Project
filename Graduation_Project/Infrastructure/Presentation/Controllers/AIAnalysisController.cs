using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ServicesAbstraction;
using Shared.DTO.AIResult;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AIAnalysisController : ControllerBase
    {
        private readonly IAIResultService _aiResultService;

        public AIAnalysisController(IAIResultService aiResultService)
        {
            _aiResultService = aiResultService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllResults()
        {
            var results = await _aiResultService.GetAllResultsAsync();
            return Ok(results);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetResultById(int id)
        {
            var result = await _aiResultService.GetResultByIdAsync(id);
            if (result == null)
                return NotFound($"Result with ID {id} not found");

            return Ok(result);
        }

        [HttpGet("patient/{patientId}")]
        public async Task<IActionResult> GetResultsByPatientId(int patientId)
        {
            var results = await _aiResultService.GetResultsByPatientIdAsync(patientId);
            return Ok(results);
        }

        [HttpGet("doctor/{doctorId}")]
        public async Task<IActionResult> GetResultsByDoctorId(int doctorId)
        {
            var results = await _aiResultService.GetResultsByDoctorIdAsync(doctorId);
            return Ok(results);
        }

        [HttpGet("unreviewed")]
        public async Task<IActionResult> GetUnreviewedResults()
        {
            var results = await _aiResultService.GetUnreviewedResultsAsync();
            return Ok(results);
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadImage([FromForm] UploadImageRequest request)
        {
            if (request.Image == null || request.Image.Length == 0)
                return BadRequest("Image file is required");

            try
            {
                var result = await _aiResultService.UploadAndAnalyzeImageAsync(request.PatientId, request.Image);
                return CreatedAtAction(nameof(GetResultById), new { id = result.ResultId }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("analyze-direct")]
        public async Task<IActionResult> AnalyzeDirect(IFormFile image)
        {
            if (image == null || image.Length == 0)
                return BadRequest("Image file is required");

            try
            {
                var result = await _aiResultService.AnalyzeImageDirectlyAsync(image);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("assign")]
        public async Task<IActionResult> AssignDoctor([FromBody] AssignDoctorDto assignDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var result = await _aiResultService.AssignDoctorAsync(assignDto);
                if (result == null)
                    return NotFound($"Result with ID {assignDto.ResultId} not found");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("review")]
        public async Task<IActionResult> ReviewResult([FromBody] ReviewAIResultDto reviewDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var result = await _aiResultService.ReviewResultAsync(reviewDto);
                if (result == null)
                    return NotFound($"Result with ID {reviewDto.ResultId} not found");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteResult(int id)
        {
            var deleted = await _aiResultService.DeleteResultAsync(id);
            if (!deleted)
                return NotFound($"Result with ID {id} not found");

            return Ok(new { message = "Result deleted successfully" });
        }
    }
}