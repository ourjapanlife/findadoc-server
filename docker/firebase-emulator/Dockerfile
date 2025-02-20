FROM node:alpine

RUN apk add openjdk11

RUN npm install -g firebase-tools

WORKDIR /usr/src/app

CMD [ "firebase", "--project=find-a-doc-japan", "emulators:start", "--only", "firestore" ]
