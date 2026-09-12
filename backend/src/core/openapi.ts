export const openApiInfo: {
  openapi: string;
  info: { title: string; version: string };
  servers: { url: string }[];
} = {
  openapi: '3.1.0',
  info: {
    title: 'UnMute API',
    version: '0.0.0',
  },
  servers: [{ url: '/' }],
};
