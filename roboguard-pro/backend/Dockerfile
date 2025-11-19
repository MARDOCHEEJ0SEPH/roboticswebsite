FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src

# Copy frameworks directory
COPY ../frameworks /frameworks

# Expose port
EXPOSE 8000

# Start server
CMD ["npm", "start"]
