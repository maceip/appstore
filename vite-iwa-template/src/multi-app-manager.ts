/**
 * Multi-App Manager for Isolated Web Apps
 * Based on https://github.com/ivansandrk/multi-apps/blob/main/explainer.md
 * 
 * This implements:
 * - Multi-app manifest format
 * - Cross-app communication
 * - App discovery mechanisms
 * - Shared resource management
 */

export interface MultiAppManifest {
  // Standard IWA manifest fields
  name: string;
  short_name?: string;
  start_url: string;
  display?: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  background_color?: string;
  theme_color?: string;
  icons?: Array<{
    src: string;
    sizes: string;
    type: string;
  }>;
  isolated: true;

  // Multi-app specific fields
  multi_app?: {
    // App identity and relationships
    app_id: string;
    app_group?: string;
    version: string;
    
    // Communication capabilities
    communication?: {
      allowed_origins?: string[];
      message_types?: string[];
      shared_channels?: string[];
    };
    
    // Resource sharing
    shared_resources?: {
      storage_keys?: string[];
      cache_names?: string[];
      service_worker_scope?: string;
    };
    
    // App discovery
    discovery?: {
      advertise: boolean;
      search_tags?: string[];
      category?: string;
    };
    
    // Dependencies and relationships
    dependencies?: Array<{
      app_id: string;
      min_version?: string;
      required: boolean;
    }>;
    
    // Permissions for multi-app features
    permissions?: Array<
      'cross-app-messaging' | 
      'shared-storage' | 
      'app-discovery' | 
      'resource-sharing'
    >;
  };
}

export interface AppInfo {
  appId: string;
  name: string;
  version: string;
  origin: string;
  manifest: MultiAppManifest;
  status: 'installed' | 'running' | 'suspended' | 'error';
  lastSeen: Date;
}

export interface CrossAppMessage {
  type: string;
  data: any;
  sourceApp: string;
  targetApp?: string;
  timestamp: number;
  messageId: string;
}

export interface SharedResource {
  type: 'storage' | 'cache' | 'service-worker';
  name: string;
  owner: string;
  sharedWith: string[];
  permissions: ('read' | 'write' | 'delete')[];
}

/**
 * Multi-App Registry - Manages installed apps and their relationships
 */
export class MultiAppRegistry {
  private apps = new Map<string, AppInfo>();
  private appGroups = new Map<string, Set<string>>();
  private messageChannels = new Map<string, BroadcastChannel>();
  private sharedResources = new Map<string, SharedResource>();

  constructor() {
    this.initializeRegistry();
  }

