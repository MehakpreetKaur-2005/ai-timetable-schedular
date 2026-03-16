"""
AI-Based Timetable Scheduling System
Scheduler Package Initialization
"""

__version__ = "1.0.0"
__author__ = "AI Scheduling Team"

from scheduler.models import (
    Course,
    Faculty,
    Room,
    TimeSlot,
    FacultyPreference,
    Gene,
    Chromosome,
    ScheduleRequest,
    ScheduleResponse,
    SystemState
)

from scheduler.fitness import FitnessEvaluator
from scheduler.ga import GeneticAlgorithm
from scheduler.learning import LearningEngine
from scheduler.ai_assistant import AISchedulingAssistant

__all__ = [
    "Course",
    "Faculty",
    "Room",
    "TimeSlot",
    "FacultyPreference",
    "Gene",
    "Chromosome",
    "ScheduleRequest",
    "ScheduleResponse",
    "SystemState",
    "FitnessEvaluator",
    "GeneticAlgorithm",
    "LearningEngine",
    "AISchedulingAssistant",
]