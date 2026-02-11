using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Reflection;
using System.Runtime;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using NLog;
using NLog.Web;
using Platform.Extensions.AspNet.OpenTelemetry.Logging;
using Platform.Extensions.AspNet.OpenTelemetry;
using Platform.Extensions.AspNet.Core.Extensions;
using Services;
using Hubs;

namespace Lxi.Api;

public class Program
{
  private static JsonWebKeySet? _cachedKeys;
  private static DateTime _keysLastFetched = DateTime.MinValue;
  private static readonly TimeSpan KeysCacheDuration = TimeSpan.FromHours(1);

  public static void Main(string[] args)
  {
    Logger logger = LogManager.Setup().LoadConfigurationFromAppSettings().GetCurrentClassLogger();
    logger.Info("Initialization started");

    try
    {
      WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

      ConfigurationManager configuration = builder.Configuration;
      IWebHostEnvironment environment = builder.Environment;

      builder
        .AddPlatformOpenTelemetryLogging(configuration);

      ConfigureServices(builder.Services, configuration);

      WebApplication app = builder.Build();

      ConfigureMiddleware(app, environment);

      LogInitializationComplete(app);

      app.Run();
    }
    catch (Exception ex)
    {
      logger.Error(ex, "Stopped program because of exception");
      throw;
    }
    finally
    {
      LogManager.Shutdown();
    }
  }

  private static void ConfigureServices(IServiceCollection services, IConfiguration configuration)
  {
    services.AddSwaggerGen(c =>
    {
      c.SwaggerDoc("v1", new OpenApiInfo
      {
        Title = "LxiAPI",
        Version = "v1",
        Description = "API for Lxi application"
      });
      c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme()
      {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme. \r\n\r\n Enter 'Bearer' [space] and then your token in the text input below.\r\n\r\nExample: \"Bearer 1safsfsdfdfd\"",
      });
      c.AddSecurityRequirement(new OpenApiSecurityRequirement {
        {
            new OpenApiSecurityScheme {
                Reference = new OpenApiReference {
                    Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                }
            },
            []
        }
      });
    });

    services.AddSingleton(configuration);

    services.Configure<OktaOptions>(configuration.GetSection(nameof(OktaOptions)));
    services.Configure<ApiOptions>(configuration.GetSection(nameof(ApiOptions)));

    services.AddDaprActor<ChatActor>(configuration);
    services.AddDaprActor<UserActor>(configuration);
    services.AddDaprActor<RepoActor>(configuration);

    services.AddSingleton<IDataService, DataService>();
    services.AddSingleton<IChatService, ChatService>();
    services.AddSingleton<IAuthService, AuthService>();
    services.AddSingleton<IUserService, UserService>();
    services.AddSingleton<IDaprUtils, DaprUtils>();
    services.AddSingleton<IAiService, AiService>();
    services.AddSingleton<IRepoService, RepoService>();

