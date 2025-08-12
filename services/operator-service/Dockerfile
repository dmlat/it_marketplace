# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages
RUN npm install

# Copy the rest of the application's source code from your host to your image filesystem.
COPY . .

# Your app binds to port 3002 so you'll use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE 3002

# Define the command to run your app
CMD [ "node", "index.js" ]
