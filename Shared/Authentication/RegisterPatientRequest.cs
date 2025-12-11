using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.Authentication
{
    public class RegisterPatientRequest : RegisterRequest
    {
        [Required] public string FirstName { get; set; }
        [Required] public string LastName { get; set; }
        public DateOnly BirthDate { get; set; } 
        public int Age { get; set; }
        public string Gender { get; set; }
        public double Weight { get; set; }
        public double Height { get; set; }
        public string BloodType { get; set; }
        public string Allergies { get; set; }
        public string ProfilePhoto { get; set; }
    }
}
