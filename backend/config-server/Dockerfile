# Use OpenJDK 17 as base image
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Copy the jar (replace with actual jar name)
COPY target/config-server-0.0.1-SNAPSHOT.jar app.jar

# Expose port
EXPOSE 8888

# Run the jar
ENTRYPOINT ["java","-jar","app.jar"]
