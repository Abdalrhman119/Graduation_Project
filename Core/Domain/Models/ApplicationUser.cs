using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace Domain.Models.Identity
{
    public class ApplicationUser : IdentityUser
    {
        [Required]
        [MaxLength(100)]
        public string DisplayName { get; set; } = string.Empty;
        [Required]
        [MaxLength(20)]
        public string UserType { get; set; } = string.Empty;
        public Patient? Patient { get; set; }
        public Doctor? Doctor { get; set; }

    }
}
