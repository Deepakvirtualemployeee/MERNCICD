# Build a minimal production image for the Express backend
FROM node:20-alpine

WORKDIR /app

# Install deps first (better cache)
COPY package*.json ./
RUN npm install --only=production

# Copy source
COPY src ./src

# Ensure uploads directory exists at runtime
RUN mkdir -p /app/uploads

ENV PORT=4000
EXPOSE 4000

CMD ["node", "src/server.js"]
