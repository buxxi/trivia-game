FROM node:24-alpine

# Where the project is run
WORKDIR /opt/trivia

# Install dependencies and the project
COPY package*.json ./
RUN npm install
COPY . .

# Port which the container is listening
EXPOSE 8080

# Start the container
ENV XDG_DATA_HOME=/opt/trivia/data
ENV XDG_CONFIG_HOME=/opt/trivia/conf
ENV XDG_CACHE_HOME=/opt/trivia/cache
ENTRYPOINT ["npm", "run", "start"]