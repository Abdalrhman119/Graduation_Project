using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Models
{
    public class Report
    {
        [Key]
        public int ReportId { get; set; }
        public DateTime Date { get; set; }
        public TimeSpan Time { get; set; }
        public string MedicationName { get; set; }
        public string Dosage { get; set; }
        public string Times { get; set; }

        //fk
        public int PatientId { get; set; }
        [ForeignKey("PatientId")]
        public Patient Patient { get; set; }

        public int DoctorId { get; set; }
        [ForeignKey("DoctorId")]
        public Doctor Doctor { get; set; }
    }
}
