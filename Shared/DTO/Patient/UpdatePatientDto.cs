using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.DTO.Patient
{
    public class UpdatePatientDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNum { get; set; }
        public double Weight { get; set; }
        public double Height { get; set; }
        public string Allergies { get; set; }
    }
}