FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["P2P.API/P2P.API.csproj", "P2P.API/"]
COPY ["P2P.Application/P2P.Application.csproj", "P2P.Application/"]
COPY ["P2P.Domain/P2P.Domain.csproj", "P2P.Domain/"]
COPY ["P2P.Infrastructure/P2P.Infrastructure.csproj", "P2P.Infrastructure/"]
RUN dotnet restore "P2P.API/P2P.API.csproj"
COPY . .
WORKDIR "/src/P2P.API"
RUN dotnet build "P2P.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "P2P.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
RUN mkdir -p /app/data /app/uploads /app/logs
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "P2P.API.dll"]
