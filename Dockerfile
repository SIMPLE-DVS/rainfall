# Copyright (C) 2023 Università degli Studi di Camerino and Sigma S.p.A.
# Authors: Alessandro Antinori, Rosario Capparuccia, Riccardo Coltrinari, Flavio Corradini, Marco Piangerelli, Barbara Re, Marco Scarpetta
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

FROM node:16.14.2-slim AS frontend

RUN mkdir /app
WORKDIR /app

COPY simple-ui ./

RUN yarn
RUN yarn build


FROM python:3.9-slim AS backend

ARG PORT=5000
ENV PORT=${PORT}
ENV MODE=PRODUCTION

RUN mkdir /app
WORKDIR /app
RUN mkdir -p output_repositories/.archive

RUN apt-get -y update
RUN apt-get -y install git

COPY simple-backend/simple_backend simple_backend/
COPY simple-backend/requirements.txt ./
RUN pip install -r requirements.txt

COPY --from=frontend /app/dist/spa /app/simple_backend/static

CMD gunicorn --bind 0.0.0.0:${PORT} -t 0 -w 4 -k uvicorn.workers.UvicornWorker --pythonpath simple_backend app:create_app

EXPOSE ${PORT}
