From node:8.16.1-jessie
Run mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app
COPY . /usr/src/app
Expose 8000:8000
CMD ["node", "server.js"]