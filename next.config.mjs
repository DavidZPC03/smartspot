let userConfig = undefined;
try {
  userConfig = await import('./v0-user-next.config');
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  webpack: (config) => {
    config.infrastructureLogging = { level: 'error' };
    return config;
  },
};

mergeConfig(nextConfig, userConfig);

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return;
  }

  for (const key in userConfig) {
    if (key === 'webpack' && typeof userConfig[key] === 'function') {
      // Si la clave es 'webpack' y es una función, combinamos las funciones
      const userWebpack = userConfig[key];
      const baseWebpack = nextConfig[key] || ((config) => config);
      nextConfig[key] = (config) => {
        const modifiedConfig = baseWebpack(config);
        return userWebpack(modifiedConfig);
      };
    } else if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      // Si es un objeto, lo fusionamos
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      };
    } else {
      // En otros casos, simplemente reemplazamos
      nextConfig[key] = userConfig[key];
    }
  }
}

export default nextConfig;