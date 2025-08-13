/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "./style.css";
import DOMPurify from "dompurify";
import { DemoServer } from "./server.js";

const parent_container = document.querySelector("#app") as HTMLDivElement;

let sanitizerPolicy: any = null!;
let urlPolicy: any = null!;
let demoServer: DemoServer | null = null;

// This block will always execute in Chrome, so the policies will be assigned.
if (window.trustedTypes && window.trustedTypes.createPolicy) {
    // Policy for sanitizing HTML strings before assigning them to innerHTML.
    sanitizerPolicy = window.trustedTypes.createPolicy("iwa-sanitizer", {
        createHTML: (string) => DOMPurify.sanitize(string),
    });

    // Policy for creating TrustedScriptURL. This is required for navigator.serviceWorker.register().
    // For this app, we can just pass the URL through, as we know it's safe.
    urlPolicy = window.trustedTypes.createPolicy("iwa-url-policy", {
        createScriptURL: (url) => url,
    });
}

/**
 * Creates the server control UI
 */
function createServerUI() {
    const serverSection = document.createElement("div");
    serverSection.style.cssText = `
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    const title = document.createElement("h2");
    title.textContent = "🚀 HTTP/WebSocket Server";
    title.style.cssText = "margin-top: 0; color: #495057;";

    const modeSelector = document.createElement("div");
    modeSelector.style.cssText = "margin: 15px 0;";
    
    const modeLabel = document.createElement("label");
    modeLabel.textContent = "Server Mode: ";
    modeLabel.style.cssText = "font-weight: bold; margin-right: 10px;";
    
    const modeSelect = document.createElement("select");
    modeSelect.id = "server-mode";
    modeSelect.style.cssText = "padding: 5px 10px; border-radius: 4px; border: 1px solid #ccc;";
    modeSelect.innerHTML = `
        <option value="basic">Basic HTTP Server (Port 44818)</option>
        <option value="enhanced">Enhanced HTTP Server (Port 44818)</option>
        <option value="tls">TLS/HTTPS Server (Port 44819)</option>
    `;

    modeSelector.appendChild(modeLabel);
    modeSelector.appendChild(modeSelect);

    const status = document.createElement("div");
    status.id = "server-status";
    status.style.cssText = `
        padding: 10px;
        border-radius: 4px;
        margin: 10px 0;
        font-weight: bold;
    `;

    const startButton = document.createElement("button");
    startButton.textContent = "Start Server";
    startButton.style.cssText = `
        background: #28a745;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        margin-right: 10px;
        font-size: 14px;
    `;

    const stopButton = document.createElement("button");
    stopButton.textContent = "Stop Server";
    stopButton.style.cssText = `
        background: #dc3545;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        margin-right: 10px;
        font-size: 14px;
        opacity: 0.5;
    `;
    stopButton.disabled = true;

    const testButton = document.createElement("button");
    testButton.textContent = "Open Server Page";
    testButton.style.cssText = `
        background: #007bff;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        opacity: 0.5;
    `;
    testButton.disabled = true;

    const info = document.createElement("div");
    info.id = "server-info";
    info.style.cssText = `
        margin-top: 15px;
        padding: 10px;
        background: #e9ecef;
        border-radius: 4px;
        font-size: 14px;
        line-height: 1.5;
    `;

    function updateServerInfo() {
        const mode = modeSelect.value as 'basic' | 'enhanced' | 'tls';
        const port = mode === 'tls' ? 44819 : 44818;
        const protocol = mode === 'tls' ? 'https' : 'http';
        const features: Record<string, string[]> = {
            basic: ['HTTP/1.1', 'WebSocket', 'CORS'],
            enhanced: ['Enhanced HTTP/1.1', 'WebSocket', 'CORS', 'Advanced Parsing', 'Partial Requests'],
            tls: ['HTTPS/TLS', 'Secure WebSocket', 'CORS', 'Security Headers', 'Certificate Management']
        };

        info.innerHTML = sanitizerPolicy.createHTML(`
            <strong>Server Details:</strong><br>
            • Mode: ${mode.toUpperCase()}<br>
            • Host: 0.0.0.0<br>
            • Port: ${port}<br>
            • Access: <code>${protocol}://localhost:${port}</code><br>
            • Features: ${features[mode].join(', ')}
        `);
    }

    function updateStatus(running: boolean) {
        const mode = modeSelect.value;
        const port = mode === 'tls' ? 44819 : 44818;
        
        if (running) {
            status.textContent = `🟢 ${mode.toUpperCase()} Server Running (Port ${port})`;
            status.style.background = "#d4edda";
            status.style.color = "#155724";
            startButton.disabled = true;
            startButton.style.opacity = "0.5";
            stopButton.disabled = false;
            stopButton.style.opacity = "1";
            testButton.disabled = false;
            testButton.style.opacity = "1";
            modeSelect.disabled = true;
        } else {
            status.textContent = "🔴 Server Stopped";
            status.style.background = "#f8d7da";
            status.style.color = "#721c24";
            startButton.disabled = false;
            startButton.style.opacity = "1";
            stopButton.disabled = true;
            stopButton.style.opacity = "0.5";
            testButton.disabled = true;
            testButton.style.opacity = "0.5";
            modeSelect.disabled = false;
        }
    }

    modeSelect.addEventListener("change", updateServerInfo);

    startButton.addEventListener("click", async () => {
        try {
            const mode = modeSelect.value as 'basic' | 'enhanced' | 'tls';
            if (!demoServer || demoServer.getStatus().mode !== mode) {
                demoServer = new DemoServer(mode);
            }
            await demoServer.start();
            updateStatus(true);
        } catch (error) {
            console.error("Failed to start server:", error);
            alert("Failed to start server. Check console for details.");
        }
    });

    stopButton.addEventListener("click", async () => {
        try {
            if (demoServer) {
                await demoServer.stop();
                updateStatus(false);
            }
        } catch (error) {
            console.error("Failed to stop server:", error);
            alert("Failed to stop server. Check console for details.");
        }
    });

    testButton.addEventListener("click", () => {
        const mode = modeSelect.value;
        const port = mode === 'tls' ? 44819 : 44818;
        const protocol = mode === 'tls' ? 'https' : 'http';
        window.open(`${protocol}://localhost:${port}`, "_blank");
    });

    updateStatus(false);
    updateServerInfo();

    serverSection.appendChild(title);
    serverSection.appendChild(modeSelector);
    serverSection.appendChild(status);
    serverSection.appendChild(startButton);
    serverSection.appendChild(stopButton);
    serverSection.appendChild(testButton);
    serverSection.appendChild(info);

    return serverSection;
}

