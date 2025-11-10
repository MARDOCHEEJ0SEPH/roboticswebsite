FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .
COPY ../frameworks /frameworks

EXPOSE 8001

CMD ["python", "main.py"]
