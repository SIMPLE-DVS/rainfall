FROM python:3.8

ARG PORT=5000
ENV PORT=${PORT}

RUN mkdir /app
WORKDIR /app

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY simple_backend simple_backend
RUN mkdir -p output_repositories/.archive

CMD gunicorn --bind 0.0.0.0:${PORT} -w 4 -k uvicorn.workers.UvicornWorker --pythonpath simple_backend app:create_app

EXPOSE ${PORT}
