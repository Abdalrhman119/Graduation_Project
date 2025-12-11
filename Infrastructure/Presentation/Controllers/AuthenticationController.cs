using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServicesAbstraction;
using Shared.Authentication;
using Shared.DTO; // تأكد إنك ضفت الـ AddressDto هنا لو هتستخدمه
using System.Security.Claims;
using System.Threading.Tasks;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthenticationController : ControllerBase
    {
        private readonly IAuthenticationService _authService;

        // حقن السيرفس مباشرة
        public AuthenticationController(IAuthenticationService authService)
        {
            _authService = authService;
        }

        // 1. تسجيل الدخول (مشترك للكل)
        [HttpPost("login")]
        public async Task<ActionResult<UserResponse>> Login(LoginRequest request)
        {
            // السيرفس هي اللي هترمي Exception لو الباسورد غلط
            // والمفروض عندك Middleware يتعامل مع الـ Exceptions
            // بس للتبسيط ممكن نستخدم try-catch هنا
            try
            {
                var result = await _authService.LoginAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        // 2. تسجيل مريض جديد
        [HttpPost("register/patient")]
        public async Task<ActionResult<UserResponse>> RegisterPatient(RegisterPatientRequest request)
        {
            try
            {
                var result = await _authService.RegisterPatientAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 3. تسجيل دكتور جديد (هنا بيتم التحقق من الرخصة داخل السيرفس)
        [HttpPost("register/doctor")]
        public async Task<ActionResult<UserResponse>> RegisterDoctor(RegisterDoctorRequest request)
        {
            try
            {
                var result = await _authService.RegisterDoctorAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                // لو الرخصة مستخدمة قبل كدة، السيرفس هترمي Exception والرسالة هتظهر هنا
                return BadRequest(new { message = ex.Message });
            }
        }

        // 4. التحقق من وجود الإيميل (مفيد للفرونت إند)
        [HttpGet("emailexists")]
        public async Task<ActionResult<bool>> CheckEmail(string email)
        {
            return Ok(await _authService.CheckEmailAsync(email));
        }

        // 5. جلب بيانات المستخدم الحالي (يتطلب توكن)
        [Authorize]
        [HttpGet("current-user")]
        public async Task<ActionResult<UserResponse>> GetCurrentUser()
        {
            // بنجيب الإيميل من التوكن
            var email = User.FindFirstValue(ClaimTypes.Email);

            if (string.IsNullOrEmpty(email)) return Unauthorized();

            var user = await _authService.GetUserByEmailAsync(email);
            return Ok(user);
        }
    }
}