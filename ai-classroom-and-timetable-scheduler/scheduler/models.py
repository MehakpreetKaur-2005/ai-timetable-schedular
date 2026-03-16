"""
Data Models for Timetable Scheduling System
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from enum import Enum


class Course(BaseModel):
    """Course/Subject model"""
    id: str
    name: str
    duration: int = Field(description="Duration in hours", default=1)
    student_strength: int = Field(description="Number of students enrolled")
    requires_lab: bool = False
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "CS101",
                "name": "Data Structures",
                "duration": 1,
                "student_strength": 60,
                "requires_lab": False
            }
        }


class Faculty(BaseModel):
    """Faculty/Teacher model"""
    id: str
    name: str
    department: str
    max_hours_per_week: int = Field(default=20, description="Maximum teaching hours")
    specializations: List[str] = Field(default_factory=list)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "F001",
                "name": "Dr. John Smith",
                "department": "Computer Science",
                "max_hours_per_week": 18,
                "specializations": ["AI", "Data Structures"]
            }
        }


class Room(BaseModel):
    """Classroom/Lab model"""
    id: str
    name: str
    capacity: int = Field(description="Maximum student capacity")
    room_type: str = Field(description="lecture, lab, seminar")
    has_projector: bool = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "R101",
                "name": "Room 101",
                "capacity": 60,
                "room_type": "lecture",
                "has_projector": True
            }
        }


class TimeSlot(BaseModel):
    """Time slot model"""
    id: str
    day: str = Field(description="Monday, Tuesday, etc.")
    start_time: str = Field(description="HH:MM format")
    end_time: str = Field(description="HH:MM format")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "T001",
                "day": "Monday",
                "start_time": "09:00",
                "end_time": "10:00"
            }
        }


class FacultyPreference(BaseModel):
    """Faculty preference for specific time slots"""
    faculty_id: str
    timeslot_id: str
    preference_level: int = Field(
        ge=1, le=5,
        description="1=strongly avoid, 3=neutral, 5=strongly prefer"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "faculty_id": "F001",
                "timeslot_id": "T001",
                "preference_level": 5
            }
        }


class Gene(BaseModel):
    """
    Gene representation in chromosome
    Represents one class assignment
    """
    course_id: str
    faculty_id: str
    room_id: str
    timeslot_id: str


class Chromosome:
    """
    Chromosome represents a complete timetable solution
    List of genes (class assignments)
    """
    def __init__(self, genes: List[Gene]):
        self.genes = genes
        self.fitness: float = 0.0
    
    def __repr__(self):
        return f"Chromosome(genes={len(self.genes)}, fitness={self.fitness:.4f})"


class ScheduleRequest(BaseModel):
    """Request model for schedule generation"""
    population_size: int = Field(default=100, ge=20, le=500)
    generations: int = Field(default=100, ge=10, le=1000)
    use_learning: bool = Field(default=True, description="Use historical patterns")
    
    class Config:
        json_schema_extra = {
            "example": {
                "population_size": 100,
                "generations": 100,
                "use_learning": True
            }
        }


class ScheduleResponse(BaseModel):
    """Response model for generated schedule"""
    schedule: List[Dict]
    fitness_score: float
    generation_stats: Dict
    metadata: Dict


class SystemState:
    """
    Global system state holding all entities
    In-memory storage for the application
    """
    def __init__(self):
        self.courses: Dict[str, Course] = {}
        self.faculty: Dict[str, Faculty] = {}
        self.rooms: Dict[str, Room] = {}
        self.time_slots: Dict[str, TimeSlot] = {}
        self.preferences: Dict[str, FacultyPreference] = {}
    
    def get_course(self, course_id: str) -> Optional[Course]:
        return self.courses.get(course_id)
    
    def get_faculty(self, faculty_id: str) -> Optional[Faculty]:
        return self.faculty.get(faculty_id)
    
    def get_room(self, room_id: str) -> Optional[Room]:
        return self.rooms.get(room_id)
    
    def get_timeslot(self, timeslot_id: str) -> Optional[TimeSlot]:
        return self.time_slots.get(timeslot_id)
    
    def get_preference(self, faculty_id: str, timeslot_id: str) -> Optional[FacultyPreference]:
        key = f"{faculty_id}_{timeslot_id}"
        return self.preferences.get(key)