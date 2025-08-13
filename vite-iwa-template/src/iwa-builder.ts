/**
 * IWA Builder - Create Signed Web Bundles and Isolated Web Apps in the browser
 * This implements the ability to generate IWAs dynamically using Web Cryptography API
 */

export interface IWAManifest {
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
  isolated?: boolean;
}

export interface IWAFile {
  path: string;
  content: Uint8Array;
  mimeType?: string;
}

export interface IWABuildOptions {
  manifest: IWAManifest;
  files: IWAFile[];
  baseURL?: string;
  privateKey?: CryptoKey;
  publicKey?: CryptoKey;
}

export class IWAKeyPair {
  constructor(
    public privateKey: CryptoKey,
    public publicKey: CryptoKey
  ) {}

  /**
   * Generate a new Ed25519 key pair for signing IWAs
   */
  static async generate(): Promise<IWAKeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'Ed25519',
      },
      true, // extractable
      ['sign', 'verify']
    );

    return new IWAKeyPair(keyPair.privateKey, keyPair.publicKey);
  }

  /**
   * Export keys to PEM format for storage
   */
  async exportKeys(): Promise<{ privateKey: string; publicKey: string }> {
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', this.privateKey);
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', this.publicKey);

    const privateKeyPem = this.bufferToPem(privateKeyBuffer, 'PRIVATE KEY');
    const publicKeyPem = this.bufferToPem(publicKeyBuffer, 'PUBLIC KEY');

    return { privateKey: privateKeyPem, publicKey: publicKeyPem };
  }

  /**
   * Import keys from PEM format
   */
  static async importKeys(privateKeyPem: string, publicKeyPem: string): Promise<IWAKeyPair> {
    const privateKeyBuffer = IWAKeyPair.pemToBuffer(privateKeyPem, 'PRIVATE KEY');
    const publicKeyBuffer = IWAKeyPair.pemToBuffer(publicKeyPem, 'PUBLIC KEY');

    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      { name: 'Ed25519' },
      true,
      ['sign']
    );

    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      { name: 'Ed25519' },
      true,
      ['verify']
    );

    return new IWAKeyPair(privateKey, publicKey);
  }

  private bufferToPem(buffer: ArrayBuffer, type: string): string {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const formatted = base64.match(/.{1,64}/g)?.join('\n') || base64;
    return `-----BEGIN ${type}-----\n${formatted}\n-----END ${type}-----`;
  }

  private static pemToBuffer(pem: string, type: string): ArrayBuffer {
    const base64 = pem
      .replace(`-----BEGIN ${type}-----`, '')
      .replace(`-----END ${type}-----`, '')
      .replace(/\s/g, '');
    
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    
    for (let i = 0; i < binary.length; i++) {
      view[i] = binary.charCodeAt(i);
    }
    
    return buffer;
  }

  /**
   * Get the Web Bundle ID from the public key
   */
  async getWebBundleId(): Promise<string> {
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', this.publicKey);
    const publicKeyBytes = new Uint8Array(publicKeyBuffer);
    
    // Extract the raw key (last 32 bytes of SPKI format)
    const rawKey = publicKeyBytes.slice(-32);
    
    // Add type suffix for IWA (0x01, 0x00)
    const keyWithSuffix = new Uint8Array(rawKey.length + 2);
    keyWithSuffix.set(rawKey);
    keyWithSuffix[rawKey.length] = 0x01;
    keyWithSuffix[rawKey.length + 1] = 0x00;
    
    // Base32 encode (RFC 4648, no padding)
    return this.base32Encode(keyWithSuffix).toLowerCase();
  }

  /**
   * Get the IWA origin URL
   */
  async getIWAOrigin(): Promise<string> {
    const bundleId = await this.getWebBundleId();
    return `isolated-app://${bundleId}/`;
  }

  private base32Encode(data: Uint8Array): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;

    for (const byte of data) {
      value = (value << 8) | byte;
      bits += 8;

      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 31];
    }

    return result;
  }
}

