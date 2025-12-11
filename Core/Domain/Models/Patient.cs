using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Models
{
    public class Patient 
    {
        [Key]
        public int PatientId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public DateOnly BirthDate { get; set; }
        public int Age { get; set; }
        public string Gender { get; set; }
        public string Email { get; set; }
        public string PhoneNum { get; set; }
        public double Weight { get; set; }
        public double Height { get; set; }
        public string BloodType { get; set; }
        public string Allergies { get; set; }
        public string ProfilePhoto { get; set; }

        public MedicalRecord MedicalRecord { get; set; }// 1:1
        public ICollection<Report> Reports { get; set; }// 1:M
        public ICollection<Chat> Chats { get; set; }// M:M 
        public ICollection<AIResult> AIResults { get; set; }// 1:M
    }
}
