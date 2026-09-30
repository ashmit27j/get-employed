# Built on Scrapling's image, which ships the browsers StealthyFetcher needs.
FROM pyd4vinci/scrapling:latest
WORKDIR /srv
RUN pip install --no-cache-dir "fastapi>=0.142" "uvicorn[standard]>=0.35" "pydantic-settings>=2.10"
COPY app ./app
EXPOSE 8000
ENTRYPOINT []
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
