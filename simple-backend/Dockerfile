FROM python:3.8

RUN mkdir /app
WORKDIR /app

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY simple_backend simple_backend
COPY docs docs
RUN mkdir -p output_repositories/.archive

CMD gunicorn --bind 0.0.0.0:5000 --pythonpath simple_backend app:app -k eventlet -w 4 --threads 4 -t 600 --worker-connections 1000

EXPOSE 5000
