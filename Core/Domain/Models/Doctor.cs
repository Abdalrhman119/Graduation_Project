using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Models
{
    public class Doctor
    {
        [Key]
        public int DoctorId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public DateOnly BirthDate { get; set; }
        public int Age { get; set; }
        public string Gender { get; set; }
        public string Email { get; set; }
        public string PhoneNum { get; set; }
        public int YearsOfExperience { get; set; }
        public double Rating { get; set; }
        public string LicenceNum { get; set; }
        public string ProfilePhoto { get; set; }
        public string About { get; set; }

    
        public ICollection<Report> CreatedReports { get; set; }// 1:M
        public ICollection<Chat> Chats { get; set; }// M:M 
        public ICollection<AIResult> ReviewedAIResults { get; set; }// 1:M
    }
}