export class IWABuilder {
  private keyPair?: IWAKeyPair;

  constructor(keyPair?: IWAKeyPair) {
    this.keyPair = keyPair;
  }

  /**
   * Set the key pair for signing
   */
  setKeyPair(keyPair: IWAKeyPair): void {
    this.keyPair = keyPair;
  }

  /**
   * Build a Signed Web Bundle
   */
  async buildSignedWebBundle(options: IWABuildOptions): Promise<Uint8Array> {
    if (!this.keyPair) {
      throw new Error('Key pair required for signing');
    }

    // Ensure manifest has isolated flag
    const manifest = {
      ...options.manifest,
      isolated: true,
    };

    // Create manifest file
    const manifestFile: IWAFile = {
      path: '/.well-known/manifest.webmanifest',
      content: new TextEncoder().encode(JSON.stringify(manifest, null, 2)),
      mimeType: 'application/manifest+json',
    };

    // Combine all files
    const allFiles = [manifestFile, ...options.files];

    // Build the web bundle
    const bundle = await this.createWebBundle(allFiles, options.baseURL);

    // Sign the bundle
    const signedBundle = await this.signWebBundle(bundle, this.keyPair);

    return signedBundle;
  }

  /**
   * Create an unsigned web bundle
   */
  private async createWebBundle(files: IWAFile[], baseURL?: string): Promise<Uint8Array> {
    // This is a simplified web bundle format
    // In a real implementation, you'd use the full Web Bundle specification
    
    const encoder = new TextEncoder();
    const bundleData: Uint8Array[] = [];

    // Web Bundle magic bytes
    bundleData.push(new Uint8Array([0x84, 0x48, 0xF0, 0x9F, 0x8C, 0x90])); // 🌐 in UTF-8

    // Bundle version
    bundleData.push(new Uint8Array([0x62, 0x31, 0x00])); // "b1\0"

    // Primary URL (if provided)
    if (baseURL) {
      const urlBytes = encoder.encode(baseURL);
      bundleData.push(this.encodeLength(urlBytes.length));
      bundleData.push(urlBytes);
    } else {
      bundleData.push(new Uint8Array([0x00])); // No primary URL
    }

    // Manifest URL
    const manifestUrl = encoder.encode('/.well-known/manifest.webmanifest');
    bundleData.push(this.encodeLength(manifestUrl.length));
    bundleData.push(manifestUrl);

    // Number of resources
    bundleData.push(this.encodeLength(files.length));

    // Resources
    for (const file of files) {
      // URL
      const urlBytes = encoder.encode(file.path);
      bundleData.push(this.encodeLength(urlBytes.length));
      bundleData.push(urlBytes);

      // Headers
      const headers: Array<[string, string]> = [];
      if (file.mimeType) {
        headers.push(['content-type', file.mimeType]);
      }
      headers.push(['content-length', file.content.length.toString()]);

      bundleData.push(this.encodeLength(headers.length));
      for (const [name, value] of headers) {
        const nameBytes = encoder.encode(name);
        const valueBytes = encoder.encode(value);
        bundleData.push(this.encodeLength(nameBytes.length));
        bundleData.push(nameBytes);
        bundleData.push(this.encodeLength(valueBytes.length));
        bundleData.push(valueBytes);
      }

      // Content
      bundleData.push(this.encodeLength(file.content.length));
      bundleData.push(file.content);
    }

    // Combine all data
    const totalLength = bundleData.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of bundleData) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  /**
   * Sign a web bundle with integrity block
   */
  private async signWebBundle(bundle: Uint8Array, keyPair: IWAKeyPair): Promise<Uint8Array> {
    // Create integrity block
    const integrityBlock = await this.createIntegrityBlock(bundle, keyPair);

    // Combine integrity block and bundle
    const result = new Uint8Array(integrityBlock.length + bundle.length);
    result.set(integrityBlock, 0);
    result.set(bundle, integrityBlock.length);

    return result;
  }

