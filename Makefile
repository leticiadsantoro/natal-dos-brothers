.DEFAULT_GOAL := up
.PHONY: up help

# Inicia os dois processos; Ctrl+C encerra Next.js e PostgreSQL.
up: .env
	@node --env-file-if-exists=.env scripts/up.mjs

.env: .env.example
	@test -f .env || cp .env.example .env

help:
	@echo "make up  - inicia PostgreSQL e Next.js (Ctrl+C encerra os dois)"
