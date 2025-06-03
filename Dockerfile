FROM node:18-alpine

# set working directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose the port the app runs on
EXPOSE 3001

# run the app
CMD [ "npm", "run", "dev" ] 