using Domain.Models;
using Domain.Models.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace Persistence.Data
{
    public class StoreDbContext(DbContextOptions<StoreDbContext> options) : IdentityDbContext<ApplicationUser>(options)
    {
        public DbSet<Patient> Patients { get; set; }
        public DbSet<Doctor> Doctors { get; set; }
        public DbSet<MedicalRecord> MedicalRecords { get; set; }
        public DbSet<Report> Reports { get; set; }
        public DbSet<Chat> Chats { get; set; }
        public DbSet<AIModel> AIModels { get; set; }
        public DbSet<AIResult> AIResults { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Patient>()
                .HasOne(p => p.MedicalRecord)
                .WithOne(m => m.Patient)
                .HasForeignKey<MedicalRecord>(m => m.PatientId);

            modelBuilder.Entity<Report>()
                .HasOne(r => r.Patient)
                .WithMany(p => p.Reports)
                .HasForeignKey(r => r.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Report>()
                .HasOne(r => r.Doctor)
                .WithMany(d => d.CreatedReports)
                .HasForeignKey(r => r.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Chat>()
                .HasOne(c => c.Patient)
                .WithMany(p => p.Chats)
                .HasForeignKey(c => c.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Chat>()
                .HasOne(c => c.Doctor)
                .WithMany(d => d.Chats)
                .HasForeignKey(c => c.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);
        }

    }
}
