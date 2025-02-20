# Stage 1: Build the application
FROM oven/bun:latest AS builder

# Set working directory inside the builder image
WORKDIR /app

# Copy all project files into the container.
# If you have a .dockerignore file, ensure you include files necessary for the build.
COPY . .

# Install dependencies (bun.lockb and package.json are detected automatically)
RUN bun install

# Run the build script. Ensure that your package.json contains a "build" script (e.g., "tsc" or "bun build").
RUN bun run build

# Stage 2: Create the runtime image with the built application
FROM oven/bun:latest

# Set working directory inside the runtime image
WORKDIR /app

# Copy only the build output from the builder stage.
# Adjust the source folder if your build output directory is different.
COPY --from=builder /app/dist ./dist

# Expose the port your application listens on (adjust if needed)
EXPOSE 3000

# Run the built application.
# Adjust the command if your output file has a different name or if you use a different start command.
CMD ["bun", "run", "dist/server.js"]
