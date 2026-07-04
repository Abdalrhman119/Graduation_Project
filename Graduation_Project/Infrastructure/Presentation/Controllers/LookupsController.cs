using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LookupsController : ControllerBase
    {
        [HttpGet("specializations")]
        public IActionResult GetSpecializations()
        {
            return Ok(new List<string> { 
                "Gastroenterology", 
                "Hepatology", 
                "Internal Medicine", 
                "General Surgery", 
                "Endoscopy",
                "Pediatric Gastroenterology"
            });
        }

        [HttpGet("blood-types")]
        public IActionResult GetBloodTypes()
        {
            return Ok(new List<string> { "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-" });
        }

        [HttpGet("diet-types")]
        public IActionResult GetDietTypes()
        {
            return Ok(new List<string> { 
                "Standard", 
                "Low Carb", 
                "Vegetarian", 
                "Vegan", 
                "Gluten Free", 
                "Ketogenic",
                "Low Sodium"
            });
        }

        [HttpGet("family-history")]
        public IActionResult GetFamilyHistoryOptions()
        {
            return Ok(new List<string> { 
                "None", 
                "Diabetes", 
                "Hypertension", 
                "Gastrointestinal Cancer", 
                "Colorectal Polyps",
                "Heart Disease"
            });
        }

        [HttpGet("chronic-diseases")]
        public IActionResult GetChronicDiseases()
        {
            return Ok(new List<string> { 
                "Diabetes", 
                "Hypertension", 
                "Asthma", 
                "Heart Disease", 
                "Arthritis", 
                "Thyroid Disorder", 
                "Chronic Kidney Disease",
                "IBS",
                "Crohn's Disease",
                "Ulcerative Colitis"
            });
        }
    }
}
