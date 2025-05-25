SHELL := /usr/bin/env bash

.PHONY: help install lint test build dev docker-up docker-down all

help:
	@echo "Usage: make [TARGET]"
	@echo ""
	@echo "Targets:"
	@echo "  help          Show this help message"
	@echo "  install       Install backend & frontend dependencies"
	@echo "  lint          Run lint checks across backend & frontend"
	@echo "  test          Run tests for backend & frontend"
	@echo "  build         Build backend & frontend projects"
	@echo "  dev           Start backend & frontend in development mode"
	@echo "  docker-up     Launch all services (db, backend, frontend, nginx) via Docker Compose"
	@echo "  docker-down   Stop all services"
	@echo "  all           install, lint, test, and build everything"

install:
	npm --prefix backend install
	npm --prefix frontend install

lint:
	npm --prefix backend run lint && npm --prefix frontend run lint

test:
	npm --prefix backend test && npm --prefix frontend test

build:
	npm --prefix backend run build && npm --prefix frontend run build

dev:
	@docker-compose up -d db
	@echo "Waiting for database to initialize..."
	@until nc -z localhost 3306; do sleep 1; done
	@npm --prefix backend run dev & npm --prefix frontend run dev

docker-up:
	docker-compose up --build -d

docker-down:
	docker-compose down

all: install lint test build 