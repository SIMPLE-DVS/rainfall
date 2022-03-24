FROM python:3.8

RUN mkdir /app
WORKDIR /app

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY simple_backend simple_backend

RUN mkdir -p ../output_repositories/.archive

CMD gunicorn --bind 0.0.0.0:5000 --pythonpath simple_backend app:app

EXPOSE 5000
