FROM node:16-alpine

# Where the project is run
WORKDIR /opt/trivia

# Install dependencies and the project
COPY package*.json ./
RUN npm install
COPY . .

# Port which the container is listening
EXPOSE 8080

# Start the container
ENTRYPOINT npm run start