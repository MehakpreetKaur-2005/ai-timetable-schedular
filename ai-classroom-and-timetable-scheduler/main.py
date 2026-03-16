"""
AI-Based Classroom and Timetable Scheduling System
Main FastAPI Application
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging
from datetime import datetime

from scheduler.models import (
    Course, Faculty, Room, TimeSlot, FacultyPreference,
    ScheduleRequest, ScheduleResponse, SystemState
)
from scheduler.ga import GeneticAlgorithm
from scheduler.learning import LearningEngine
from scheduler.ai_assistant import AISchedulingAssistant
from config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Timetable Scheduling System",
    description="Intelligent timetable generation using Adaptive Genetic Algorithm",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global system state (in-memory storage)
system_state = SystemState()
learning_engine = LearningEngine()
ai_assistant = AISchedulingAssistant()  # Groq AI integration
settings = get_settings()


@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "online",
        "message": "AI Timetable Scheduling System",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/courses/bulk")
def add_courses(courses: List[Course]):
    """Add multiple courses to the system"""
    try:
        for course in courses:
            system_state.courses[course.id] = course
        logger.info(f"Added {len(courses)} courses")
        return {
            "status": "success",
            "message": f"Added {len(courses)} courses",
            "total_courses": len(system_state.courses)
        }
    except Exception as e:
        logger.error(f"Error adding courses: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/faculty/bulk")
def add_faculty(faculty_list: List[Faculty]):
    """Add multiple faculty members to the system"""
    try:
        for faculty in faculty_list:
            system_state.faculty[faculty.id] = faculty
        logger.info(f"Added {len(faculty_list)} faculty members")
        return {
            "status": "success",
            "message": f"Added {len(faculty_list)} faculty members",
            "total_faculty": len(system_state.faculty)
        }
    except Exception as e:
        logger.error(f"Error adding faculty: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/rooms/bulk")
def add_rooms(rooms: List[Room]):
    """Add multiple rooms to the system"""
    try:
        for room in rooms:
            system_state.rooms[room.id] = room
        logger.info(f"Added {len(rooms)} rooms")
        return {
            "status": "success",
            "message": f"Added {len(rooms)} rooms",
            "total_rooms": len(system_state.rooms)
        }
    except Exception as e:
        logger.error(f"Error adding rooms: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/timeslots/bulk")
def add_timeslots(timeslots: List[TimeSlot]):
    """Add multiple time slots to the system"""
    try:
        for slot in timeslots:
            system_state.time_slots[slot.id] = slot
        logger.info(f"Added {len(timeslots)} time slots")
        return {
            "status": "success",
            "message": f"Added {len(timeslots)} time slots",
            "total_slots": len(system_state.time_slots)
        }
    except Exception as e:
        logger.error(f"Error adding time slots: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/preferences/bulk")
def add_preferences(preferences: List[FacultyPreference]):
    """Add faculty preferences for time slots"""
    try:
        for pref in preferences:
            key = f"{pref.faculty_id}_{pref.timeslot_id}"
            system_state.preferences[key] = pref
        logger.info(f"Added {len(preferences)} preferences")
        return {
            "status": "success",
            "message": f"Added {len(preferences)} preferences",
            "total_preferences": len(system_state.preferences)
        }
    except Exception as e:
        logger.error(f"Error adding preferences: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/system/status")
def get_system_status():
    """Get current system status and data counts"""
    return {
        "courses": len(system_state.courses),
        "faculty": len(system_state.faculty),
        "rooms": len(system_state.rooms),
        "time_slots": len(system_state.time_slots),
        "preferences": len(system_state.preferences),
        "learned_patterns": learning_engine.get_pattern_count(),
        "historical_schedules": len(learning_engine.history)
    }


@app.post("/api/schedule/generate", response_model=ScheduleResponse)
def generate_schedule(request: ScheduleRequest):
    """
    Generate optimal timetable using Adaptive Genetic Algorithm
    
    Parameters:
    - population_size: Number of candidate solutions
    - generations: Number of iterations
    - use_learning: Whether to use historical patterns
    """
    try:
        logger.info(f"Starting schedule generation with {request.population_size} population, "
                   f"{request.generations} generations")
        
        # Validate system has necessary data
        if not system_state.courses:
            raise HTTPException(status_code=400, detail="No courses defined")
        if not system_state.faculty:
            raise HTTPException(status_code=400, detail="No faculty defined")
        if not system_state.rooms:
            raise HTTPException(status_code=400, detail="No rooms defined")
        if not system_state.time_slots:
            raise HTTPException(status_code=400, detail="No time slots defined")
        
        # Initialize Genetic Algorithm
        ga = GeneticAlgorithm(
            system_state=system_state,
            learning_engine=learning_engine if request.use_learning else None,
            population_size=request.population_size,
            mutation_rate=0.1,  # Initial rate, will adapt
            crossover_rate=0.8
        )
        
        # Run optimization
        best_schedule, best_fitness, generation_stats = ga.evolve(
            generations=request.generations
        )
        
        # Store successful schedule for learning
        if best_fitness > 0.7:  # Only learn from good schedules
            learning_engine.add_schedule(best_schedule, best_fitness)
            logger.info(f"Stored schedule with fitness {best_fitness:.4f} for learning")
        
        # Format response
        formatted_schedule = []
        for gene in best_schedule:
            course = system_state.courses[gene.course_id]
            faculty = system_state.faculty[gene.faculty_id]
            room = system_state.rooms[gene.room_id]
            timeslot = system_state.time_slots[gene.timeslot_id]
            
            formatted_schedule.append({
                "course_id": gene.course_id,
                "course_name": course.name,
                "faculty_id": gene.faculty_id,
                "faculty_name": faculty.name,
                "room_id": gene.room_id,
                "room_name": room.name,
                "timeslot_id": gene.timeslot_id,
                "day": timeslot.day,
                "start_time": timeslot.start_time,
                "end_time": timeslot.end_time
            })
        
        logger.info(f"Schedule generation completed. Final fitness: {best_fitness:.4f}")
        
        # Get AI analysis of the generated schedule
        ai_analysis = None
        try:
            ai_analysis = ai_assistant.analyze_schedule_quality(
                schedule=formatted_schedule,
                fitness_score=best_fitness
            )
            logger.info("AI analysis completed")
        except Exception as e:
            logger.warning(f"AI analysis failed: {e}")
        
        return ScheduleResponse(
            schedule=formatted_schedule,
            fitness_score=best_fitness,
            generation_stats=generation_stats,
            metadata={
                "population_size": request.population_size,
                "generations": request.generations,
                "learning_enabled": request.use_learning,
                "ai_analysis": ai_analysis,
                "timestamp": datetime.now().isoformat()
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating schedule: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Schedule generation failed: {str(e)}")


@app.get("/api/schedule/history")
def get_schedule_history():
    """Get historical schedule performance data"""
    return {
        "total_schedules": len(learning_engine.history),
        "history": [
            {
                "fitness": fitness,
                "timestamp": datetime.now().isoformat()
            }
            for _, fitness in learning_engine.history[-10:]  # Last 10
        ]
    }


@app.delete("/api/system/reset")
def reset_system():
    """Reset all system data (useful for testing)"""
    global system_state, learning_engine
    system_state = SystemState()
    learning_engine = LearningEngine()
    logger.info("System reset completed")
    return {"status": "success", "message": "System reset completed"}


@app.get("/api/learning/patterns")
def get_learned_patterns():
    """Get learned scheduling patterns"""
    return {
        "pattern_count": learning_engine.get_pattern_count(),
        "patterns": learning_engine.get_top_patterns(limit=20)
    }


@app.post("/api/ai/analyze-faculty-fit")
def analyze_faculty_fit(course_id: str):
    """
    Use AI to analyze which faculty is best suited for a course
    """
    try:
        course = system_state.courses.get(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        faculty_list = [
            {
                "id": f.id,
                "name": f.name,
                "specializations": f.specializations,
                "max_hours_per_week": f.max_hours_per_week
            }
            for f in system_state.faculty.values()
        ]
        
        if not faculty_list:
            raise HTTPException(status_code=400, detail="No faculty available")
        
        result = ai_assistant.analyze_faculty_course_fit(
            course_name=course.name,
            course_details=f"Duration: {course.duration}h, Lab: {course.requires_lab}",
            faculty_list=faculty_list,
            student_strength=course.student_strength
        )
        
        return {
            "course": course.name,
            "ai_recommendation": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in AI faculty analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/analyze-schedule")
def analyze_schedule_with_ai(schedule_data: List[Dict]):
    """
    Use AI to analyze the quality of a generated schedule
    """
    try:
        if not schedule_data:
            raise HTTPException(status_code=400, detail="No schedule provided")
        
        # Calculate a mock fitness score if not provided
        fitness_score = 0.85  # This would come from actual evaluation
        
        result = ai_assistant.analyze_schedule_quality(
            schedule=schedule_data,
            fitness_score=fitness_score
        )
        
        return {
            "analysis": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in AI schedule analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/insights")
def get_ai_insights():
    """
    Get AI insights about the current scheduling problem
    """
    try:
        courses = [
            {
                "id": c.id,
                "name": c.name,
                "student_strength": c.student_strength,
                "duration": c.duration
            }
            for c in system_state.courses.values()
        ]
        
        faculty = [
            {
                "id": f.id,
                "name": f.name,
                "specializations": f.specializations,
                "max_hours": f.max_hours_per_week
            }
            for f in system_state.faculty.values()
        ]
        
        rooms = [
            {
                "id": r.id,
                "name": r.name,
                "capacity": r.capacity,
                "type": r.room_type
            }
            for r in system_state.rooms.values()
        ]
        
        if not courses or not faculty or not rooms:
            return {
                "message": "Insufficient data for analysis",
                "courses": len(courses),
                "faculty": len(faculty),
                "rooms": len(rooms)
            }
        
        insights = ai_assistant.get_scheduling_insights(
            courses=courses,
            faculty=faculty,
            rooms=rooms
        )
        
        return {
            "insights": insights,
            "data_summary": {
                "courses": len(courses),
                "faculty": len(faculty),
                "rooms": len(rooms),
                "time_slots": len(system_state.time_slots)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting AI insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)