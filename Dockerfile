FROM node:22-alpine

ENV HOME=/home/app

WORKDIR /home/app

RUN npm install -g nodemon

EXPOSE 8081

# En développement, monter le répertoire du projet et lancer : npm run start:docker
CMD ["npm", "run", "start:docker"]
