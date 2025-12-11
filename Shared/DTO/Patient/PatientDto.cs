using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.DTO.Patient
{
    public class PatientDto
    {
        public int PatientId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNum { get; set; }
        public int Age { get; set; }
        public string Gender { get; set; }
        public double Weight { get; set; }
        public double Height { get; set; }
        public string BloodType { get; set; }
        public string Allergies { get; set; }
        public string ProfilePhoto { get; set; }
    }
}