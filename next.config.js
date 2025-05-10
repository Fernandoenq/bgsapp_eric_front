// next.config.js
module.exports = {
    images: {
      domains: ['localhost'],
    },
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            {
              key: "Content-Security-Policy",
              value: "script-src 'self' 'unsafe-inline'; object-src 'none';", // Inclui 'unsafe-inline' na política
            },
          ],
        },
      ];
    },
  };
  