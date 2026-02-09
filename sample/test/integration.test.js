const http = require('http');
const { allowHost, blockHost } = require('jest-network-blocker');

describe('Sample Integration Test', () => {
  test('❌ should fail when accessing external API', (done) => {
    try {
      const req = http.request('http://www.google.com', (res) => {
        done(new Error('Should have been blocked!'));
      });

      req.on('error', (err) => {
        try {
          expect(err.message).toContain('NETWORK BLOCKED');
          console.log('Caught expected blocking error:', err.message.split('\n')[0]);
          done();
        } catch (e) {
          done(e);
        }
      });

      req.end();
    } catch (error) {
      // Handle synchronous throw
      try {
        expect(error.message).toContain('NETWORK BLOCKED');
        console.log('Caught expected blocking error (sync):', error.message.split('\n')[0]);
        done();
      } catch (e) {
        done(e);
      }
    }
  });

  test('✅ should pass when accessing localhost', (done) => {
    // We are just checking that it doesn't throw "NETWORK BLOCKED"
    // It might throw ECONNREFUSED if no server is running, which is fine.
    const req = http.request('http://localhost:3000', (res) => {
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
  });

  test('✅ should pass when host is whitelisted', (done) => {
    allowHost('example.com');
    
    const req = http.request('http://example.com', (res) => {
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
  });
});
