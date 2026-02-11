#----------------------------------------------------------------------------------------------------------#

# Setup Environment Variables
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine-arm64v8 AS setup-environment-variables

# Added env variable for .net globalization. This turns off invariant and uses the available ICU libs. This is required to insert DateTime into the SQL instance.
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT 0

# Opt-out of .NET Usage Data Collection
ENV DOTNET_CLI_TELEMETRY_OPTOUT 1

# Setup for Platform Extension
# PLATFORM_CONTAINER_MODE -> Setup bypass for Platform.Extensons.SystemServices.SystemSecurity to retrieve API Key from Configuration, not the disk.
ENV PLATFORM_CONTAINER_MODE true

# PLATFORM_SECRET_LOCATION -> Default location into which Secrets are loaded.
ENV PLATFORM_SECRET_LOCATION '/etc/secrets'

# PLATFORM_CERTIFICATE_LOCATION -> Default location into which Certificates are loaded.
ENV PLATFORM_CERTIFICATE_LOCATION '/etc/certs'

# PLATFORM_CERTIFICATE_SUPPORTED_EXTENSIONS -> Default matching pattern for certificates located in PLATFORM_CERTIFICATE_LOCATION.
ENV PLATFORM_CERTIFICATE_SUPPORTED_EXTENSIONS '*.pfx,*.cer'

#----------------------------------------------------------------------------------------------------------#

# Add tooling
FROM setup-environment-variables AS register-tooling

# Add ICU lib. Used by SQL for obtaining culture info to insert time format as using InvariantCulture didn't work on linux.
# Add Curl. Used for healthchecks.
RUN apk --no-cache add icu-libs && \
    apk --no-cache add curl
# Add tzdata. Used for setting the timezone as contains information about the world's time zones
RUN apk --no-cache add tzdata
# Add CA-Certificates. Used for adding custom CA Certificates to the container. https://learn.microsoft.com/en-us/dotnet/core/compatibility/containers/8.0/krb5-libs-package
RUN apk --no-cache add ca-certificates

#----------------------------------------------------------------------------------------------------------#

# Register the CA certificate
FROM register-tooling AS register-ca-certificates

# Add Custom CA Certificates to the container
COPY src/certs/mgsops-DERCA02-CA.pem /usr/local/share/ca-certificates
COPY src/certs/MGSOPS-ROOT-CA.pem /usr/local/share/ca-certificates
COPY src/certs/mgsops-ISSUING-CA.pem /usr/local/share/ca-certificates
COPY src/certs/uigops-PKI1-CA.pem /usr/local/share/ca-certificates
COPY src/certs/uigops-PKI-CA.pem /usr/local/share/ca-certificates
COPY src/certs/DualCertRow-CA.pem /usr/local/share/ca-certificates

# Add Netskope CA Certificate to the container
COPY src/certs/nscacert.pem /usr/local/share/ca-certificates
RUN update-ca-certificates

#----------------------------------------------------------------------------------------------------------#

# Setup non-root user
FROM register-ca-certificates AS asp-net

# We don't want the API to be running as a root user, for Security reasons.
# Add a non-root user for the app and a group.
RUN addgroup -g 10000 appgroup && \
    # Create a user with ID 10000, no password assigned and with a home dir in the created group.
    adduser -D -u 10000 appuser -s /sbin/nologin -G appgroup

# We create the /app directory and then change ownership to our appuser and appgroup.
RUN mkdir /app && \
    chown -R appuser:appgroup /app

# Set the working directory for any subsequent RUN, CMD, ENTRYPOINT, COPY and ADD instructions.
WORKDIR /app

# Container is now set to run as appuser by default. Use USER root to switch back. You will still need to
# switch back again to prevent a security scan failure.
USER appuser:appgroup

#----------------------------------------------------------------------------------------------------------#

# Set final stage runtime as first stage to force VS to use it as default.
FROM asp-net AS runtime

WORKDIR /app

# Restore NuGet packages and cache as much as possible.
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine-arm64v8 AS restore

# Using public NuGet.org only - configure custom package sources via nuget.config if needed

COPY ["src/ui-api/Lxi-API.csproj", "src/"]
RUN dotnet restore "src/Lxi-API.csproj"

# Build & publish the API.
FROM restore AS build-and-publish
ARG BUILD_NUMBER=1.0.0.0
ARG CONFIGURATION=Release

COPY ["src/ui-api/.", "src"]
RUN dotnet build "src/Lxi-API.csproj" --no-restore -c ${CONFIGURATION} /p:Version=${BUILD_NUMBER}; \
    dotnet publish "src/Lxi-API.csproj" --no-build --no-restore -c ${CONFIGURATION} -o /app /p:UseAppHost=false /p:Version=${BUILD_NUMBER}

# Run the API.
FROM runtime AS final
COPY --from=build-and-publish /app .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "Lxi-API.dll"]
