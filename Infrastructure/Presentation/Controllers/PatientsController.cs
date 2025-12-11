using Domain.Contracts;
using Domain.Models;
using Microsoft.AspNetCore.Mvc;
using Shared.DTO.Patient;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PatientsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public PatientsController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PatientDto>>> GetPatients()
        {
            var patients = await _unitOfWork.Patients.GetAllAsync();

            var patientsDto = patients.Select(p => new PatientDto
            {
                PatientId = p.PatientId,
                FirstName = p.FirstName,
                LastName = p.LastName,
                Email = p.Email,
                PhoneNum = p.PhoneNum,
                Age = p.Age,
                Gender = p.Gender
            }).ToList();

            return Ok(patientsDto);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PatientDto>> GetPatient(int id)
        {
            var patient = await _unitOfWork.Patients.GetByIdAsync(id);

            if (patient == null)
            {
                return NotFound($"Patient with ID {id} was not found.");
            }

            var patientDto = new PatientDto
            {
                PatientId = patient.PatientId,
                FirstName = patient.FirstName,
                LastName = patient.LastName,
                Email = patient.Email,
                PhoneNum = patient.PhoneNum,
                Age = patient.Age,
                Gender = patient.Gender,
                Weight = patient.Weight,
                Height = patient.Height,
                BloodType = patient.BloodType,
                Allergies = patient.Allergies,
                ProfilePhoto = patient.ProfilePhoto
            };

            return Ok(patientDto);
        }

        [HttpPost]
        public async Task<ActionResult<PatientDto>> CreatePatient(CreatePatientDto createDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var patient = new Patient
            {
                FirstName = createDto.FirstName,
                LastName = createDto.LastName,
                BirthDate = createDto.BirthDate,
                Age = createDto.Age,
                Gender = createDto.Gender,
                Email = createDto.Email,
                PhoneNum = createDto.PhoneNum,
                Weight = createDto.Weight,
                Height = createDto.Height,
                BloodType = createDto.BloodType,
                Allergies = createDto.Allergies,
                ProfilePhoto = createDto.ProfilePhoto
            };

            await _unitOfWork.Patients.AddAsync(patient);
            await _unitOfWork.CompleteAsync(); 

            return CreatedAtAction(nameof(GetPatient), new { id = patient.PatientId }, createDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePatient(int id, UpdatePatientDto updateDto)
        {
            var existingPatient = await _unitOfWork.Patients.GetByIdAsync(id);

            if (existingPatient == null)
                return NotFound($"Patient with ID {id} not found.");

            existingPatient.FirstName = updateDto.FirstName;
            existingPatient.LastName = updateDto.LastName;
            existingPatient.PhoneNum = updateDto.PhoneNum;
            existingPatient.Weight = updateDto.Weight;
            existingPatient.Height = updateDto.Height;
            existingPatient.Allergies = updateDto.Allergies;

            _unitOfWork.Patients.Update(existingPatient);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePatient(int id)
        {
            var patient = await _unitOfWork.Patients.GetByIdAsync(id);

            if (patient == null)
                return NotFound();

            _unitOfWork.Patients.Delete(patient);
            await _unitOfWork.CompleteAsync();

            return NoContent();
        }
    }
}