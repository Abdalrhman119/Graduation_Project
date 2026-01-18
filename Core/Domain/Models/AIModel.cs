using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Models
{
    public class AIModel
    {
        [Key]
        public int ModelId { get; set; }
        [Required]
        [MaxLength(100)]
        public string ModelName { get; set; } = string.Empty;

        public ICollection<AIResult> Results { get; set; } = null!;
    }
}