  /**
   * Create integrity block for signing
   */
  private async createIntegrityBlock(bundle: Uint8Array, keyPair: IWAKeyPair): Promise<Uint8Array> {
    // Magic bytes for integrity block
    const magic = new Uint8Array([0x84, 0x48, 0xF0, 0x9F, 0x93, 0x9C]); // 📜 in UTF-8

    // Version
    const version = new Uint8Array([0x32, 0x00]); // "2\0"

    // Get public key
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const publicKeyBytes = new Uint8Array(publicKeyBuffer);

    // Create signature payload
    const signaturePayload = new Uint8Array(bundle.length + publicKeyBytes.length);
    signaturePayload.set(bundle, 0);
    signaturePayload.set(publicKeyBytes, bundle.length);

    // Sign the payload
    const signature = await crypto.subtle.sign('Ed25519', keyPair.privateKey, signaturePayload);
    const signatureBytes = new Uint8Array(signature);

    // Build integrity block
    const blockData: Uint8Array[] = [
      magic,
      version,
      this.encodeLength(publicKeyBytes.length),
      publicKeyBytes,
      this.encodeLength(signatureBytes.length),
      signatureBytes,
      this.encodeLength(bundle.length),
    ];

    const totalLength = blockData.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of blockData) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  /**
   * Encode length as variable-length integer
   */
  private encodeLength(length: number): Uint8Array {
    if (length < 0x80) {
      return new Uint8Array([length]);
    } else if (length < 0x4000) {
      return new Uint8Array([0x80 | (length >> 8), length & 0xFF]);
    } else if (length < 0x200000) {
      return new Uint8Array([
        0xC0 | (length >> 16),
        (length >> 8) & 0xFF,
        length & 0xFF,
      ]);
    } else {
      throw new Error('Length too large');
    }
  }

  /**
   * Create a simple HTML file for the IWA
   */
  static createHTMLFile(title: string, content: string, scriptPath?: string): IWAFile {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        .header {
            background: #f0f0f0;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <p>Generated Isolated Web App</p>
    </div>
    <div class="content">
        ${content}
    </div>
    ${scriptPath ? `<script type="module" src="${scriptPath}"></script>` : ''}
</body>
</html>`;

    return {
      path: '/index.html',
      content: new TextEncoder().encode(html),
      mimeType: 'text/html',
    };
  }

  /**
   * Create a JavaScript file for the IWA
   */
  static createJSFile(path: string, code: string): IWAFile {
    return {
      path,
      content: new TextEncoder().encode(code),
      mimeType: 'application/javascript',
    };
  }

  /**
   * Create a CSS file for the IWA
   */
  static createCSSFile(path: string, css: string): IWAFile {
    return {
      path,
      content: new TextEncoder().encode(css),
      mimeType: 'text/css',
    };
  }
}

/**
 * IWA Installation Helper
 */
export class IWAInstaller {
  /**
   * Install an IWA from a signed web bundle
   */
  static async installIWA(signedBundle: Uint8Array, name: string): Promise<void> {
    // Create a blob URL for the bundle
    const blob = new Blob([signedBundle], { type: 'application/webbundle' });
    const url = URL.createObjectURL(blob);

    try {
      // Trigger download for manual installation
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name}.swbn`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`IWA bundle downloaded: ${name}.swbn`);
      console.log('Install manually via chrome://web-app-internals/');
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Create installation instructions
   */
  static getInstallationInstructions(): string {
    return `
To install your Isolated Web App:

1. Download the .swbn file
2. Open Chrome and navigate to: chrome://web-app-internals/
3. Find the "Install IWA from Signed Web Bundle" section
4. Click "Select file..." and choose your .swbn file
5. The IWA will be installed and available in your apps

Note: Direct installation from JavaScript is not yet supported in Chrome.
This feature requires manual installation through the Chrome internals page.
    `.trim();
  }
}