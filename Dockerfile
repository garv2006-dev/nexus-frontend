# Use official Node runtime as a parent image
FROM node:20-alpine

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Expose port (Vite default)
EXPOSE 5173

# Start development server binding to 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host"]
