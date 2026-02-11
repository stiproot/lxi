FROM itartifacts.co.uk/imagebuild/platform/container/dotnet/aspnet:8.0-alpine AS runtime

FROM itartifacts.co.uk/imagebuild/platform/container/dotnet/sdk:8.0-alpine AS restore

  # Using public NuGet.org only - configure custom package sources via nuget.config if needed

  COPY ["Lxi-API.csproj", "src/"]
  RUN dotnet restore "src/Lxi-API.csproj"

# Build & publish the API.
FROM restore AS build-and-publish
  ARG BUILD_NUMBER=1.0.0.0
  ARG CONFIGURATION=Release

  COPY [".", "src"]
  RUN dotnet build "src/Lxi-API.csproj" --no-restore -c ${CONFIGURATION} /p:Version=$BUILD_NUMBER; \
      dotnet publish "src/Lxi-API.csproj" --no-build --no-restore -c ${CONFIGURATION} -o /app /p:UseAppHost=false /p:Version=$BUILD_NUMBER

# Run the API.
FROM runtime AS final
  USER root

  # Setup directories
  RUN mkdir /usr/local/keys \
            /usr/local/logs

  # Setup App User Permissions
  RUN chown -R appuser:appgroup /usr/local/keys \
                                /usr/local/logs
  USER appuser:appgroup

WORKDIR /app
COPY --chown=appuser:appgroup --from=build-and-publish /app .

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "Lxi-API.dll"]
