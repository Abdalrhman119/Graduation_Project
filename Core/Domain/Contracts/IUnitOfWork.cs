using Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Contracts
{
    public interface IUnitOfWork : IDisposable
    {
        IGenericRepository<Patient> Patients { get; }
        IGenericRepository<Doctor> Doctors { get; }
        IGenericRepository<MedicalRecord> MedicalRecords { get; }
        IGenericRepository<Report> Reports { get; }
        IGenericRepository<Chat> Chats { get; }

        Task<int> CompleteAsync();
    }
}
