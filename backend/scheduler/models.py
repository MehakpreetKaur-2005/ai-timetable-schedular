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
    use_ai_optimization: bool = Field(default=True, description="Use AI to optimize after GA")
    ai_optimization_rounds: int = Field(default=3, ge=1, le=10, description="Max AI optimization rounds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "population_size": 100,
                "generations": 100,
                "use_learning": True,
                "use_ai_optimization": True,
                "ai_optimization_rounds": 3
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
    Global system state holding all entities.
    Acts as a cache/relay for data from Supabase.
    """
    def __init__(self):
        self.courses: Dict[str, Course] = {}
        self.faculty: Dict[str, Faculty] = {}
        self.rooms: Dict[str, Room] = {}
        self.time_slots: Dict[str, TimeSlot] = {}
        self.preferences: Dict[str, FacultyPreference] = {}
    
    def clear(self):
        """Clear the current state"""
        self.courses = {}
        self.faculty = {}
        self.rooms = {}
        self.time_slots = {}
        self.preferences = {}
        
    def sync_with_supabase(self, supabase):
        """Sync local state with data from Supabase"""
        try:
            self.clear()
            
            # Fetch Faculty
            faculty_data = supabase.table('faculty').select('*').execute()
            for f in faculty_data.data:
                self.faculty[f['id']] = Faculty(
                    id=f['id'],
                    name=f['name'],
                    department=f.get('department', ''),
                    max_hours_per_week=f.get('max_hours_per_week', 20),
                    specializations=f.get('specializations', [])
                )
                
            # Fetch Courses
            courses_data = supabase.table('courses').select('*').execute()
            for c in courses_data.data:
                self.courses[c['id']] = Course(
                    id=c['id'],
                    name=c['name'],
                    duration=c.get('weekly_hours', 1),
                    student_strength=c.get('student_strength', 0),
                    requires_lab=c.get('is_lab', False)
                )
                
            # Fetch Rooms
            rooms_data = supabase.table('rooms').select('*').execute()
            for r in rooms_data.data:
                self.rooms[r['id']] = Room(
                    id=r['id'],
                    name=r['name'],
                    capacity=r.get('capacity', 0),
                    room_type=r.get('type', 'lecture'),
                    has_projector=True
                )
                
            # Fetch Time Slots
            slots_data = supabase.table('time_slots').select('*').execute()
            for s in slots_data.data:
                self.time_slots[s['id']] = TimeSlot(
                    id=s['id'],
                    day=s['day'],
                    start_time=s['start_time'][:5], # HH:MM
                    end_time=s['end_time'][:5]
                )
                
            return True
        except Exception as e:
            print(f"Sync error: {e}")
            return False

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