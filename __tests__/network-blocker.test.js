const http = require('http');
const { allowHost, blockHost } = require('../index');

describe('Jest Network Blocker', () => {
  // We need to manually invoke the blocker logic since we are requiring it directly in the test file
  // and not via setupFilesAfterEnv in this specific test runner context, 
  // BUT since index.js has side effects (overriding http.request), simply requiring it *should* work if not already required.
  // However, Jest might have already loaded it if we configured it in jest.config.js.
  // For this isolated test, let's assume it's loaded.
  
  // Note: Since we are running this INSIDE the package we are developing, 
  // we need to make sure the side effects apply.
  
  test('should block external HTTP requests', (done) => {
    try {
      const req = http.request({
        host: 'www.google.com',
        port: 80,
        method: 'GET'
      }, (res) => {
        done(new Error('Request should have been blocked'));
      });
      
      // If it didn't throw synchronously, check for async error
      req.on('error', (err) => {
        try {
          expect(err.message).toContain('NETWORK BLOCKED');
          expect(err.message).toContain('www.google.com');
          done();
        } catch (e) {
          done(e);
        }
      });
      
      req.end();
    } catch (error) {
      // If it throws synchronously (which our blocker does)
      try {
        expect(error.message).toContain('NETWORK BLOCKED');
        expect(error.message).toContain('www.google.com');
        done();
      } catch (e) {
        done(e);
      }
    }
  });

  test('should allow localhost requests', (done) => {
    // We need a local server to test this, or just verify it doesn't throw the "BLOCKED" error immediately.
    // However, without a server, it will throw ECONNREFUSED, which is fine and means it wasn't blocked by our blocker.
    
    const req = http.request({
      host: 'localhost',
      port: 9999, // Random port
      method: 'GET'
    }, (res) => {
      // If we get here (unlikely without server), it wasn't blocked
      done();
    });

    req.on('error', (err) => {
      try {
        // If it's ECONNREFUSED, it passed our blocker and hit the OS network stack
        // If it's "NETWORK BLOCKED", then our blocker failed to allow localhost
        expect(err.message).not.toContain('NETWORK BLOCKED');
        done();
      } catch (e) {
        done(e);
      }
    });

    req.end();
  });

  test('should allow whitelisted hosts', (done) => {
    const host = 'example.com';
    allowHost(host);

    // Similar to localhost, we expect it NOT to be blocked by US.
    // It might fail with DNS error or timeout, but not our blocked message.
    // Actually, real network might be reachable if we allow it.
    // We don't want to rely on real network in this test if possible, but we can check if it passes our check.
    
    // For this test, we accept any outcome EXCEPT our block message.
    
    const req = http.request({
      host: host,
      port: 80,
      method: 'GET'
    }, (res) => {
      // It worked (connected)
      res.destroy();
      done();
    });

    req.on('error', (err) => {
      try {
        expect(err.message).not.toContain('NETWORK BLOCKED');
        done();
      } catch (e) {
        done(e);
      }
    });

    req.end();
    
    // Clean up
    blockHost(host);
  });
});
