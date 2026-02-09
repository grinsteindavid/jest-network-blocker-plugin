# Jest Network Blocker

A Jest plugin that blocks **ALL** external network traffic (HTTP, HTTPS, TCP, DNS) to ensure your tests are truly isolated and don't accidentally rely on external services.

It helps prevent flaky tests caused by network dependency and ensures you are properly mocking all external interactions.

## Features

- Blocks HTTP and HTTPS requests
- Blocks raw TCP connections (catches database connections like Postgres, MongoDB, Redis, etc.)
- Blocks DNS lookups
- Whitelists `localhost`, `127.0.0.1`, and `::1` by default
- Easy to disable via environment variable for debugging or specific CI scenarios

## Installation

```bash
npm install --save-dev jest-network-blocker
# or
yarn add --dev jest-network-blocker
# or
pnpm add -D jest-network-blocker
```

## Usage

Add the package to your `jest.config.js` in the `setupFilesAfterEnv` array.

```javascript
// jest.config.js
module.exports = {
  // ... other config
  setupFilesAfterEnv: [
    // ... other setup files
    'jest-network-blocker',
  ],
};
```

Or if you are using `setupFilesAfterEnv` pointing to a setup file:

```javascript
// jest.setup.js
require('jest-network-blocker');
```

Once installed and configured, any test that attempts to make a network request to a non-local address will fail with a descriptive error.

### Example Error

```
Error: ❌ NETWORK BLOCKED: Attempted HTTP connection to api.example.com:80
All network connections are blocked in tests.
If this is intentional, mock the connection in your test.
```

## Configuration

### Disabling the Blocker

You can temporarily disable the network blocker (allowing all traffic) by setting the `JEST_ALLOW_NETWORK` environment variable to `true`.

```bash
JEST_ALLOW_NETWORK=true npm test
```

### Allowing Specific Hosts

You can programmatically allow or block specific hosts in your test files or setup files.

```javascript
const { allowHost, blockHost } = require('jest-network-blocker');

// Allow a specific host
allowHost('api.stripe.com');

// Block it again
blockHost('api.stripe.com');
```

**Note**: `localhost`, `127.0.0.1`, and `::1` are allowed by default.

## License

MIT