    string base64Token = Convert.ToBase64String(Encoding.ASCII.GetBytes($":{configuration["AzureDevOps:Pat"]!}"));
    services.AddHttpClient<IRepositoryClient, AzureDevOpsClient>(client => client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", base64Token));

    services.AddEndpointsApiExplorer();
    services.AddDaprClient();
    services.AddHttpContextAccessor();
    services.AddPlatformOpenTelemetry(configuration);
    services.AddPlatformCore(configuration);

    services.AddSignalR();

    services.AddControllers()
      .AddJsonOptions(options =>
      {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.Converters
          .RemoveAt(0); // Remove the Platform Extension DateTimeConverter to allow for all date times to be parsed.
      });

    // Add CORS policy
    var corsOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
      ?? new[] { "http://localhost:3000", "http://localhost:8080" };

    services.AddCors(options => options.AddPolicy("AllowSpecificOrigin", builder => builder
          .WithOrigins(corsOrigins)
          .AllowAnyMethod()
          .AllowAnyHeader()
          .AllowCredentials()
          .WithExposedHeaders("Sec-WebSocket-Accept")));

    // Configure JWT authentication
    services.AddAuthentication(options =>
    {
      options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
      options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
      options.Authority = configuration["OktaOptions:Issuer"];
      options.Audience = "api://default";
      options.TokenValidationParameters = new TokenValidationParameters
      {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = configuration["OktaOptions:Issuer"],
        ValidAudience = "api://default",
        IssuerSigningKeyResolver = (token, securityToken, kid, parameters) =>
        {
          // Check if the keys are cached and still valid
          if (_cachedKeys is null || DateTime.UtcNow - _keysLastFetched > KeysCacheDuration)
          {
            // Retrieve the keys from the JWKS endpoint synchronously
            var client = new HttpClient();
            HttpResponseMessage response = client.GetAsync($"{configuration["OktaOptions:Issuer"]}/v1/keys").Result;
            if (response.IsSuccessStatusCode)
            {
              _cachedKeys = new JsonWebKeySet(response.Content.ReadAsStringAsync().Result);
              _keysLastFetched = DateTime.UtcNow;
            }
            else
            {
              throw new InvalidOperationException("Unable to retrieve JWKS keys");
            }
          }
          return _cachedKeys.GetSigningKeys();
        }
      };

      // Enable JWT tokens from query string for SignalR
      options.Events = new JwtBearerEvents
      {
        OnMessageReceived = context =>
        {
          Microsoft.Extensions.Primitives.StringValues accessToken = context.Request.Query["access_token"];

          // If the request is for SignalR hubs
          PathString path = context.HttpContext.Request.Path;
          if (!string.IsNullOrEmpty(accessToken) &&
              (path.StartsWithSegments("/chatHub") || path.StartsWithSegments("/repositoryStatusHub")))
          {
            context.Token = accessToken;
          }
          return Task.CompletedTask;
        }
      };
    });

    // Add authorization services
    services.AddAuthorization();
  }

  private static void ConfigureMiddleware(WebApplication app, IHostEnvironment environment)
  {
    app.UseHttpsRedirection();

    if (environment.IsDevelopment())
    {
      app.UseDeveloperExceptionPage();
      app.UseSwagger();
      app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "LxiAPI"));
    }

    app.UseRouting();

    // Use CORS policy
    app.UseCors("AllowSpecificOrigin");

    // Add WebSockets middleware
    app.UseWebSockets();

    app.UseAuthentication();
    app.UseAuthorization();

    // Handle OPTIONS requests globally
    app.Use(async (context, next) =>
    {
      if (context.Request.Method == HttpMethods.Options)
      {
        context.Response.StatusCode = (int)HttpStatusCode.OK;
        return;
      }

      await next();
    });

    app.MapHub<ChatHub>("chatHub");
    app.MapHub<RepositoryStatusHub>("repositoryStatusHub");

    app.MapControllers();
    app.MapActorsHandlers();

    ILogger<Program> programLogger = app.Services.GetRequiredService<ILogger<Program>>();

    programLogger.LogGenericInformation("API Startup Complete");
  }

  private static void LogInitializationComplete(WebApplication app)
  {
    ILogger<Program> logger = app.Services.GetRequiredService<ILogger<Program>>();
    string? version = FileVersionInfo.GetVersionInfo(Assembly.GetExecutingAssembly().Location).FileVersion;
    string platform = Environment.Is64BitProcess ? "64-bit (x64)" : "32-bit (x86)";
    string logMessage = $@"
          Initialization complete for  {app.Environment.ApplicationName}:
          ProcessID                    {Environment.ProcessId}
          Platform                     {platform}
          Runtime                      {Environment.Version}
          NumCPUs                      {Environment.ProcessorCount}
          ServerGC                     {GCSettings.IsServerGC}
          HttpConnectionLimit          {ServicePointManager.DefaultConnectionLimit}
          BuildType                    Release
          ASPNETCORE_ENVIRONMENT       {app.Environment.EnvironmentName}
          Version                      {version}";

    logger.LogGenericInformation(logMessage);
  }
}
