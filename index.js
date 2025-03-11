import Fastify from "fastify";
import dotenv from "dotenv";
import fastifyFormBody from "@fastify/formbody";
import fastifyWs from "@fastify/websocket";
import { registerInboundRoutes } from './inbound-calls.js';
import { registerOutboundRoutes } from './outbound-calls.js';

// Load environment variables from .env file
try {
  const result = dotenv.config();
  if (result.error) {
    throw result.error;
  }
  console.log('Successfully loaded environment variables from .env file');
} catch (error) {
  console.error('Error loading .env file:', error.message);
}

// Check required environment variables at startup
const requiredEnvVars = [
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_AGENT_ID',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables in .env file:', missingEnvVars);
  console.error('Current environment variables from .env:', {
    ELEVENLABS_API_KEY: !!process.env.ELEVENLABS_API_KEY,
    ELEVENLABS_AGENT_ID: !!process.env.ELEVENLABS_AGENT_ID,
    TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: !!process.env.TWILIO_PHONE_NUMBER
  });
  process.exit(1);
}

// Initialize Fastify server
const fastify = Fastify({
  logger: true // Enable logging
});

fastify.register(fastifyFormBody);
fastify.register(fastifyWs);

const PORT = process.env.PORT || 8000;

// Root route for health check
fastify.get("/", async (_, reply) => {
  reply.send({ message: "Server is running" });
});

// Start the Fastify server
const start = async () => {
  try {
    // Register route handlers
    await registerInboundRoutes(fastify);
    await registerOutboundRoutes(fastify);

    // Start listening
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`[Server] Listening on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

start();