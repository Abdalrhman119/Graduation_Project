using AutoMapper;
using Domain.Contracts; 
using Domain.Models;
using Domain.Models.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ServicesAbstraction;
using Shared.Authentication;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Services
{
    public class AuthenticationService(
        UserManager<ApplicationUser> _userManager,
        IOptions<JWTOptions> _jwtOptions,
        IMapper _mapper,
        IUnitOfWork _unitOfWork 
        ) : IAuthenticationService
    {
        public async Task<UserResponse> LoginAsync(LoginRequest loginRequest)
        {
            var user = await _userManager.FindByEmailAsync(loginRequest.Email) ??
                    throw new Exception("User not found");

            var isValidPass = await _userManager.CheckPasswordAsync(user, loginRequest.Password);

            if (isValidPass)
            {
                var roles = await _userManager.GetRolesAsync(user);

                return new UserResponse()
                {
                    DisplayName = user.DisplayName,
                    Email = user.Email,
                    Token = await GenerateToken(user),
                    Role = roles.FirstOrDefault() ?? "User"
                };
            }

            throw new Exception("Unauthorized");
        }

        public async Task<UserResponse> RegisterPatientAsync(RegisterPatientRequest request)
        {
            if (await CheckEmailAsync(request.Email))
                throw new Exception("Email is already taken");

            var user = new ApplicationUser()
            {
                Email = request.Email,
                UserName = request.Email.Split('@')[0],
                DisplayName = $"{request.FirstName} {request.LastName}",
                PhoneNumber = request.PhoneNum
            };

            var createdUser = await _userManager.CreateAsync(user, request.Password);

            if (createdUser.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, "Patient");

                var patient = new Patient
                {
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    Email = request.Email,
                    PhoneNum = request.PhoneNum,

                    BirthDate = request.BirthDate,
                    Age = request.Age,
                    Gender = request.Gender,
                    Weight = request.Weight,
                    Height = request.Height,
                    BloodType = request.BloodType,
                    Allergies = request.Allergies,
                    ProfilePhoto = request.ProfilePhoto
                };

                await _unitOfWork.Patients.AddAsync(patient);
                await _unitOfWork.CompleteAsync();

                return new UserResponse()
                {
                    DisplayName = user.DisplayName,
                    Email = user.Email,
                    Token = await GenerateToken(user),
                    Role = "Patient"
                };
            }

            var errors = createdUser.Errors.Select(e => e.Description).ToList();
            throw new Exception(string.Join(",", errors));
        }

        public async Task<UserResponse> RegisterDoctorAsync(RegisterDoctorRequest request)
        {
            if (await CheckEmailAsync(request.Email))
                throw new Exception("Email is already taken");

            var allDoctors = await _unitOfWork.Doctors.GetAllAsync();
            var existingDoctor = allDoctors.FirstOrDefault(d => d.LicenceNum == request.LicenceNum);

            if (existingDoctor != null)
                throw new Exception("Medical License Number is already registered!");

            var user = new ApplicationUser()
            {
                Email = request.Email,
                UserName = request.Email.Split('@')[0],
                DisplayName = $"{request.FirstName} {request.LastName}",
                PhoneNumber = request.PhoneNum
            };

            var createdUser = await _userManager.CreateAsync(user, request.Password);

            if (createdUser.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, "Doctor");

                var doctor = new Doctor
                {
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    Email = request.Email,
                    PhoneNum = request.PhoneNum,

                    BirthDate = request.BirthDate,
                    Age = request.Age,
                    Gender = request.Gender,
                    LicenceNum = request.LicenceNum,
                    About = request.About,
                    YearsOfExperience = request.YearsOfExperience,
                    ProfilePhoto = request.ProfilePhoto,
                    Rating = 0.0
                };

                await _unitOfWork.Doctors.AddAsync(doctor);
                await _unitOfWork.CompleteAsync();

                return new UserResponse()
                {
                    DisplayName = user.DisplayName,
                    Email = user.Email,
                    Token = await GenerateToken(user),
                    Role = "Doctor"
                };
            }

            var errors = createdUser.Errors.Select(e => e.Description).ToList();
            throw new Exception(string.Join(",", errors));
        }

        public async Task<bool> CheckEmailAsync(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            return user != null;
        }

        public async Task<UserResponse> GetUserByEmailAsync(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null) throw new Exception("User not found");

            return new UserResponse
            {
                DisplayName = user.DisplayName,
                Email = user.Email,
                Token = await GenerateToken(user),
                Role = (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? "User"
            };
        }

        private async Task<string> GenerateToken(ApplicationUser user)
        {
            var jwtOpt = _jwtOptions.Value;
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim(ClaimTypes.Name, user.UserName!),
            };

            var roles = await _userManager.GetRolesAsync(user);
            foreach (var role in roles) claims.Add(new Claim(ClaimTypes.Role, role));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOpt.SecretKey));
            var credintials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Issuer = jwtOpt.Issuer,
                Audience = jwtOpt.Audience,
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(jwtOpt.DurationInDays),
                SigningCredentials = credintials
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}