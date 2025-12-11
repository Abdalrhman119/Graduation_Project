using System;
using System.ComponentModel.DataAnnotations;

namespace Shared.Authentication
{
    public class RegisterDoctorRequest : RegisterRequest
    {
        [Required]
        public string FirstName { get; set; } // 👈 ناقص

        [Required]
        public string LastName { get; set; } // 👈 ناقص

        public DateOnly BirthDate { get; set; } // لاحظ هنا DateTime حسب طلبك للدكتور
        public int Age { get; set; }
        public string Gender { get; set; }

        [Required]
        public string LicenceNum { get; set; } // 👈 أهم حقل

        public int YearsOfExperience { get; set; }
        public string About { get; set; }
        public string ProfilePhoto { get; set; }
    }
}