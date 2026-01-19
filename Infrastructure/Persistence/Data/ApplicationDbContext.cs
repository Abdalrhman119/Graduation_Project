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
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }
        public DbSet<Patient> Patients { get; set; }
        public DbSet<Doctor> Doctors { get; set; }
        public DbSet<MedicalRecord> MedicalRecords { get; set; }
        public DbSet<Report> Reports { get; set; }
        public DbSet<Chat> Chats { get; set; }
        public DbSet<AIModel> AIModels { get; set; }
        public DbSet<AIResult> AIResults { get; set; }
        public DbSet<Message> Messages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            //patient entity configuration
            modelBuilder.Entity<Patient>(entity =>
            {
                entity.HasKey(p => p.PatientId);
                entity.HasOne(p => p.User)
                    .WithOne(u => u.Patient)
                    .HasForeignKey<Patient>(p => p.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(p => p.MedicalRecord)
                    .WithOne(m => m.Patient)
                    .HasForeignKey<MedicalRecord>(m => m.PatientId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasMany(p => p.Chats)
                    .WithOne(c => c.Patient)
                    .HasForeignKey(c => c.PatientId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasMany(p => p.Reports)
                    .WithOne(r => r.Patient)
                    .HasForeignKey(r => r.PatientId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasMany(p => p.AIResults)
                    .WithOne(a => a.Patient)
                    .HasForeignKey(a => a.PatientId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasIndex(p => p.Email).IsUnique();
                entity.HasIndex(p => p.UserId).IsUnique();
            });


            //doctor entity configuration
            modelBuilder.Entity<Doctor>(entity =>
            {
                entity.HasKey(d => d.DoctorId);
                entity.HasOne(d => d.User)
                    .WithOne(u => u.Doctor)
                    .HasForeignKey<Doctor>(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasMany(d => d.Chats)
                    .WithOne(c => c.Doctor)
                    .HasForeignKey(c => c.DoctorId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasMany(d => d.CreatedReports)
                    .WithOne(r => r.Doctor)
                    .HasForeignKey(r => r.DoctorId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasMany(d => d.ReviewedAIResults)
                    .WithOne(a => a.Doctor)
                    .HasForeignKey(a => a.DoctorId)
                    .OnDelete(DeleteBehavior.SetNull);
                entity.HasIndex(d => d.Email).IsUnique();
                entity.HasIndex(d => d.LicenceNum).IsUnique();
                entity.HasIndex(d => d.UserId).IsUnique();
            });

            //chat entity configuration
            modelBuilder.Entity<Chat>(entity =>
            {
                entity.HasKey(c => c.ChatId);
                entity.HasMany(c => c.Messages)
                    .WithOne(m => m.Chat)
                    .HasForeignKey(m => m.ChatId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasIndex(c => new { c.PatientId, c.DoctorId });
            });
            modelBuilder.Entity<Message>(entity =>
            { 
                entity.HasKey(m => m.MessageId);
                entity.Property(m => m.SentAt)
                    .HasDefaultValueSql("GETUTCDATE()");
                entity.HasIndex(m => m.ChatId);
                entity.HasIndex(m => m.SentAt);
            });

            //medical record entity configuration

            modelBuilder.Entity<MedicalRecord>(entity =>
            {
                entity.HasKey(m => m.RecId);
                entity.HasIndex(m => m.PatientId).IsUnique();
            });

            //report entity configuration 
            modelBuilder.Entity<Report>(entity =>
            {
                entity.HasKey(r => r.ReportId);

                entity.Property(r => r.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.HasIndex(r => r.PatientId);
                entity.HasIndex(r => r.DoctorId);
                entity.HasIndex(r => r.CreatedAt);
            });

            //AI model entity configuration

            modelBuilder.Entity<AIModel>(entity =>
            {
                entity.HasKey(a => a.ModelId);

                entity.HasMany(a => a.Results)
                    .WithOne(r => r.AIModel)
                    .HasForeignKey(r => r.ModelId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasData(
                    new AIModel
                    {
                        ModelId = 1,
                        ModelName = "GastroAI Disease Detection Model v1.0"
                    }
                );
            });

            //AI result configuration

            modelBuilder.Entity<AIResult>(entity =>
            {
                entity.HasKey(a => a.ResultId);

                entity.Property(a => a.AnalyzedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                
                entity.HasIndex(a => a.PatientId);
                entity.HasIndex(a => a.DoctorId);
                entity.HasIndex(a => a.ModelId);
                entity.HasIndex(a => a.AnalyzedAt);
                entity.HasIndex(a => a.IsReviewedByDoctor);
            });

            //ApplicationUser configuration

            modelBuilder.Entity<ApplicationUser>(entity =>
            {
                entity.HasIndex(u => u.UserType);
            });

        }

    }
}
