using AutoMapper;
using Domain.Contracts;
using Domain.Models;
using Microsoft.AspNetCore.Http;
using ServicesAbstraction;
using Shared.DTO.AIResult;
using System.Text.Json;
using System.Net.Http.Headers;

namespace Services
{
    public class AIResultService : IAIResultService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IHttpClientFactory _httpClientFactory;

        public AIResultService(IUnitOfWork unitOfWork, IMapper mapper, IHttpClientFactory httpClientFactory)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<IEnumerable<AIResultDto>> GetAllResultsAsync()
        {
            var results = await _unitOfWork.AIResults.GetAllWithIncludesAsync(r => r.Patient, r => r.Doctor, r => r.AIModel);
            return _mapper.Map<IEnumerable<AIResultDto>>(results);
        }

        public async Task<IEnumerable<AIResultDto>> GetResultsByPatientIdAsync(int patientId)
        {
            var results = await _unitOfWork.AIResults.GetAllWithIncludesAsync(r => r.Patient, r => r.Doctor, r => r.AIModel);
            var patientResults = results.Where(r => r.PatientId == patientId).OrderByDescending(r => r.AnalyzedAt);
            return _mapper.Map<IEnumerable<AIResultDto>>(patientResults);
        }

        public async Task<IEnumerable<AIResultDto>> GetResultsByDoctorIdAsync(int doctorId)
        {
            var results = await _unitOfWork.AIResults.GetAllWithIncludesAsync(r => r.Patient, r => r.Doctor, r => r.AIModel);
            var doctorResults = results.Where(r => r.DoctorId == doctorId).OrderByDescending(r => r.AnalyzedAt);
            return _mapper.Map<IEnumerable<AIResultDto>>(doctorResults);
        }

        public async Task<IEnumerable<AIResultDto>> GetUnreviewedResultsAsync()
        {
            var results = await _unitOfWork.AIResults.GetAllWithIncludesAsync(r => r.Patient, r => r.Doctor, r => r.AIModel);
            var unreviewedResults = results.Where(r => !r.IsReviewedByDoctor).OrderBy(r => r.AnalyzedAt);
            return _mapper.Map<IEnumerable<AIResultDto>>(unreviewedResults);
        }

        public async Task<AIResultDto?> GetResultByIdAsync(int resultId)
        {
            var results = await _unitOfWork.AIResults.GetAllWithIncludesAsync(r => r.Patient, r => r.Doctor, r => r.AIModel);
            var result = results.FirstOrDefault(r => r.ResultId == resultId);

            if (result == null)
                return null;

            return _mapper.Map<AIResultDto>(result);
        }

        public async Task<AIResultDto> UploadAndAnalyzeImageAsync(int patientId, IFormFile image)
        {
            // Validate patient exists
            var patient = await _unitOfWork.Patients.GetByIdAsync(patientId);
            if (patient == null)
                throw new Exception("Patient not found");

            // Validate image
            if (image == null || image.Length == 0)
                throw new Exception("Invalid image file");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var extension = Path.GetExtension(image.FileName).ToLower();
            if (!allowedExtensions.Contains(extension))
                throw new Exception("Only JPG, JPEG, and PNG files are allowed");

            // Save image to wwwroot/uploads
            var uploadsFolder = Path.Combine("wwwroot", "uploads", "ai-images");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await image.CopyToAsync(stream);
            }

            var imageUrl = $"/uploads/ai-images/{uniqueFileName}";

            // Call Python AI Model
            string diseaseName = "Pending Analysis";
            double confidence = 0;
            string description = "Image uploaded successfully. AI analysis failed.";
            
            try
            {
                var httpClient = _httpClientFactory.CreateClient();
                using var request = new MultipartFormDataContent();
                
                using var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
                var streamContent = new StreamContent(fileStream);
                
                // Get the MIME type based on extension
                string contentType = extension switch
                {
                    ".png" => "image/png",
                    ".jpg" or ".jpeg" => "image/jpeg",
                    _ => "application/octet-stream"
                };
                streamContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
                
                request.Add(streamContent, "file", uniqueFileName);

                var response = await httpClient.PostAsync("http://localhost:8000/predict", request);
                
                if (response.IsSuccessStatusCode)
                {
                    var responseString = await response.Content.ReadAsStringAsync();
                    using var jsonDocument = JsonDocument.Parse(responseString);
                    var root = jsonDocument.RootElement;
                    
                    if (root.TryGetProperty("success", out var successElement) && successElement.GetBoolean())
                    {
                        diseaseName = root.GetProperty("diagnosis").GetString() ?? "Unknown";
                        confidence = root.GetProperty("confidence").GetDouble();
                        description = $"AI analysis completed successfully with {confidence}% confidence.";
                    }
                }
                else
                {
                    var errorResponse = await response.Content.ReadAsStringAsync();
                    description = $"AI analysis failed with status code: {response.StatusCode}. Details: {errorResponse}";
                }
            }
            catch (Exception ex)
            {
                description = $"Error communicating with AI service: {ex.Message}";
            }

