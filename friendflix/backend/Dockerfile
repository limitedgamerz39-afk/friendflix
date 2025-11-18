# Use Node.js 18 as the base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port 5001
EXPOSE 5001

# Start the application
CMD ["npm", "start"]