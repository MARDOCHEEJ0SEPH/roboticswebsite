# Makefile for Assembly Performance Kernels
# Autonomous Robotics Website - High-Performance Computing

ASM = nasm
CC = gcc
ASMFLAGS = -f elf64
CFLAGS = -Wall -O3 -march=native -mtune=native
LDFLAGS = -lm

TARGET = performance_test
ASM_OBJ = performance_kernels.o
C_OBJ = kernel_wrapper.o

all: $(TARGET)

$(ASM_OBJ): performance_kernels.asm
	@echo "🔧 Assembling performance kernels..."
	$(ASM) $(ASMFLAGS) $< -o $@

$(C_OBJ): kernel_wrapper.c
	@echo "🔨 Compiling C wrapper..."
	$(CC) $(CFLAGS) -c $< -o $@

$(TARGET): $(ASM_OBJ) $(C_OBJ)
	@echo "🔗 Linking executable..."
	$(CC) $(ASM_OBJ) $(C_OBJ) $(LDFLAGS) -o $@
	@echo "✅ Build complete!"

run: $(TARGET)
	@echo "🚀 Running performance tests..."
	@./$(TARGET)

clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -f $(ASM_OBJ) $(C_OBJ) $(TARGET)
	@echo "✅ Clean complete!"

.PHONY: all run clean
