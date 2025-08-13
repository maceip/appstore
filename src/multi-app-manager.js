/**
 * Multi-App Manager for Isolated Web Apps
 * JavaScript version for browser compatibility
 */

/**
 * Multi-App Registry - Manages installed apps and their relationships
 */
export class MultiAppRegistry {
  constructor() {
    this.apps = new Map();
    this.appGroups = new Map();
    this.messageChannels = new Map();
    this.sharedResources = new Map();
    this.initializeRegistry();
  }

  async initializeRegistry() {
    // Load existing app registry from storage
    try {
      const stored = localStorage.getItem('multi-app-registry');
      if (stored) {
        const data = JSON.parse(stored);
        this.loadRegistryData(data);
      }
    } catch (error) {
      console.warn('Failed to load app registry:', error);
    }

    // Set up cleanup interval
    setInterval(() => this.cleanupStaleApps(), 60000); // Every minute
  }

  /**
   * Register a new app in the multi-app system
   */
  async registerApp(manifest, origin) {
    const appId = manifest.multi_app?.app_id || manifest.name;
    
    const appInfo = {
      appId,
      name: manifest.name,
      version: manifest.multi_app?.version || '1.0.0',
      origin,
      manifest,
      status: 'installed',
      lastSeen: new Date()
    };

    this.apps.set(appId, appInfo);

    // Add to app group if specified
    const groupId = manifest.multi_app?.app_group;
    if (groupId) {
      if (!this.appGroups.has(groupId)) {
        this.appGroups.set(groupId, new Set());
      }
      this.appGroups.get(groupId).add(appId);
    }

    // Set up communication channels
    await this.setupCommunicationChannels(appInfo);

    // Register shared resources
    await this.registerSharedResources(appInfo);

    // Persist registry
    this.saveRegistry();

    console.log(`Registered multi-app: ${appId} (${manifest.name})`);
  }

  /**
   * Unregister an app from the multi-app system
   */
  async unregisterApp(appId) {
    const app = this.apps.get(appId);
    if (!app) return;

    // Clean up communication channels
    await this.cleanupCommunicationChannels(app);

    // Clean up shared resources
    await this.cleanupSharedResources(app);

    // Remove from app groups
    for (const [groupId, apps] of this.appGroups) {
      apps.delete(appId);
      if (apps.size === 0) {
        this.appGroups.delete(groupId);
      }
    }

    this.apps.delete(appId);
    this.saveRegistry();

    console.log(`Unregistered multi-app: ${appId}`);
  }

  /**
   * Get information about a specific app
   */
  getApp(appId) {
    return this.apps.get(appId);
  }

  /**
   * Get all registered apps
   */
  getAllApps() {
    return Array.from(this.apps.values());
  }

  /**
   * Get apps in a specific group
   */
  getAppGroup(groupId) {
    const appIds = this.appGroups.get(groupId);
    if (!appIds) return [];
    
    return Array.from(appIds)
      .map(id => this.apps.get(id))
      .filter(app => app !== undefined);
  }

