/**
 * Network Blocker for Jest Tests
 * Blocks ALL network traffic: HTTP, HTTPS, TCP (databases), DNS
 *
 * Usage: Add to jest.config.js setupFilesAfterEnv
 *
 * Environment Variables:
 * - JEST_ALLOW_NETWORK=true : Disables network blocking (allows all network access)
 * - JEST_ALLOW_NETWORK=false : Enables network blocking (default)
 */

// Check if network blocking should be disabled
const ALLOW_NETWORK = process.env.JEST_ALLOW_NETWORK === 'true';

if (ALLOW_NETWORK) {
  console.log('🌐 Network blocker DISABLED - All network connections allowed');
  module.exports = {
    allowHost: () => {},
    blockHost: () => {},
  };
} else {
  // Network blocking is enabled
  const net = require('net');
  const http = require('http');
  const https = require('https');
  const dns = require('dns');

  // Store original functions
  const originalNetConnect = net.Socket.prototype.connect;
  const originalHttpRequest = http.request;
  const originalHttpsRequest = https.request;
  const originalDnsLookup = dns.lookup;
  
  // Whitelist for allowed connections (e.g., localhost test servers)
  const ALLOWED_HOSTS = [
    '127.0.0.1',
    'localhost',
    '::1',
  ];
  
  function isAllowedHost(host) {
    if (!host) return false;
    return ALLOWED_HOSTS.some(allowed => host.includes(allowed));
  }
  
  function blockNetworkError(type, host, port) {
    const error = new Error(
      `❌ NETWORK BLOCKED: Attempted ${type} connection to ${host}:${port}\n` +
      `All network connections are blocked in tests.\n` +
      `If this is intentional, mock the connection in your test.`
    );
    error.code = 'ENETUNREACH';
    return error;
  }
  
  // Block raw TCP connections (databases: MSSQL, PostgreSQL, MongoDB, Redis, etc.)
  net.Socket.prototype.connect = function(...args) {
    let host, port;
    const firstArg = args[0];

    // Handle different signatures of connect
    if (typeof firstArg === 'object' && firstArg !== null) {
      // connect(options, [connectListener])
      const options = firstArg;
      host = options.host || options.hostname;
      port = options.port;
      
      // If path is specified, it's an IPC connection (Unix socket), which is local
      if (options.path) {
        return originalNetConnect.apply(this, args);
      }
    } else if (typeof firstArg === 'string' && isNaN(Number(firstArg))) {
      // connect(path, [connectListener]) - IPC
      return originalNetConnect.apply(this, args);
    } else {
      // connect(port, [host], [connectListener])
      port = firstArg;
      host = args[1];
    }

    // If host is not provided, it defaults to localhost in Node.js
    if (!host) {
      host = 'localhost';
    }
  
    if (isAllowedHost(host)) {
      return originalNetConnect.apply(this, args);
    }
  
    console.error(`❌ Blocked TCP connection: ${host}:${port}`);
    const error = blockNetworkError('TCP', host, port);
    
    // Emit error asynchronously to match real behavior
    process.nextTick(() => {
      this.emit('error', error);
    });
    
    return this;
  };
  
  // Block HTTP requests
  http.request = function(...args) {
    const options = args[0];
    const host = options?.host || options?.hostname;
  
    if (isAllowedHost(host)) {
      return originalHttpRequest.apply(this, args);
    }
  
    console.error(`❌ Blocked HTTP request: ${host}`);
    throw blockNetworkError('HTTP', host, options?.port || 80);
  };
  
  // Block HTTPS requests
  https.request = function(...args) {
    const options = args[0];
    const host = options?.host || options?.hostname;
  
    if (isAllowedHost(host)) {
      return originalHttpsRequest.apply(this, args);
    }
  
    console.error(`❌ Blocked HTTPS request: ${host}`);
    throw blockNetworkError('HTTPS', host, options?.port || 443);
  };
  
  // Block DNS lookups
  dns.lookup = function(hostname, ...args) {
    if (isAllowedHost(hostname)) {
      return originalDnsLookup.apply(this, [hostname, ...args]);
    }
  
    console.error(`❌ Blocked DNS lookup: ${hostname}`);
    const callback = args[args.length - 1];
    if (typeof callback === 'function') {
      const error = blockNetworkError('DNS', hostname, 'N/A');
      process.nextTick(() => callback(error));
    }
  };
  
  // Restore original functions after all tests
  afterAll(() => {
    net.Socket.prototype.connect = originalNetConnect;
    http.request = originalHttpRequest;
    https.request = originalHttpsRequest;
    dns.lookup = originalDnsLookup;
  });
  
  console.log('🔒 Network blocker active - All external connections blocked');

  module.exports = {
    allowHost: (host) => {
      if (!ALLOWED_HOSTS.includes(host)) {
        ALLOWED_HOSTS.push(host);
        console.log(`✅ Allowed host: ${host}`);
      }
    },
    blockHost: (host) => {
      const index = ALLOWED_HOSTS.indexOf(host);
      if (index > -1) {
        ALLOWED_HOSTS.splice(index, 1);
        console.log(`❌ Blocked host: ${host}`);
      }
    },
  };
}