FROM node:16.19.0

# Create app directory
WORKDIR /opt/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm config set strict-ssl false
RUN npm config set registry "http://registry.npmjs.org/"
RUN npm --proxy http://172.16.20.90:8080 install

# RUN npm install



# Bundle app source
COPY . .
# RUN npm run build
 
EXPOSE 5000
CMD [ "npm", "run", "docker" ]
