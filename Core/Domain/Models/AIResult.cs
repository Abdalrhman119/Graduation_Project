using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Models
{
    public class AIResult
    {
        [Key]
        public int ResultId { get; set; }
        public string OutputData { get; set; }

        //fk
        public int PatientId { get; set; }
        [ForeignKey("PatientId")]
        public Patient Patient { get; set; }

        public int? DoctorId { get; set; } 
        [ForeignKey("DoctorId")]
        public Doctor Doctor { get; set; }

        public int ModelId { get; set; }
        [ForeignKey("ModelId")]
        public AIModel AIModel { get; set; }
    }
}
