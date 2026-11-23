// ==============================================================================
// AgriShield AI — Azure Cloud Architecture (Bicep Template)
// Provisions Enterprise Agricultural Intelligence Infrastructure
// ==============================================================================

@description('Deployment location')
param location string = resourceGroup().location

@description('Environment name (e.g. dev, staging, prod)')
param environmentName string = 'prod'

@description('Database administrator login name')
param dbAdminLogin string = 'agrishieldadmin'

@description('Database administrator password')
@secure()
param dbAdminPassword string

@description('Application secret key for JWT signing')
@secure()
param appSecretKey string

var prefix = 'agrishield-${environmentName}'

// 1. Log Analytics Workspace & Application Insights
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${prefix}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${prefix}-appinsights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// 2. Azure Storage Account (Blob Storage for Farmer Report Photos & Large Datasets)
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: replace('${prefix}store', '-', '')
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
  }
}

// 3. Azure Key Vault (Credentials Management)
resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: '${prefix}-kv'
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
  }
}

// 4. Azure Container Registry (ACR)
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: replace('${prefix}acr', '-', '')
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// 5. Azure Database for PostgreSQL Flexible Server (with PostGIS support)
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: '${prefix}-postgis-db'
  location: location
  sku: {
    name: 'Standard_B2s'
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    administratorLogin: dbAdminLogin
    administratorLoginPassword: dbAdminPassword
    storage: {
      storageSizeGB: 64
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// PostGIS Extension Configuration Parameter
resource postgisExtensionConfig 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2022-12-01' = {
  name: 'azure.extensions'
  parent: postgresServer
  properties: {
    value: 'POSTGIS'
    source: 'user-override'
  }
}

// 6. Azure Container Apps Managed Environment
resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${prefix}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// Outputs
output containerAppEnvironmentId string = containerAppEnv.id
output postgresFqdn string = postgresServer.properties.fullyQualifiedDomainName
output acrLoginServer string = containerRegistry.properties.loginServer
output appInsightsConnectionString string = appInsights.properties.ConnectionString