            var aiResult = new AIResult
            {
                PatientId = patientId,
                Patient = patient,
                ModelId = 1, // Default AI Model
                ImagePath = imageUrl,
                DiseaseName = diseaseName,
                Description = description,
                Confidence = confidence,
                Recommendations = "Please consult with a doctor for professional diagnosis.",
                AnalyzedAt = DateTime.UtcNow,
                IsReviewedByDoctor = false
            };

            await _unitOfWork.AIResults.AddAsync(aiResult);
            await _unitOfWork.CompleteAsync();

            return _mapper.Map<AIResultDto>(aiResult);
        }

        public async Task<AIResultDto> AnalyzeImageDirectlyAsync(IFormFile image)
        {
            // Validate image
            if (image == null || image.Length == 0)
                throw new Exception("Invalid image file");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var extension = Path.GetExtension(image.FileName).ToLower();
            if (!allowedExtensions.Contains(extension))
                throw new Exception("Only JPG, JPEG, and PNG files are allowed");

            // Save image temporarily to wwwroot
            var uploadsFolder = Path.Combine("wwwroot", "uploads", "ai-images");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await image.CopyToAsync(stream);
            }

            var imageUrl = $"/uploads/ai-images/{uniqueFileName}";

            // Call Python AI Model
            string diseaseName = "Pending Analysis";
            double confidence = 0;
            string description = "Image uploaded successfully. AI analysis failed.";
            
            try
            {
                var httpClient = _httpClientFactory.CreateClient();
                using var request = new MultipartFormDataContent();
                using var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
                using var streamContent = new StreamContent(fileStream);
                
                var contentType = extension switch
                {
                    ".png" => "image/png",
                    ".jpg" or ".jpeg" => "image/jpeg",
                    _ => "application/octet-stream"
                };
                streamContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
                
                request.Add(streamContent, "file", uniqueFileName);

                var response = await httpClient.PostAsync("http://localhost:8000/predict", request);
                
                if (response.IsSuccessStatusCode)
                {
                    var responseString = await response.Content.ReadAsStringAsync();
                    using var jsonDocument = JsonDocument.Parse(responseString);
                    var root = jsonDocument.RootElement;
                    
                    if (root.TryGetProperty("success", out var successElement) && successElement.GetBoolean())
                    {
                        diseaseName = root.GetProperty("diagnosis").GetString() ?? "Unknown";
                        confidence = root.GetProperty("confidence").GetDouble();
                        description = $"AI analysis completed successfully with {confidence}% confidence.";
                    }
                }
                else
                {
                    var errorResponse = await response.Content.ReadAsStringAsync();
                    description = $"AI analysis failed with status code: {response.StatusCode}. Details: {errorResponse}";
                }
            }
            catch (Exception ex)
            {
                description = $"Error communicating with AI service: {ex.Message}";
            }

            // Return a DTO without saving to the database
            return new AIResultDto
            {
                ResultId = 0,
                PatientId = 0,
                DoctorId = null,
                DiseaseName = diseaseName,
                Confidence = confidence,
                Description = description,
                ImagePath = imageUrl,
                IsReviewedByDoctor = false,
                AnalyzedAt = DateTime.UtcNow
            };
        }

        public async Task<AIResultDto?> AssignDoctorAsync(AssignDoctorDto assignDto)
        {
            var result = await _unitOfWork.AIResults.GetByIdAsync(assignDto.ResultId);
            if (result == null) return null;

            var doctor = await _unitOfWork.Doctors.GetByIdAsync(assignDto.DoctorId);
            if (doctor == null) throw new Exception("Doctor not found");

            result.DoctorId = assignDto.DoctorId;
            result.IsReviewedByDoctor = false; // Still pending

            _unitOfWork.AIResults.Update(result);
            await _unitOfWork.CompleteAsync();

            return _mapper.Map<AIResultDto>(result);
        }

        public async Task<AIResultDto?> ReviewResultAsync(ReviewAIResultDto reviewDto)
        {
            // Get existing result
            var result = await _unitOfWork.AIResults.GetByIdAsync(reviewDto.ResultId);
            if (result == null)
                return null;

            // Validate doctor exists
            var doctor = await _unitOfWork.Doctors.GetByIdAsync(reviewDto.DoctorId);
            if (doctor == null)
                throw new Exception("Doctor not found");

            // Update review information
            result.DoctorId = reviewDto.DoctorId;
            result.DoctorNotes = reviewDto.DoctorNotes;
            result.IsReviewedByDoctor = true;
            result.ReviewedAt = DateTime.UtcNow;

            _unitOfWork.AIResults.Update(result);
            await _unitOfWork.CompleteAsync();

            return _mapper.Map<AIResultDto>(result);
        }

        public async Task<bool> DeleteResultAsync(int resultId)
        {
            var result = await _unitOfWork.AIResults.GetByIdAsync(resultId);

            if (result == null)
                return false;

            // Delete image file if exists
            if (!string.IsNullOrEmpty(result.ImagePath))
            {
                var filePath = Path.Combine("wwwroot", result.ImagePath.TrimStart('/'));
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                }
            }

            _unitOfWork.AIResults.Delete(result);
            await _unitOfWork.CompleteAsync();

            return true;
        }
    }
}