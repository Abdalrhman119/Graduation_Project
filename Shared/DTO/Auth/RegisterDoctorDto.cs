using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.DTO.Auth
{
    public class RegisterDoctorDto
    {
        [Required]
        public string DisplayName { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required] 
        public string Password { get; set; }

        [Required]
        public string LicenceNum { get; set; }

        public string PhoneNum { get; set; }
        public string About { get; set; }
        public int YearsOfExperience { get; set; }
    }
}
