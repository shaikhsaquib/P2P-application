@description('App name prefix')
param appName string = 'p2p-procurement'
param location string = resourceGroup().location
param environment string = 'prod'

// App Service Plan (Free F1 tier)
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${appName}-plan'
  location: location
  sku: { name: 'F1', tier: 'Free' }
  kind: 'linux'
  properties: { reserved: true }
}

// .NET API App Service
resource apiApp 'Microsoft.Web/sites@2022-09-01' = {
  name: '${appName}-api'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      appSettings: [
        { name: 'ASPNETCORE_ENVIRONMENT', value: 'Production' }
        { name: 'Jwt__Key', value: 'REPLACE_WITH_STRONG_KEY_IN_KEYVAULT' }
        { name: 'Jwt__Issuer', value: 'P2PApp' }
        { name: 'Jwt__Audience', value: 'P2PUsers' }
        { name: 'AllowedOrigins', value: 'https://${appName}-web.azurestaticapps.net' }
      ]
    }
  }
}

// Azure Static Web App (Angular - Free)
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: '${appName}-web'
  location: 'eastus2'
  sku: { name: 'Free', tier: 'Free' }
  properties: {}
}

// Application Insights (Free 5GB/month)
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${appName}-insights'
  location: location
  kind: 'web'
  properties: { Application_Type: 'web' }
}

// Storage Account for blob uploads (Free 5GB 12 months)
resource storage 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: '${replace(appName, '-', '')}storage'
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: { accessTier: 'Hot' }
}

output apiUrl string = 'https://${apiApp.properties.defaultHostName}'
output frontendUrl string = 'https://${staticWebApp.properties.defaultHostname}'
