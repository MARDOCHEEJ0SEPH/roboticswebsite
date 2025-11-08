# Dockerfile for Rust Neural Core
FROM rust:1.74 as builder

WORKDIR /usr/src/neural-core

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Copy source code
COPY src ./src

# Build for release
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /usr/src/neural-core/target/release/neural-core /app/neural-core

# Set environment
ENV RUST_LOG=info

EXPOSE 8080

CMD ["./neural-core"]