  /**
   * Discover apps by search criteria
   */
  discoverApps(criteria) {
    return this.getAllApps().filter(app => {
      const discovery = app.manifest.multi_app?.discovery;
      if (!discovery?.advertise) return false;

      if (criteria.category && discovery.category !== criteria.category) {
        return false;
      }

      if (criteria.tags && criteria.tags.length > 0) {
        const appTags = discovery.search_tags || [];
        if (!criteria.tags.some(tag => appTags.includes(tag))) {
          return false;
        }
      }

      if (criteria.name) {
        const searchName = criteria.name.toLowerCase();
        if (!app.name.toLowerCase().includes(searchName)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Update app status
   */
  updateAppStatus(appId, status) {
    const app = this.apps.get(appId);
    if (app) {
      app.status = status;
      app.lastSeen = new Date();
      this.saveRegistry();
    }
  }

  async setupCommunicationChannels(app) {
    const communication = app.manifest.multi_app?.communication;
    if (!communication?.shared_channels) return;

    for (const channelName of communication.shared_channels) {
      if (!this.messageChannels.has(channelName)) {
        const channel = new BroadcastChannel(`multi-app-${channelName}`);
        this.messageChannels.set(channelName, channel);
      }
    }
  }

  async cleanupCommunicationChannels(app) {
    const communication = app.manifest.multi_app?.communication;
    if (!communication?.shared_channels) return;

    for (const channelName of communication.shared_channels) {
      // Check if any other apps are using this channel
      const stillInUse = this.getAllApps().some(otherApp => 
        otherApp.appId !== app.appId &&
        otherApp.manifest.multi_app?.communication?.shared_channels?.includes(channelName)
      );

      if (!stillInUse) {
        const channel = this.messageChannels.get(channelName);
        if (channel) {
          channel.close();
          this.messageChannels.delete(channelName);
        }
      }
    }
  }

  async registerSharedResources(app) {
    const resources = app.manifest.multi_app?.shared_resources;
    if (!resources) return;

    // Register storage keys
    if (resources.storage_keys) {
      for (const key of resources.storage_keys) {
        this.sharedResources.set(`storage:${key}`, {
          type: 'storage',
          name: key,
          owner: app.appId,
          sharedWith: [],
          permissions: ['read', 'write']
        });
      }
    }

    // Register cache names
    if (resources.cache_names) {
      for (const cacheName of resources.cache_names) {
        this.sharedResources.set(`cache:${cacheName}`, {
          type: 'cache',
          name: cacheName,
          owner: app.appId,
          sharedWith: [],
          permissions: ['read', 'write']
        });
      }
    }
  }

  async cleanupSharedResources(app) {
    // Remove resources owned by this app
    for (const [key, resource] of this.sharedResources) {
      if (resource.owner === app.appId) {
        this.sharedResources.delete(key);
      } else {
        // Remove app from shared access
        resource.sharedWith = resource.sharedWith.filter(id => id !== app.appId);
      }
    }
  }

  cleanupStaleApps() {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [appId, app] of this.apps) {
      if (app.status === 'running' && 
          now.getTime() - app.lastSeen.getTime() > staleThreshold) {
        app.status = 'suspended';
        console.log(`App ${appId} marked as suspended due to inactivity`);
      }
    }

    this.saveRegistry();
  }

  loadRegistryData(data) {
    if (data.apps) {
      for (const [appId, appData] of Object.entries(data.apps)) {
        this.apps.set(appId, {
          ...appData,
          lastSeen: new Date(appData.lastSeen)
        });
      }
    }

    if (data.appGroups) {
      for (const [groupId, appIds] of Object.entries(data.appGroups)) {
        this.appGroups.set(groupId, new Set(appIds));
      }
    }
  }

  saveRegistry() {
    try {
      const data = {
        apps: Object.fromEntries(this.apps),
        appGroups: Object.fromEntries(
          Array.from(this.appGroups.entries()).map(([k, v]) => [k, Array.from(v)])
        )
      };
      localStorage.setItem('multi-app-registry', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save app registry:', error);
    }
  }
}

/**
 * Cross-App Communication Manager
 */
export class CrossAppCommunicator {
  constructor(registry, currentAppId) {
    this.registry = registry;
    this.currentAppId = currentAppId;
    this.messageHandlers = new Map();
    this.setupMessageHandling();
  }

  /**
   * Send a message to another app
   */
  async sendMessage(targetAppId, messageType, data) {
    const targetApp = this.registry.getApp(targetAppId);
    if (!targetApp) {
      console.warn(`Target app not found: ${targetAppId}`);
      return false;
    }

    // Check permissions
    if (!this.canCommunicateWith(targetApp)) {
      console.warn(`Communication not allowed with app: ${targetAppId}`);
      return false;
    }

    const message = {
      type: messageType,
      data,
      sourceApp: this.currentAppId,
      targetApp: targetAppId,
      timestamp: Date.now(),
      messageId: crypto.randomUUID()
    };

    // Find shared communication channel
    const channel = this.findSharedChannel(targetApp);
    if (channel) {
      channel.postMessage(message);
      return true;
    }

    console.warn(`No shared communication channel with app: ${targetAppId}`);
    return false;
  }

  /**
   * Broadcast a message to all apps in the same group
   */
  async broadcastToGroup(messageType, data) {
    const currentApp = this.registry.getApp(this.currentAppId);
    if (!currentApp?.manifest.multi_app?.app_group) return;

    const groupApps = this.registry.getAppGroup(currentApp.manifest.multi_app.app_group);
    
    for (const app of groupApps) {
      if (app.appId !== this.currentAppId) {
        await this.sendMessage(app.appId, messageType, data);
      }
    }
  }

  /**
   * Register a message handler
   */
  onMessage(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Remove a message handler
   */
  offMessage(messageType) {
    this.messageHandlers.delete(messageType);
  }

  setupMessageHandling() {
    const currentApp = this.registry.getApp(this.currentAppId);
    if (!currentApp?.manifest.multi_app?.communication?.shared_channels) return;

    for (const channelName of currentApp.manifest.multi_app.communication.shared_channels) {
      const channel = new BroadcastChannel(`multi-app-${channelName}`);
      
      channel.addEventListener('message', (event) => {
        const message = event.data;
        
        // Ignore messages from self
        if (message.sourceApp === this.currentAppId) return;
        
        // Check if message is for us
        if (message.targetApp && message.targetApp !== this.currentAppId) return;
        
        // Handle the message
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          handler(message);
        }
      });
    }
  }

  canCommunicateWith(targetApp) {
    const currentApp = this.registry.getApp(this.currentAppId);
    if (!currentApp) return false;

    const currentComm = currentApp.manifest.multi_app?.communication;
    const targetComm = targetApp.manifest.multi_app?.communication;

    // Check if both apps have cross-app messaging permission
    const currentHasPermission = currentApp.manifest.multi_app?.permissions?.includes('cross-app-messaging');
    const targetHasPermission = targetApp.manifest.multi_app?.permissions?.includes('cross-app-messaging');

    if (!currentHasPermission || !targetHasPermission) return false;

    // Check allowed origins
    if (currentComm?.allowed_origins) {
      if (!currentComm.allowed_origins.includes(targetApp.origin)) return false;
    }

    if (targetComm?.allowed_origins) {
      if (!targetComm.allowed_origins.includes(currentApp.origin)) return false;
    }

    return true;
  }

  findSharedChannel(targetApp) {
    const currentApp = this.registry.getApp(this.currentAppId);
    if (!currentApp) return null;

    const currentChannels = currentApp.manifest.multi_app?.communication?.shared_channels || [];
    const targetChannels = targetApp.manifest.multi_app?.communication?.shared_channels || [];

    // Find a common channel
    for (const channelName of currentChannels) {
      if (targetChannels.includes(channelName)) {
        return new BroadcastChannel(`multi-app-${channelName}`);
      }
    }

    return null;
  }
}

/**
 * Shared Resource Manager
 */
export class SharedResourceManager {
  constructor(registry, currentAppId) {
    this.registry = registry;
    this.currentAppId = currentAppId;
  }

  /**
   * Access shared storage
   */
  async getSharedStorage(key) {
    if (!this.canAccessResource('storage', key, 'read')) {
      throw new Error(`No read access to shared storage key: ${key}`);
    }

    return localStorage.getItem(`shared:${key}`);
  }

  /**
   * Set shared storage
   */
  async setSharedStorage(key, value) {
    if (!this.canAccessResource('storage', key, 'write')) {
      throw new Error(`No write access to shared storage key: ${key}`);
    }

    localStorage.setItem(`shared:${key}`, value);
  }

  /**
   * Access shared cache
   */
  async getSharedCache(cacheName) {
    if (!this.canAccessResource('cache', cacheName, 'read')) {
      throw new Error(`No read access to shared cache: ${cacheName}`);
    }

    return await caches.open(`shared:${cacheName}`);
  }

  /**
   * Share a resource with another app
   */
  async shareResource(type, name, targetAppId, permissions) {
    const resourceKey = `${type}:${name}`;
    const resource = this.registry.sharedResources.get(resourceKey);

    if (!resource || resource.owner !== this.currentAppId) {
      return false;
    }

    if (!resource.sharedWith.includes(targetAppId)) {
      resource.sharedWith.push(targetAppId);
    }

    resource.permissions = permissions;
    return true;
  }

  canAccessResource(type, name, permission) {
    const currentApp = this.registry.getApp(this.currentAppId);
    if (!currentApp) return false;

    // Check if app has resource sharing permission
    if (!currentApp.manifest.multi_app?.permissions?.includes('resource-sharing')) {
      return false;
    }

    const resourceKey = `${type}:${name}`;
    const resource = this.registry.sharedResources.get(resourceKey);

    if (!resource) return false;

    // Owner has full access
    if (resource.owner === this.currentAppId) return true;

    // Check shared access
    if (resource.sharedWith.includes(this.currentAppId)) {
      return resource.permissions.includes(permission);
    }

    return false;
  }
}

/**
 * Multi-App Manager - Main interface for multi-app functionality
 */
export class MultiAppManager {
  constructor(currentAppId) {
    this.registry = new MultiAppRegistry();
    this.communicator = new CrossAppCommunicator(this.registry, currentAppId);
    this.resourceManager = new SharedResourceManager(this.registry, currentAppId);
  }

  /**
   * Initialize the multi-app system for the current app
   */
  async initialize(manifest, origin) {
    await this.registry.registerApp(manifest, origin);
    this.registry.updateAppStatus(manifest.multi_app?.app_id || manifest.name, 'running');
  }

  /**
   * Shutdown the multi-app system for the current app
   */
  async shutdown() {
    const currentAppId = this.communicator.currentAppId;
    this.registry.updateAppStatus(currentAppId, 'suspended');
  }

  /**
   * Create a multi-app manifest from a standard IWA manifest
   */
  static createMultiAppManifest(baseManifest, multiAppConfig) {
    return {
      ...baseManifest,
      isolated: true,
      multi_app: {
        app_id: multiAppConfig.appId,
        app_group: multiAppConfig.appGroup,
        version: multiAppConfig.version || '1.0.0',
        permissions: multiAppConfig.permissions || [],
        communication: multiAppConfig.communication,
        shared_resources: multiAppConfig.sharedResources,
        discovery: multiAppConfig.discovery || { advertise: false }
      }
    };
  }
}