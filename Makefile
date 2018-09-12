all: compose-setup

prepare:
	touch .bash_history
	touch .env

compose:
	docker-compose up -d

compose-stop:
	docker-compose stop

compose-logs:
	docker logs -f --tail=30 tasker-plan

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

db-migrate-test:
	npm run sequelize db:migrate:undo:all
	make db-migrate

db-migration-create:
	npm run sequelize migration:create

compose-fill-db:
	docker-compose run web make fil-db

fill-db:
	npm run gulp fill-db

compose-kill:
	docker-compose kill

compose-build:
	docker-compose build

compose-test:
	docker-compose run web make test

compose-test-watch:
	docker-compose run web make test-watch

compose-bash:
	docker-compose run web bash

compose-console:
	docker-compose run web npm run gulp console

lint:
	npm run eslint .

start:
	DEBUG="tasker*" NODE_ENV=development npm run nodemon -- --watch . --ignore postgres-data/  --ext js --exec npm run gulp -- server

test:
	npm test

test-watch:
	npm run -- test --watch

test-coverage:
	npm run -- test-coverage
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
