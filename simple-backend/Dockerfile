FROM python:3.8

RUN mkdir /app
WORKDIR /app

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY simple_backend simple_backend
COPY docs docs
RUN mkdir -p output_repositories/.archive

CMD gunicorn --bind 0.0.0.0:5000 -w 4 -k uvicorn.workers.UvicornWorker gunicorn --pythonpath simple_backend app:create_app

EXPOSE 5000
