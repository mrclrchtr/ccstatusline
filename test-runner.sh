#!/bin/bash

# Test runner for ccstatusline project
# Usage: ./test-runner.sh [command] [args...]
# 
# Commands:
#   main [json-data]     - Run main ccstatusline (piped mode if json-data provided)
#   file <path> [data]   - Run specific TypeScript file with optional piped data

if [ $# -eq 0 ]; then
    echo "Usage: ./test-runner.sh [command] [args...]"
    echo ""
    echo "Commands:"
    echo "  main [json-data]     - Run main ccstatusline"
    echo "  file <path> [data]   - Run specific TypeScript file"
    echo ""
    echo "Examples:"
    echo "  ./test-runner.sh main"
    echo "  ./test-runner.sh main '{\"model\":{\"display_name\":\"Claude 3.5 Sonnet\"}}'"
    echo "  ./test-runner.sh file src/utils/colors.ts"
    exit 1
fi

COMMAND="$1"
ARG1="$2"
ARG2="$3"

case "$COMMAND" in
    "main")
        echo "Running ccstatusline main..."
        if [ -n "$ARG1" ]; then
            echo "With piped data: $ARG1"
            echo "----------------------------------------"
            echo "$ARG1" | bun run src/ccstatusline.ts
        else
            echo "TUI mode (no piped data)"
            echo "----------------------------------------"
            bun run src/ccstatusline.ts
        fi
        ;;
    
    
    "file")
        if [ -z "$ARG1" ]; then
            echo "Error: No file path provided"
            echo "Usage: ./test-runner.sh file <path> [data]"
            exit 1
        fi
        
        if [ ! -f "$ARG1" ]; then
            echo "Error: TypeScript file '$ARG1' not found"
            exit 1
        fi
        
        echo "Running: $ARG1"
        if [ -n "$ARG2" ]; then
            echo "With piped data: $ARG2"
            echo "----------------------------------------"
            echo "$ARG2" | bun run "$ARG1"
        else
            echo "Without input data"
            echo "----------------------------------------"
            bun run "$ARG1"
        fi
        ;;
    
    *)
        echo "Error: Unknown command '$COMMAND'"
        echo ""
        echo "Available commands: main, file"
        exit 1
        ;;
esac

echo ""
echo "Exit code: $?"