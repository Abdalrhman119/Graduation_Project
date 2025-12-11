using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Models
{
    public class MedicalRecord
    {
        [Key]
        public int RecId { get; set; }
        public string CurrentMedicine { get; set; }
        public string ChronicDisease { get; set; }

        //fk
        public int PatientId { get; set; }

        [ForeignKey("PatientId")]
        public Patient Patient { get; set; }
    }
}
