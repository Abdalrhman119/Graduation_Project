using Domain.Contracts;
using Domain.Models;
using Persistence.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Persistence.Repositaries
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly StoreDbContext _context;

        public IGenericRepository<Patient> Patients { get; private set; }
        public IGenericRepository<Doctor> Doctors { get; private set; }
        public IGenericRepository<MedicalRecord> MedicalRecords { get; private set; }
        public IGenericRepository<Report> Reports { get; private set; }
        public IGenericRepository<Chat> Chats { get; private set; }

        public UnitOfWork(StoreDbContext context)
        {
            _context = context;

            Patients = new GenericRepository<Patient>(_context);
            Doctors = new GenericRepository<Doctor>(_context);
            MedicalRecords = new GenericRepository<MedicalRecord>(_context);
            Reports = new GenericRepository<Report>(_context);
            Chats = new GenericRepository<Chat>(_context);
        }

        public async Task<int> CompleteAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}