.PHONY: install build dev preview lint clean help

# Default target
help:
	@echo "AsterismChat - Available Commands:"
	@echo "  make install   - Install npm dependencies"
	@echo "  make build     - Build the production project"
	@echo "  make dev       - Start the development server"
	@echo "  make preview   - Preview the production build"
	@echo "  make lint      - Run ESLint"
	@echo "  make clean     - Remove build artifacts"

install:
	npm install

build:
	npm run build

dev:
	npm run dev

preview:
	npm run preview

lint:
	npm run lint

clean:
	rm -rf dist node_modules/.vite