# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the app
COPY . .

# Expose app port
EXPOSE 8080

# Start app
CMD ["npm", "start"]
