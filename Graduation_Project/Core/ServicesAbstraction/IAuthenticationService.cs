using Shared.Authentication;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ServicesAbstraction
{
    public interface IAuthenticationService
    {

        Task<UserResponse> LoginAsync(LoginRequest request);

        Task<UserResponse> RegisterPatientAsync(RegisterPatientRequest request);
        Task<UserResponse> RegisterDoctorAsync(RegisterDoctorRequest request);
        Task<bool> CheckEmailAsync(string email);
        Task<UserResponse> GetUserByEmailAsync(string email);
    }
}