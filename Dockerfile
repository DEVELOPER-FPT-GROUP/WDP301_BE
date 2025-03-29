# Base image with Node.js v18 LTS (Ubuntu-based)
FROM node:18-slim

# Optional: install Python & build tools needed by node-gyp
RUN apt-get update && apt-get install -y \
  python3 \
  g++ \
  make \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (including tfjs-node)
RUN npm install

# Copy the rest of the source code
COPY . .

# Build NestJS
RUN npm run build

# Expose app port (adjust if your app uses different one)
EXPOSE 3000

# Run the app
CMD ["npm", "run", "start:prod"]
