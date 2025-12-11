using ECommerce_Web.Factories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Shared.Authentication;
using System.Text;

namespace ECommerce.Web
{
    public static class Extentions
    {
        public static IServiceCollection AddWebApplicationService(this IServiceCollection services, IConfiguration configuration)
        {

            services.AddControllers();
            services.AddSwaggerServices();
            services.Configure<ApiBehaviorOptions>(options =>
            {
                //Func<ActionContext,IActionResult>
                options.InvalidModelStateResponseFactory = ApiResponseFactory.GenerateApiValidationResponse;
            });
            services.ConfigureJWT(configuration);
            services.AddCors(options => 
            {
                options.AddPolicy("CorsPolicy", builder =>
                {
                    builder.AllowAnyHeader().AllowAnyMethod().WithOrigins("http://localhost:4200");

                });
            });
            return services;
        }

        private static void ConfigureJWT(this IServiceCollection services, IConfiguration configuration)
        {

            var jwt = configuration.GetSection("JWTOptions").Get<JWTOptions>();
            services.AddAuthentication(config =>
            {
                config.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                config.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(config =>
            {
                config.TokenValidationParameters = new TokenValidationParameters()
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwt.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwt.Audience,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SecretKey))
                };
            });
        }
        private static void AddSwaggerServices(this IServiceCollection services)
        {
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen(options =>
            {
                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme()
                {
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Description = "You Must Enter 'Bearer' Before The Token 'Separated By Space'"
                });
                options.AddSecurityRequirement(new OpenApiSecurityRequirement()
                {
                    {
                        new OpenApiSecurityScheme()
                        {
                            Reference=new OpenApiReference()
                            {
                                Type=ReferenceType.SecurityScheme,
                                Id="Bearer"
                            }
                        },
                        new List<string>()
                    }
                });
            });
        }
    }
}