  private async initializeRegistry(): Promise<void> {
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
  async registerApp(manifest: MultiAppManifest, origin: string): Promise<void> {
    const appId = manifest.multi_app?.app_id || manifest.name;
    
    const appInfo: AppInfo = {
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
      this.appGroups.get(groupId)!.add(appId);
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
  async unregisterApp(appId: string): Promise<void> {
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
  getApp(appId: string): AppInfo | undefined {
    return this.apps.get(appId);
  }

  /**
   * Get all registered apps
   */
  getAllApps(): AppInfo[] {
    return Array.from(this.apps.values());
  }

  /**
   * Get apps in a specific group
   */
  getAppGroup(groupId: string): AppInfo[] {
    const appIds = this.appGroups.get(groupId);
    if (!appIds) return [];
    
    return Array.from(appIds)
      .map(id => this.apps.get(id))
      .filter((app): app is AppInfo => app !== undefined);
  }

  /**
   * Discover apps by search criteria
   */
  discoverApps(criteria: {
    category?: string;
    tags?: string[];
    name?: string;
  }): AppInfo[] {
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
  updateAppStatus(appId: string, status: AppInfo['status']): void {
    const app = this.apps.get(appId);
    if (app) {
      app.status = status;
      app.lastSeen = new Date();
      this.saveRegistry();
    }
  }

  private async setupCommunicationChannels(app: AppInfo): Promise<void> {
    const communication = app.manifest.multi_app?.communication;
    if (!communication?.shared_channels) return;

    for (const channelName of communication.shared_channels) {
      if (!this.messageChannels.has(channelName)) {
        const channel = new BroadcastChannel(`multi-app-${channelName}`);
        this.messageChannels.set(channelName, channel);
      }
    }
  }

  private async cleanupCommunicationChannels(app: AppInfo): Promise<void> {
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

  private async registerSharedResources(app: AppInfo): Promise<void> {
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

  private async cleanupSharedResources(app: AppInfo): Promise<void> {
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

  private cleanupStaleApps(): void {
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

  private loadRegistryData(data: any): void {
    if (data.apps) {
      for (const [appId, appData] of Object.entries(data.apps)) {
        this.apps.set(appId, {
          ...appData as AppInfo,
          lastSeen: new Date((appData as any).lastSeen)
        });
      }
    }

    if (data.appGroups) {
      for (const [groupId, appIds] of Object.entries(data.appGroups)) {
        this.appGroups.set(groupId, new Set(appIds as string[]));
      }
    }
  }

  private saveRegistry(): void {
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
  private registry: MultiAppRegistry;
  private currentAppId: string;
  private messageHandlers = new Map<string, (message: CrossAppMessage) => void>();

  constructor(registry: MultiAppRegistry, currentAppId: string) {
    this.registry = registry;
    this.currentAppId = currentAppId;
    this.setupMessageHandling();
  }

  /**
   * Send a message to another app
   */
  async sendMessage(
    targetAppId: string, 
    messageType: string, 
    data: any
  ): Promise<boolean> {
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

    const message: CrossAppMessage = {
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
  async broadcastToGroup(messageType: string, data: any): Promise<void> {
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
  onMessage(messageType: string, handler: (message: CrossAppMessage) => void): void {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Remove a message handler
   */
  offMessage(messageType: string): void {
    this.messageHandlers.delete(messageType);
  }

  private setupMessageHandling(): void {
    const currentApp = this.registry.getApp(this.currentAppId);
    if (!currentApp?.manifest.multi_app?.communication?.shared_channels) return;

    for (const channelName of currentApp.manifest.multi_app.communication.shared_channels) {
      const channel = new BroadcastChannel(`multi-app-${channelName}`);
      
      channel.addEventListener('message', (event) => {
        const message = event.data as CrossAppMessage;
        
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

  private canCommunicateWith(targetApp: AppInfo): boolean {
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

  private findSharedChannel(targetApp: AppInfo): BroadcastChannel | null {
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
  private registry: MultiAppRegistry;
  private currentAppId: string;

  constructor(registry: MultiAppRegistry, currentAppId: string) {
    this.registry = registry;
    this.currentAppId = currentAppId;
  }

  /**
   * Access shared storage
   */
  async getSharedStorage(key: string): Promise<any> {
    if (!this.canAccessResource('storage', key, 'read')) {
      throw new Error(`No read access to shared storage key: ${key}`);
    }

    return localStorage.getItem(`shared:${key}`);
  }

  /**
   * Set shared storage
   */
  async setSharedStorage(key: string, value: any): Promise<void> {
    if (!this.canAccessResource('storage', key, 'write')) {
      throw new Error(`No write access to shared storage key: ${key}`);
    }

    localStorage.setItem(`shared:${key}`, value);
  }

  /**
   * Access shared cache
   */
  async getSharedCache(cacheName: string): Promise<Cache | null> {
    if (!this.canAccessResource('cache', cacheName, 'read')) {
      throw new Error(`No read access to shared cache: ${cacheName}`);
    }

    return await caches.open(`shared:${cacheName}`);
  }

  /**
   * Share a resource with another app
   */
  async shareResource(
    type: 'storage' | 'cache',
    name: string,
    targetAppId: string,
    permissions: ('read' | 'write' | 'delete')[]
  ): Promise<boolean> {
    const resourceKey = `${type}:${name}`;
    const resource = this.registry['sharedResources'].get(resourceKey);

    if (!resource || resource.owner !== this.currentAppId) {
      return false;
    }

    if (!resource.sharedWith.includes(targetAppId)) {
      resource.sharedWith.push(targetAppId);
    }

    resource.permissions = permissions;
    return true;
  }

  private canAccessResource(
    type: 'storage' | 'cache',
    name: string,
    permission: 'read' | 'write' | 'delete'
  ): boolean {
    const currentApp = this.registry.getApp(this.currentAppId);
    if (!currentApp) return false;

    // Check if app has resource sharing permission
    if (!currentApp.manifest.multi_app?.permissions?.includes('resource-sharing')) {
      return false;
    }

    const resourceKey = `${type}:${name}`;
    const resource = this.registry['sharedResources'].get(resourceKey);

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
  public registry: MultiAppRegistry;
  public communicator: CrossAppCommunicator;
  public resourceManager: SharedResourceManager;

  constructor(currentAppId: string) {
    this.registry = new MultiAppRegistry();
    this.communicator = new CrossAppCommunicator(this.registry, currentAppId);
    this.resourceManager = new SharedResourceManager(this.registry, currentAppId);
  }

  /**
   * Initialize the multi-app system for the current app
   */
  async initialize(manifest: MultiAppManifest, origin: string): Promise<void> {
    await this.registry.registerApp(manifest, origin);
    this.registry.updateAppStatus(manifest.multi_app?.app_id || manifest.name, 'running');
  }

  /**
   * Shutdown the multi-app system for the current app
   */
  async shutdown(): Promise<void> {
    const currentAppId = this.communicator['currentAppId'];
    this.registry.updateAppStatus(currentAppId, 'suspended');
  }

  /**
   * Create a multi-app manifest from a standard IWA manifest
   */
  static createMultiAppManifest(
    baseManifest: any,
    multiAppConfig: {
      appId: string;
      appGroup?: string;
      version?: string;
      permissions?: string[];
      communication?: any;
      sharedResources?: any;
      discovery?: any;
    }
  ): MultiAppManifest {
    return {
      ...baseManifest,
      isolated: true,
      multi_app: {
        app_id: multiAppConfig.appId,
        app_group: multiAppConfig.appGroup,
        version: multiAppConfig.version || '1.0.0',
        permissions: multiAppConfig.permissions as any || [],
        communication: multiAppConfig.communication,
        shared_resources: multiAppConfig.sharedResources,
        discovery: multiAppConfig.discovery || { advertise: false }
      }
    };
  }
}