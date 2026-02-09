const path = require('path');

module.exports = {
  testEnvironment: 'node',
  // In a real project, this would be 'jest-network-blocker'
  // Here we point to the local file for demonstration, or we can install the package from parent
  // But if we install from parent, we can just use the package name.
  // Let's assume we install it via npm install ../
  setupFilesAfterEnv: [
    'jest-network-blocker'
  ],
};