/**
 * Loads images and other content when the app is online.
 * It first clears the container to prevent duplicate content.
 */
function loadOnlineContent() {
    parent_container.innerHTML = sanitizerPolicy.createHTML("");

    const icon_elements: [string, string][] = [
        [
            "https://upload.wikimedia.org/wikipedia/commons/f/f1/Vitejs-logo.svg",
            "https://vite.dev/",
        ],
        [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Typescript_logo_2020.svg/250px-Typescript_logo_2020.svg.png",
            "https://www.typescriptlang.org/docs/",
        ],
        [
            "https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg",
            "https://chromeos.dev/en/web/isolated-web-apps",
        ],
    ];

    for (const [icon_url, href_url] of icon_elements) {
        const href_element: HTMLAnchorElement = document.createElement("a");
        href_element.href = href_url;

        const img_element: HTMLImageElement = document.createElement("img");
        img_element.crossOrigin = "anonymous";
        img_element.classList.add("logo");
        img_element.src = icon_url;

        href_element.appendChild(img_element);
        parent_container.appendChild(href_element);
    }

    const title = document.createElement("h1");
    title.textContent = "Isolated Web App with HTTP/WebSocket Server";

    parent_container.appendChild(title);

    const p_docs = document.createElement("p");
    p_docs.classList.add("read-the-docs");
    p_docs.textContent = "Learn more by clicking the logos above.";
    parent_container.appendChild(p_docs);

    // Add server UI
    parent_container.appendChild(createServerUI());
}

/**
 * Displays an offline message in the app container.
 */
function showOfflineMessage() {
    parent_container.innerHTML = sanitizerPolicy.createHTML("");
    const p_offline = document.createElement("p");

    const title = document.createElement("h1");
    title.textContent = "Isolated Web App with HTTP/WebSocket Server";

    parent_container.appendChild(title);

    p_offline.classList.add("read-the-docs");
    p_offline.textContent = "You are offline. Please check your connection.";
    parent_container.appendChild(p_offline);

    // Add server UI even when offline (server can still work locally)
    parent_container.appendChild(createServerUI());
}

window.addEventListener("load", () => {
    if ("serviceWorker" in navigator) {
        // Use the trusted type policy to create a TrustedScriptURL.
        const swUrl = urlPolicy.createScriptURL("./service-worker.js");

        navigator.serviceWorker
            .register(swUrl)
            .then((registration) => {
                console.log("Service Worker registered with scope:", registration.scope);
            })
            .catch((error) => {
                console.error("Service Worker registration failed:", error);
            });
    }
});

window.addEventListener("online", () => {
    loadOnlineContent();
});

window.addEventListener("offline", () => {
    showOfflineMessage();
});

// Clean up server on page unload
window.addEventListener("beforeunload", async () => {
    if (demoServer) {
        try {
            await demoServer.stop();
        } catch (error) {
            console.error("Error stopping server on unload:", error);
        }
    }
});

if (navigator.onLine) {
    loadOnlineContent();
} else {
    showOfflineMessage();
}
