# -------------------------------------------------------
# 1) Build Stage
# -------------------------------------------------------
    FROM node:18-alpine AS build

    # Create and set the working directory inside the container
    WORKDIR /app
    
    # Copy package.json and package-lock.json (if exists) first
    COPY package*.json ./
    
    # Install dependencies
    RUN npm install
    
    # Copy the rest of your project files
    COPY . .
    
    # Build your Vite app (output goes to /app/dist)
    RUN npm run build
    
    # -------------------------------------------------------
    # 2) Production Stage
    # -------------------------------------------------------
    FROM node:18-alpine
    
    # Create and set the working directory for production
    WORKDIR /app
    
    # Copy the built output from the "build" stage
    COPY --from=build /app/dist ./dist
    
    # Install 'serve' globally, which can serve the built files
    RUN npm install --global serve
    
    # Expose port 8080 to the outside world
    EXPOSE 8080
    
    # Command to serve the app
    CMD ["serve", "-s", "dist", "-p", "8080"]
    