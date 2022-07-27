import datetime
from dataclasses import dataclass
from pathlib import Path


@dataclass
class DataflowScript:
    script_name: str
    rows: int
    size: int
    content: str = ""


@dataclass
class DataflowMetadata:
    created_at: datetime.datetime = None
    requirements: str = ""


@dataclass
class DataflowUI:
    content: str = ""


@dataclass
class Dataflow:
    id: str
    path: Path
    script: DataflowScript = None
    metadata: DataflowMetadata = None
    ui: DataflowUI = None
