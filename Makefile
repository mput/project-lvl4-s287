all: compose-setup

prepare:
	touch .bash_history
	touch .env

compose:
	docker-compose up -d

compose-logs:
	docker logs -f --tail=30 tp

compose-install:
	docker-compose run web npm install

compose-setup: prepare compose-build compose-install compose-db-setup
	npm run flow-typed install

compose-db-setup:
	docker-compose run web npm run sequelize db:migrate

db-migrate:
	npm run sequelize db:migrate

db-migrate-undo:
	npm run sequelize db:migrate:undo

db-migration-create:
	npm run sequelize migration:create

compose-kill:
	docker-compose kill

compose-build:
	docker-compose build

compose-test:
	docker-compose run web npm test

compose-bash:
	docker-compose run web bash

compose-console:
	docker-compose-npm run gulp console

compose-lint:
	docker-compose run web npm run eslint .

start:
	DEBUG="tasker*" NODE_ENV=development npm run nodemon -- --watch .  --ext js,pug --exec npm run gulp -- server

test:
	npm test

build:
	npm run build

compose-check-types:
	docker-compose run web npm run flow

compose-dist-build:
	rm -rf dist
	docker-compose run web npm run build

compose-publish: compose-dist-build
	docker-compose run web npm publish

.PHONY: test
