using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared.DTO.MedicalRecord
{
    public class MedicalRecordDto
    {
        public int RecId { get; set; }
        public string CurrentMedicine { get; set; } = string.Empty;
        public string ChronicDisease { get; set; } = string.Empty;
        public string PreviousSurgeries { get; set; } = string.Empty;
        public int PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
    }
}
